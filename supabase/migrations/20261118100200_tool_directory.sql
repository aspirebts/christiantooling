-- =============================================================================
-- Tool directory: practice categories, technology types, tools, submissions
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Shared trigger: moderation fields
-- -----------------------------------------------------------------------------
-- Tables with reviewed_by / reviewed_at / review_notes columns use this guard so
-- only administrators (or trusted server roles) can record review decisions.
create or replace function private.guard_moderation_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user <> 'authenticated' or private.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.reviewed_by is not null or new.reviewed_at is not null or new.review_notes is not null then
      raise exception 'Review fields can only be set by administrators' using errcode = '42501';
    end if;
  elsif new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at
     or new.review_notes is distinct from old.review_notes then
    raise exception 'Review fields can only be set by administrators' using errcode = '42501';
  end if;

  return new;
end;
$$;

comment on function private.guard_moderation_fields() is
  'BEFORE INSERT/UPDATE trigger restricting reviewed_by, reviewed_at and review_notes to administrators.';

-- -----------------------------------------------------------------------------
-- Christian practice categories (managed data, never hardcoded in the UI)
-- -----------------------------------------------------------------------------
create table public.practice_categories (
  id uuid primary key default private.uuid_generate_v7(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint practice_categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  constraint practice_categories_name_length check (char_length(name) between 1 and 80),
  constraint practice_categories_description_length check (char_length(description) <= 500),
  constraint practice_categories_icon_format check (icon ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on table public.practice_categories is
  'Christian practices used to organise tools and ideas (prayer, Bible study, worship, ...).';
comment on column public.practice_categories.icon is 'Lucide icon name (kebab-case) rendered by the UI.';

create index practice_categories_active_sort_idx
  on public.practice_categories (sort_order, name) where is_active;

create trigger practice_categories_set_updated_at
  before update on public.practice_categories
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Technology types (web app, mobile app, browser extension, ...)
-- -----------------------------------------------------------------------------
create table public.technology_types (
  id uuid primary key default private.uuid_generate_v7(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint technology_types_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  constraint technology_types_name_length check (char_length(name) between 1 and 80),
  constraint technology_types_description_length check (char_length(description) <= 500),
  constraint technology_types_icon_format check (icon ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on table public.technology_types is 'Delivery formats for tools (web app, mobile app, API, ...).';

create index technology_types_active_sort_idx
  on public.technology_types (sort_order, name) where is_active;

create trigger technology_types_set_updated_at
  before update on public.technology_types
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Tools
-- -----------------------------------------------------------------------------
create type public.tool_ownership as enum ('community', 'christiantooling');
create type public.tool_pricing as enum ('free', 'freemium', 'paid', 'donation_supported');

create table public.tools (
  id uuid primary key default private.uuid_generate_v7(),
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  website_url text,
  repository_url text,
  logo_path text,
  pricing public.tool_pricing,
  is_open_source boolean not null default false,
  license text,
  ownership public.tool_ownership not null default 'community',
  status public.publication_status not null default 'draft',
  is_featured boolean not null default false,
  submitted_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A')
    || setweight(to_tsvector('english', coalesce(tagline, '')), 'B')
    || setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tools_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  constraint tools_name_length check (char_length(name) between 1 and 120),
  constraint tools_tagline_length check (char_length(tagline) <= 160),
  constraint tools_description_length check (char_length(description) <= 10000),
  constraint tools_website_url_format check (website_url ~* '^https?://[^\s]+$' and char_length(website_url) <= 2048),
  constraint tools_repository_url_format check (repository_url ~* '^https?://[^\s]+$' and char_length(repository_url) <= 2048),
  constraint tools_license_length check (char_length(license) <= 64),
  constraint tools_published_requires_date check (status <> 'published' or published_at is not null)
);

comment on table public.tools is
  'Directory of Christian tools. ownership = christiantooling marks tools built and operated by the ministry ("Our Tools").';
comment on column public.tools.logo_path is 'Object path inside the tool-logos storage bucket.';
comment on column public.tools.license is 'SPDX license identifier for open-source tools, e.g. MIT.';

create index tools_status_published_at_idx on public.tools (status, published_at desc);
create index tools_published_ownership_idx on public.tools (ownership) where status = 'published';
create index tools_featured_idx on public.tools (published_at desc) where status = 'published' and is_featured;
create index tools_submitted_by_idx on public.tools (submitted_by);
create index tools_search_vector_idx on public.tools using gin (search_vector);

create trigger tools_set_published_at
  before insert or update on public.tools
  for each row execute function private.set_published_at();

create trigger tools_set_updated_at
  before update on public.tools
  for each row execute function private.set_updated_at();

-- Tool <-> practice category (many-to-many) -----------------------------------
create table public.tool_categories (
  tool_id uuid not null references public.tools (id) on delete cascade,
  category_id uuid not null references public.practice_categories (id) on delete restrict,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (tool_id, category_id)
);

create index tool_categories_category_id_idx on public.tool_categories (category_id);
create unique index tool_categories_one_primary_idx on public.tool_categories (tool_id) where is_primary;

-- Tool <-> technology type (many-to-many) ------------------------------------
create table public.tool_technology_types (
  tool_id uuid not null references public.tools (id) on delete cascade,
  technology_type_id uuid not null references public.technology_types (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (tool_id, technology_type_id)
);

create index tool_technology_types_technology_type_id_idx on public.tool_technology_types (technology_type_id);

-- -----------------------------------------------------------------------------
-- Tool submissions (people suggesting existing tools for the directory)
-- -----------------------------------------------------------------------------
create type public.submission_status as enum ('pending', 'in_review', 'approved', 'rejected', 'withdrawn');

create table public.tool_submissions (
  id uuid primary key default private.uuid_generate_v7(),
  submitted_by uuid references public.profiles (id) on delete set null,
  tool_id uuid references public.tools (id) on delete set null,
  name text not null,
  website_url text not null,
  tagline text not null default '',
  description text not null default '',
  repository_url text,
  proposed_category_ids uuid[] not null default '{}',
  proposed_technology_type_ids uuid[] not null default '{}',
  is_creator boolean not null default false,
  submitter_notes text,
  status public.submission_status not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tool_submissions_name_length check (char_length(name) between 1 and 120),
  constraint tool_submissions_website_url_format check (website_url ~* '^https?://[^\s]+$' and char_length(website_url) <= 2048),
  constraint tool_submissions_repository_url_format check (repository_url ~* '^https?://[^\s]+$' and char_length(repository_url) <= 2048),
  constraint tool_submissions_tagline_length check (char_length(tagline) <= 160),
  constraint tool_submissions_description_length check (char_length(description) <= 5000),
  constraint tool_submissions_notes_length check (char_length(submitter_notes) <= 2000),
  constraint tool_submissions_review_notes_length check (char_length(review_notes) <= 2000),
  constraint tool_submissions_category_limit check (cardinality(proposed_category_ids) <= 10),
  constraint tool_submissions_technology_limit check (cardinality(proposed_technology_type_ids) <= 10)
);

comment on table public.tool_submissions is
  'Community suggestions for the directory. Approval creates or links a row in public.tools (tool_id).';
comment on column public.tool_submissions.is_creator is 'True when the submitter builds or maintains the tool.';
comment on column public.tool_submissions.proposed_category_ids is
  'Suggested practice_categories ids; administrators choose the final categories on approval.';

create index tool_submissions_status_created_idx on public.tool_submissions (status, created_at desc);
create index tool_submissions_submitted_by_idx on public.tool_submissions (submitted_by);
create index tool_submissions_tool_id_idx on public.tool_submissions (tool_id);
create index tool_submissions_reviewed_by_idx on public.tool_submissions (reviewed_by);

create trigger tool_submissions_guard_moderation
  before insert or update on public.tool_submissions
  for each row execute function private.guard_moderation_fields();

create trigger tool_submissions_set_updated_at
  before update on public.tool_submissions
  for each row execute function private.set_updated_at();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.practice_categories enable row level security;
alter table public.technology_types enable row level security;
alter table public.tools enable row level security;
alter table public.tool_categories enable row level security;
alter table public.tool_technology_types enable row level security;
alter table public.tool_submissions enable row level security;

-- Convention: one policy per role and action, with conditions OR'd together.
-- Administrator write access uses explicit insert/update/delete policies rather
-- than FOR ALL, so it never adds a second SELECT policy.

-- practice_categories ----------------------------------------------------------
create policy "Active practice categories are public; administrators see all"
  on public.practice_categories for select
  to anon, authenticated
  using (is_active or (select private.is_admin()));

create policy "Administrators can create practice categories"
  on public.practice_categories for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Administrators can update practice categories"
  on public.practice_categories for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Administrators can delete practice categories"
  on public.practice_categories for delete
  to authenticated
  using ((select private.is_admin()));

-- technology_types -------------------------------------------------------------
create policy "Active technology types are public; administrators see all"
  on public.technology_types for select
  to anon, authenticated
  using (is_active or (select private.is_admin()));

create policy "Administrators can create technology types"
  on public.technology_types for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Administrators can update technology types"
  on public.technology_types for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Administrators can delete technology types"
  on public.technology_types for delete
  to authenticated
  using ((select private.is_admin()));

-- tools ------------------------------------------------------------------------
create policy "Published tools are public; administrators see all"
  on public.tools for select
  to anon, authenticated
  using (status = 'published' or (select private.is_admin()));

create policy "Administrators can create tools"
  on public.tools for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Administrators can update tools"
  on public.tools for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Administrators can delete tools"
  on public.tools for delete
  to authenticated
  using ((select private.is_admin()));

-- tool_categories / tool_technology_types --------------------------------------
-- Visibility follows the parent tool: the subquery is itself subject to RLS on
-- tools, so administrators (who see every tool) see every row.
create policy "Tool categories are visible when the tool is visible"
  on public.tool_categories for select
  to anon, authenticated
  using (exists (select 1 from public.tools t where t.id = tool_id));

create policy "Administrators can create tool categories"
  on public.tool_categories for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Administrators can update tool categories"
  on public.tool_categories for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Administrators can delete tool categories"
  on public.tool_categories for delete
  to authenticated
  using ((select private.is_admin()));

create policy "Tool technology types are visible when the tool is visible"
  on public.tool_technology_types for select
  to anon, authenticated
  using (exists (select 1 from public.tools t where t.id = tool_id));

create policy "Administrators can create tool technology types"
  on public.tool_technology_types for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Administrators can update tool technology types"
  on public.tool_technology_types for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Administrators can delete tool technology types"
  on public.tool_technology_types for delete
  to authenticated
  using ((select private.is_admin()));

-- tool_submissions -------------------------------------------------------------
create policy "Submitters see their own submissions; administrators see all"
  on public.tool_submissions for select
  to authenticated
  using (submitted_by = (select auth.uid()) or (select private.is_admin()));

create policy "Members can submit tools; administrators can add submissions"
  on public.tool_submissions for insert
  to authenticated
  with check (
    (select private.is_admin())
    or (
      (select private.has_min_role('registered_user'))
      and submitted_by = (select auth.uid())
      and status = 'pending'
      and tool_id is null
    )
  );

create policy "Members can edit or withdraw pending submissions; administrators can review"
  on public.tool_submissions for update
  to authenticated
  using (
    (select private.is_admin())
    or (submitted_by = (select auth.uid()) and status = 'pending')
  )
  with check (
    (select private.is_admin())
    or (
      submitted_by = (select auth.uid())
      and status in ('pending', 'withdrawn')
      and tool_id is null
    )
  );

create policy "Administrators can delete submissions"
  on public.tool_submissions for delete
  to authenticated
  using ((select private.is_admin()));

-- =============================================================================
-- Privileges
-- =============================================================================
revoke all on
  public.practice_categories, public.technology_types, public.tools,
  public.tool_categories, public.tool_technology_types, public.tool_submissions
from anon, authenticated;

grant select on
  public.practice_categories, public.technology_types, public.tools,
  public.tool_categories, public.tool_technology_types
to anon;

grant select, insert, update, delete on
  public.practice_categories, public.technology_types, public.tools,
  public.tool_categories, public.tool_technology_types, public.tool_submissions
to authenticated;

grant all on
  public.practice_categories, public.technology_types, public.tools,
  public.tool_categories, public.tool_technology_types, public.tool_submissions
to service_role;

-- Functions are executable by PUBLIC by default; keep private helpers locked down
-- (explicit grants to API roles above are unaffected).
revoke execute on all functions in schema private from public;
