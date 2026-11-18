-- =============================================================================
-- Identity and access: roles, profiles, preferences, role assignments, audit log
-- =============================================================================
-- Users themselves live in auth.users (managed by Supabase Auth). Every auth
-- user gets a public profile and a preferences row via the on_auth_user_created
-- trigger below.
--
-- Role model (hierarchical, see docs/AUTH_AND_ROLES.md):
--   visitor (0) < registered_user (10) < contributor (20)
--     < administrator (30) < super_administrator (40)
-- `visitor` and `registered_user` are implicit: anyone signed out is a visitor,
-- and every signed-in user with an active profile is a registered user. Only
-- elevated roles are stored in public.user_roles.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Roles catalog
-- -----------------------------------------------------------------------------
create table public.roles (
  key text primary key,
  name text not null,
  description text not null default '',
  rank smallint not null,
  is_assignable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_key_format check (key ~ '^[a-z][a-z_]*$'),
  constraint roles_rank_unique unique (rank),
  constraint roles_rank_range check (rank between 0 and 1000)
);

comment on table public.roles is
  'Catalog of platform roles. Rank defines the hierarchy: a higher rank includes every lower rank.';
comment on column public.roles.is_assignable is
  'False for implicit roles (visitor, registered_user) that are never stored in user_roles.';

insert into public.roles (key, name, description, rank, is_assignable) values
  ('visitor', 'Visitor', 'Anyone browsing public content without signing in.', 0, false),
  ('registered_user', 'Registered User', 'Signed-in member who can participate in platform activities.', 10, false),
  ('contributor', 'Contributor', 'Volunteer who maintains a contributor profile and applies to projects.', 20, true),
  ('administrator', 'Administrator', 'Staff member who manages submissions, users and projects.', 30, true),
  ('super_administrator', 'Super Administrator', 'Full platform access, including administrator management.', 40, true);

create trigger roles_set_updated_at
  before update on public.roles
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Profiles (one per auth user)
-- -----------------------------------------------------------------------------
create type public.profile_status as enum ('active', 'suspended', 'deactivated');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text not null default '',
  avatar_url text,
  bio text,
  location text,
  website_url text,
  status public.profile_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$'),
  constraint profiles_display_name_length check (char_length(display_name) <= 80),
  constraint profiles_avatar_url_format check (avatar_url ~* '^https?://' and char_length(avatar_url) <= 2048),
  constraint profiles_bio_length check (char_length(bio) <= 1000),
  constraint profiles_location_length check (char_length(location) <= 100),
  constraint profiles_website_url_format check (website_url ~* '^https?://[^\s]+$' and char_length(website_url) <= 2048)
);

comment on table public.profiles is
  'Public profile for each auth user. Contains only information safe to show publicly; private settings live in account_preferences.';
comment on column public.profiles.username is
  'Optional handle: 3-30 lowercase letters, digits, hyphens or underscores.';
comment on column public.profiles.status is
  'Suspended or deactivated accounts lose all participation rights (their effective role rank becomes 0).';

create index profiles_status_idx on public.profiles (status);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Account preferences (private to each user)
-- -----------------------------------------------------------------------------
create table public.account_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email_notifications boolean not null default true,
  newsletter_opt_in boolean not null default false,
  locale text not null default 'en',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_preferences_locale_format check (locale ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  constraint account_preferences_timezone_length check (char_length(timezone) between 1 and 64)
);

comment on table public.account_preferences is 'Private per-user settings. Only the owner can read or change them.';

create trigger account_preferences_set_updated_at
  before update on public.account_preferences
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Role assignments
-- -----------------------------------------------------------------------------
create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null references public.roles (key) on update cascade on delete restrict,
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

comment on table public.user_roles is 'Elevated roles granted to users. Implicit roles are never stored here.';

create index user_roles_role_idx on public.user_roles (role);
create index user_roles_granted_by_idx on public.user_roles (granted_by);

-- -----------------------------------------------------------------------------
-- Audit log (append-only)
-- -----------------------------------------------------------------------------
-- actor_id intentionally has no foreign key: audit history must survive account
-- deletion and must never block a delete that cascades through audited tables.
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_format check (action ~ '^[a-z_]+(\.[a-z_]+)+$'),
  constraint audit_logs_entity_type_format check (entity_type ~ '^[a-z_]+$')
);

