-- =============================================================================
-- Communications and content: notifications, announcements, website pages
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Notifications (per-user inbox)
-- -----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default private.uuid_generate_v7(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  link_path text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_type_format check (type ~ '^[a-z_]+(\.[a-z_]+)+$'),
  constraint notifications_title_length check (char_length(title) between 1 and 160),
  constraint notifications_body_length check (char_length(body) <= 2000),
  -- In-app paths only ("/dashboard/..."), never absolute or protocol-relative URLs.
  constraint notifications_link_path_format check (link_path ~ '^/(?![/\\])' and char_length(link_path) <= 500)
);

comment on table public.notifications is
  'In-app notifications. Created by trusted server code or administrators; recipients can read, mark read and delete.';

create index notifications_user_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Announcements (site-wide or audience-targeted banners)
-- -----------------------------------------------------------------------------
create type public.announcement_audience as enum ('everyone', 'members', 'contributors', 'administrators');
create type public.announcement_tone as enum ('info', 'success', 'warning');

create table public.announcements (
  id uuid primary key default private.uuid_generate_v7(),
  title text not null,
  body text not null default '',
  link_url text,
  link_label text,
  audience public.announcement_audience not null default 'everyone',
  tone public.announcement_tone not null default 'info',
  status public.publication_status not null default 'draft',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_title_length check (char_length(title) between 1 and 160),
  constraint announcements_body_length check (char_length(body) <= 2000),
  constraint announcements_link_url_format check (link_url ~ '^(https://|/(?![/\\]))' and char_length(link_url) <= 2048),
  constraint announcements_link_label_length check (char_length(link_label) <= 60),
  constraint announcements_window_ordered check (ends_at is null or ends_at > starts_at)
);

create index announcements_live_idx on public.announcements (starts_at desc) where status = 'published';
create index announcements_created_by_idx on public.announcements (created_by);

create trigger announcements_set_published_at
  before insert or update on public.announcements
  for each row execute function private.set_published_at();

create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function private.set_updated_at();

-- Minimum role rank required to see an announcement for each audience.
create or replace function private.announcement_audience_rank(audience public.announcement_audience)
returns smallint
language sql
immutable
set search_path = ''
as $$
  select case audience
    when 'everyone' then 0
    when 'members' then 10
    when 'contributors' then 20
    when 'administrators' then 30
  end::smallint;
$$;

grant execute on function private.announcement_audience_rank(public.announcement_audience)
  to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Website pages (CMS-managed content such as policies and FAQs)
-- -----------------------------------------------------------------------------
create table public.site_pages (
  id uuid primary key default private.uuid_generate_v7(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  body text not null default '',
  status public.publication_status not null default 'draft',
  seo_title text,
  seo_description text,
  published_at timestamptz,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Allows nested paths such as legal/privacy.
  constraint site_pages_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*(/[a-z0-9]+(-[a-z0-9]+)*)*$' and char_length(slug) <= 160),
  constraint site_pages_title_length check (char_length(title) between 1 and 160),
  constraint site_pages_summary_length check (char_length(summary) <= 500),
  constraint site_pages_body_length check (char_length(body) <= 100000),
  constraint site_pages_seo_title_length check (char_length(seo_title) <= 70),
  constraint site_pages_seo_description_length check (char_length(seo_description) <= 160),
  constraint site_pages_published_requires_date check (status <> 'published' or published_at is not null)
);

comment on table public.site_pages is 'Editable website pages (Markdown body). Published pages are public.';

create index site_pages_status_idx on public.site_pages (status);
create index site_pages_updated_by_idx on public.site_pages (updated_by);

create trigger site_pages_set_published_at
  before insert or update on public.site_pages
  for each row execute function private.set_published_at();

create trigger site_pages_set_updated_at
  before update on public.site_pages
  for each row execute function private.set_updated_at();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.notifications enable row level security;
alter table public.announcements enable row level security;
alter table public.site_pages enable row level security;

-- notifications ------------------------------------------------------------------
create policy "Users can view their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can mark their own notifications as read"
  on public.notifications for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own notifications"
  on public.notifications for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Administrators can send notifications"
  on public.notifications for insert
  to authenticated
  with check ((select private.is_admin()));

-- announcements ------------------------------------------------------------------
create policy "Live announcements are visible to their audience; administrators see all"
  on public.announcements for select
  to anon, authenticated
  using (
    (select private.is_admin())
    or (
      status = 'published'
      and starts_at <= now()
      and (ends_at is null or ends_at > now())
      and private.announcement_audience_rank(audience) <= (select private.current_role_rank())
    )
  );

create policy "Administrators can create announcements"
  on public.announcements for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Administrators can update announcements"
  on public.announcements for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Administrators can delete announcements"
  on public.announcements for delete
  to authenticated
  using ((select private.is_admin()));

-- site_pages ---------------------------------------------------------------------
create policy "Published pages are public; administrators see all"
  on public.site_pages for select
  to anon, authenticated
  using (status = 'published' or (select private.is_admin()));

create policy "Administrators can create pages"
  on public.site_pages for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Administrators can update pages"
  on public.site_pages for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Administrators can delete pages"
  on public.site_pages for delete
  to authenticated
  using ((select private.is_admin()));

-- =============================================================================
-- Privileges
-- =============================================================================
revoke all on public.notifications, public.announcements, public.site_pages from anon, authenticated;

grant select on public.announcements, public.site_pages to anon;

grant select, insert, delete on public.notifications to authenticated;
-- Recipients may only toggle read state.
grant update (read_at) on public.notifications to authenticated;
grant select, insert, update, delete on public.announcements, public.site_pages to authenticated;

grant all on public.notifications, public.announcements, public.site_pages to service_role;

-- Functions are executable by PUBLIC by default; keep private helpers locked down
-- (explicit grants to API roles above are unaffected).
revoke execute on all functions in schema private from public;