comment on table public.audit_logs is
  'Append-only record of sensitive actions. Written by SECURITY DEFINER triggers; readable by administrators only.';
comment on column public.audit_logs.action is 'Dotted event name, e.g. role.granted or profile.status_changed.';

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

-- =============================================================================
-- Authorization helpers
-- =============================================================================
-- SECURITY DEFINER is required so these lookups bypass RLS on user_roles and
-- profiles; otherwise policies on those tables that call is_admin() would
-- recurse. They are safe because they only answer questions about role rank,
-- live in the unexposed private schema, and cannot be called through the API.

-- Rank from granted roles, ignoring account status (10 for a plain member,
-- 0 when no profile exists).
create or replace function private.granted_role_rank(target_user_id uuid)
returns smallint
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when target_user_id is null then 0
    when not exists (select 1 from public.profiles p where p.id = target_user_id) then 0
    else coalesce(
      (
        select max(r.rank)
        from public.user_roles ur
        join public.roles r on r.key = ur.role
        where ur.user_id = target_user_id
      ),
      (select r.rank from public.roles r where r.key = 'registered_user')
    )
  end::smallint;
$$;

-- Effective rank: suspended or deactivated accounts are treated as visitors.
create or replace function private.effective_role_rank(target_user_id uuid)
returns smallint
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.profiles p where p.id = target_user_id and p.status = 'active'
    ) then private.granted_role_rank(target_user_id)
    else 0
  end::smallint;
$$;

-- Effective rank of the requesting user (0 when signed out).
create or replace function private.current_role_rank()
returns smallint
language sql
stable
security definer
set search_path = ''
as $$
  select private.effective_role_rank((select auth.uid()));
$$;

-- True when the requesting user holds `min_role` or any higher role.
create or replace function private.has_min_role(min_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_role_rank() >= coalesce(
    (select r.rank from public.roles r where r.key = min_role),
    32767 -- unknown roles are never satisfied
  );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_min_role('administrator');
$$;

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_min_role('super_administrator');
$$;

-- Who may grant or revoke a role: super administrators manage every role;
-- administrators manage only roles ranked below their own (contributor).
create or replace function private.can_manage_role(target_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when private.has_min_role('super_administrator') then true
    when private.has_min_role('administrator') then
      coalesce((select r.rank from public.roles r where r.key = target_role), 32767)
        < private.current_role_rank()
    else false
  end;
$$;

grant execute on function
  private.granted_role_rank(uuid),
  private.effective_role_rank(uuid),
  private.current_role_rank(),
  private.has_min_role(text),
  private.is_admin(),
  private.is_super_admin(),
  private.can_manage_role(text)
to anon, authenticated, service_role;

-- =============================================================================
-- Triggers
-- =============================================================================

-- Create a profile and preferences row for every new auth user. Only the
-- display name is copied from user metadata, which is user-controlled and must
-- never be used for authorization.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(
      btrim(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', '')),
      80
    )
  );

  insert into public.account_preferences (user_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Members may edit their own profile, but not identifiers or account status.
-- Administrators may change the status of accounts ranked below their own.
create or replace function private.guard_profile_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Trusted server-side roles (service_role, postgres) are not restricted.
  if current_user <> 'authenticated' then
    return new;
  end if;

  if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'Profile identifiers cannot be changed' using errcode = '42501';
  end if;

  if new.status is distinct from old.status then
    if not private.is_admin() then
      raise exception 'Only administrators can change account status' using errcode = '42501';
    end if;
    if old.id = (select auth.uid()) then
      raise exception 'You cannot change the status of your own account' using errcode = '42501';
    end if;
    if private.granted_role_rank(old.id) >= private.current_role_rank() then
      raise exception 'You can only change the status of accounts ranked below your own'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_guard_changes
  before update on public.profiles
  for each row execute function private.guard_profile_changes();

create or replace function private.audit_profile_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    (select auth.uid()),
    'profile.status_changed',
    'profile',
    new.id::text,
    jsonb_build_object('from', old.status, 'to', new.status)
  );
  return new;
end;
$$;

create trigger profiles_audit_status_change
  after update of status on public.profiles
  for each row
  when (old.status is distinct from new.status)
  execute function private.audit_profile_status_change();

-- Implicit roles (visitor, registered_user) can never be granted.
create or replace function private.ensure_role_is_assignable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.roles r where r.key = new.role and r.is_assignable) then
    raise exception 'Role "%" cannot be granted directly', new.role using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger user_roles_ensure_assignable
  before insert or update on public.user_roles
  for each row execute function private.ensure_role_is_assignable();

-- The platform must always keep at least one super administrator.
create or replace function private.prevent_last_super_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'super_administrator' then
    -- Serialize concurrent removals so two super admins cannot remove each other.
    perform pg_advisory_xact_lock(hashtext('public.user_roles:super_administrator'));
    if not exists (
      select 1 from public.user_roles ur
      where ur.role = 'super_administrator' and ur.user_id <> old.user_id
    ) then
      raise exception 'The last super administrator cannot be removed' using errcode = '23514';
    end if;
  end if;
  return old;
end;
$$;

create trigger user_roles_protect_last_super_admin
  before delete on public.user_roles
  for each row execute function private.prevent_last_super_admin_removal();

create or replace function private.audit_user_roles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values ((select auth.uid()), 'role.granted', 'profile', new.user_id::text, jsonb_build_object('role', new.role));
    return new;
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values ((select auth.uid()), 'role.revoked', 'profile', old.user_id::text, jsonb_build_object('role', old.role));
  return old;
end;
$$;

create trigger user_roles_audit
  after insert or delete on public.user_roles
  for each row execute function private.audit_user_roles();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.account_preferences enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;

-- roles ----------------------------------------------------------------------
create policy "Roles are visible to everyone"
  on public.roles for select
  to anon, authenticated
  using (true);

-- profiles -------------------------------------------------------------------
-- One policy per role and action (conditions OR'd) keeps evaluation cheap and
-- satisfies the Supabase performance advisor.
create policy "Profiles are visible when active, to their owner and to administrators"
  on public.profiles for select
  to anon, authenticated
  using (
    status = 'active'
    or id = (select auth.uid())
    or (select private.is_admin())
  );

create policy "Users and administrators can update profiles"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (id = (select auth.uid()) or (select private.is_admin()));

-- account_preferences --------------------------------------------------------
create policy "Users can view their own preferences"
  on public.account_preferences for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own preferences"
  on public.account_preferences for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own preferences"
  on public.account_preferences for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- user_roles -----------------------------------------------------------------
create policy "Users see their own roles; administrators see all"
  on public.user_roles for select
  to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

create policy "Administrators can grant roles they manage"
  on public.user_roles for insert
  to authenticated
  with check (
    private.can_manage_role(role)
    and user_id <> (select auth.uid())
    and granted_by = (select auth.uid())
  );

create policy "Administrators can revoke roles they manage"
  on public.user_roles for delete
  to authenticated
  using (
    private.can_manage_role(role)
    and user_id <> (select auth.uid())
  );

-- audit_logs -----------------------------------------------------------------
create policy "Administrators can read the audit log"
  on public.audit_logs for select
  to authenticated
  using ((select private.is_admin()));

-- =============================================================================
-- Privileges (least privilege on top of RLS)
-- =============================================================================
revoke all on public.roles, public.profiles, public.account_preferences, public.user_roles, public.audit_logs
  from anon, authenticated;

grant select on public.roles to anon, authenticated;
grant select on public.profiles to anon, authenticated;
-- Column-level grant: id, created_at and updated_at can never be set by API users.
grant update (username, display_name, avatar_url, bio, location, website_url, status)
  on public.profiles to authenticated;
grant select on public.account_preferences to authenticated;
grant insert (user_id, email_notifications, newsletter_opt_in, locale, timezone)
  on public.account_preferences to authenticated;
grant update (email_notifications, newsletter_opt_in, locale, timezone)
  on public.account_preferences to authenticated;
grant select, insert, delete on public.user_roles to authenticated;
grant select on public.audit_logs to authenticated;

grant all on public.roles, public.profiles, public.account_preferences, public.user_roles, public.audit_logs
  to service_role;

-- Functions are executable by PUBLIC by default; keep private helpers locked down
-- (explicit grants to API roles above are unaffected).
revoke execute on all functions in schema private from public;
