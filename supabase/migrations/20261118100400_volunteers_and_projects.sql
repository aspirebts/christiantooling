-- =============================================================================
-- Volunteers and projects
-- =============================================================================
-- Contributors (volunteers) maintain a profile with skills and apply to
-- projects. Projects usually originate from approved ideas and may produce a
-- tool. Project-level roles (lead, maintainer, ...) grant scoped management
-- rights without making someone a platform administrator.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Skills catalog
-- -----------------------------------------------------------------------------
create type public.skill_category as enum ('engineering', 'design', 'product', 'content', 'ministry', 'operations');

create table public.skills (
  id uuid primary key default private.uuid_generate_v7(),
  slug text not null unique,
  name text not null,
  category public.skill_category not null,
  description text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skills_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  constraint skills_name_length check (char_length(name) between 1 and 80),
  constraint skills_description_length check (char_length(description) <= 500)
);

create index skills_active_category_idx on public.skills (category, sort_order) where is_active;

create trigger skills_set_updated_at
  before update on public.skills
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Contributor profiles
-- -----------------------------------------------------------------------------
create type public.experience_level as enum ('learning', 'intermediate', 'experienced', 'expert');

create table public.contributor_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  headline text not null default '',
  bio text not null default '',
  experience_level public.experience_level,
  weekly_hours smallint,
  github_url text,
  linkedin_url text,
  portfolio_url text,
  is_available boolean not null default true,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contributor_profiles_headline_length check (char_length(headline) <= 120),
  constraint contributor_profiles_bio_length check (char_length(bio) <= 2000),
  constraint contributor_profiles_weekly_hours_range check (weekly_hours between 1 and 60),
  constraint contributor_profiles_github_url_format check (github_url ~* '^https://[^\s]+$'),
  constraint contributor_profiles_linkedin_url_format check (linkedin_url ~* '^https://[^\s]+$'),
  constraint contributor_profiles_portfolio_url_format check (portfolio_url ~* '^https?://[^\s]+$')
);

comment on table public.contributor_profiles is
  'Volunteer profile. Members may draft one; it becomes public once they hold the contributor role.';

create index contributor_profiles_available_idx on public.contributor_profiles (is_available) where is_public;

create trigger contributor_profiles_set_updated_at
  before update on public.contributor_profiles
  for each row execute function private.set_updated_at();

create table public.contributor_skills (
  user_id uuid not null references public.contributor_profiles (user_id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete restrict,
  proficiency smallint,
  created_at timestamptz not null default now(),
  primary key (user_id, skill_id),
  constraint contributor_skills_proficiency_range check (proficiency between 1 and 5)
);

create index contributor_skills_skill_id_idx on public.contributor_skills (skill_id);

-- -----------------------------------------------------------------------------
-- Projects
-- -----------------------------------------------------------------------------
create type public.project_status as enum ('planning', 'recruiting', 'active', 'paused', 'completed', 'archived');

create table public.projects (
  id uuid primary key default private.uuid_generate_v7(),
  slug text not null unique,
  name text not null,
  summary text not null default '',
  description text not null default '',
  status public.project_status not null default 'planning',
  is_public boolean not null default true,
  idea_id uuid references public.ideas (id) on delete set null,
  tool_id uuid references public.tools (id) on delete set null,
  repository_url text,
  started_on date,
  completed_on date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  constraint projects_name_length check (char_length(name) between 1 and 120),
  constraint projects_summary_length check (char_length(summary) <= 300),
  constraint projects_description_length check (char_length(description) <= 10000),
  constraint projects_repository_url_format check (repository_url ~* '^https?://[^\s]+$'),
  constraint projects_dates_ordered check (completed_on is null or started_on is null or completed_on >= started_on)
);

comment on table public.projects is 'Open-source development efforts, usually originating from an approved idea.';
comment on column public.projects.tool_id is 'The tool this project produces or maintains, once it exists.';

create index projects_status_idx on public.projects (status) where is_public;
create index projects_idea_id_idx on public.projects (idea_id);
create index projects_tool_id_idx on public.projects (tool_id);
create index projects_created_by_idx on public.projects (created_by);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function private.set_updated_at();

-- Skills a project is looking for -----------------------------------------------
create table public.project_skills (
  project_id uuid not null references public.projects (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (project_id, skill_id)
);

create index project_skills_skill_id_idx on public.project_skills (skill_id);

-- Project team -------------------------------------------------------------------
create type public.project_role as enum ('lead', 'maintainer', 'contributor', 'advisor');

create table public.project_contributors (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.project_role not null default 'contributor',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (project_id, user_id),
  constraint project_contributors_dates_ordered check (left_at is null or left_at >= joined_at)
);

create index project_contributors_user_id_idx on public.project_contributors (user_id);

-- -----------------------------------------------------------------------------
-- Project authorization helpers
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER avoids policy recursion between projects and
-- project_contributors. They only answer questions about the requesting user.

-- The requesting user's active role on a project, or null.
create or replace function private.project_role_for_current_user(target_project_id uuid)
returns public.project_role
language sql
stable
security definer
set search_path = ''
as $$
  select pc.role
  from public.project_contributors pc
  where pc.project_id = target_project_id
    and pc.user_id = (select auth.uid())
    and pc.left_at is null
    and private.current_role_rank() > 0;
$$;

-- Leads (and administrators) manage the team, applications and project details.
create or replace function private.can_manage_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin()
    or coalesce(private.project_role_for_current_user(target_project_id) = 'lead', false);
$$;

-- Leads and maintainers (and administrators) publish updates and milestones.
create or replace function private.can_contribute_to_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin()
    or coalesce(private.project_role_for_current_user(target_project_id) in ('lead', 'maintainer'), false);
$$;

create or replace function private.is_project_member(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.project_role_for_current_user(target_project_id) is not null;
$$;

grant execute on function
  private.project_role_for_current_user(uuid),
  private.can_manage_project(uuid),
  private.can_contribute_to_project(uuid),
  private.is_project_member(uuid)
to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Volunteer applications
-- -----------------------------------------------------------------------------
create type public.application_status as enum ('submitted', 'under_review', 'accepted', 'declined', 'withdrawn');

create table public.volunteer_applications (
  id uuid primary key default private.uuid_generate_v7(),
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  role_interest text not null default '',
  motivation text not null,
  weekly_hours smallint,
  status public.application_status not null default 'submitted',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint volunteer_applications_role_interest_length check (char_length(role_interest) <= 120),
  constraint volunteer_applications_motivation_length check (char_length(motivation) between 20 and 4000),
  constraint volunteer_applications_weekly_hours_range check (weekly_hours between 1 and 60),
  constraint volunteer_applications_review_notes_length check (char_length(review_notes) <= 2000)
);

comment on table public.volunteer_applications is
  'Applications to volunteer. project_id null = general application to become a contributor.';

-- At most one open application per member per project (or general application).
create unique index volunteer_applications_one_open_idx
  on public.volunteer_applications (applicant_id, project_id) nulls not distinct
  where status in ('submitted', 'under_review');
create index volunteer_applications_project_status_idx on public.volunteer_applications (project_id, status);
create index volunteer_applications_reviewed_by_idx on public.volunteer_applications (reviewed_by);

-- Applicants may not record review decisions; project leads may for their projects.
create or replace function private.guard_application_review()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user <> 'authenticated' or private.is_admin() then
    return new;
  end if;

  if new.project_id is not null and private.can_manage_project(new.project_id)
     and new.applicant_id <> (select auth.uid()) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.reviewed_by is not null or new.reviewed_at is not null or new.review_notes is not null then
      raise exception 'Review fields can only be set by reviewers' using errcode = '42501';
    end if;
  elsif new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at
     or new.review_notes is distinct from old.review_notes then
    raise exception 'Review fields can only be set by reviewers' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger volunteer_applications_guard_review
  before insert or update on public.volunteer_applications
  for each row execute function private.guard_application_review();

create trigger volunteer_applications_set_updated_at
  before update on public.volunteer_applications
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Milestones and updates
-- -----------------------------------------------------------------------------
create type public.milestone_status as enum ('planned', 'in_progress', 'completed', 'cancelled');

create table public.project_milestones (
  id uuid primary key default private.uuid_generate_v7(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text not null default '',
  status public.milestone_status not null default 'planned',
  due_on date,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_milestones_title_length check (char_length(title) between 1 and 160),
  constraint project_milestones_description_length check (char_length(description) <= 5000)
);

create index project_milestones_project_sort_idx on public.project_milestones (project_id, sort_order);

create trigger project_milestones_set_updated_at
  before update on public.project_milestones
  for each row execute function private.set_updated_at();

create type public.update_visibility as enum ('public', 'team');

create table public.project_updates (
  id uuid primary key default private.uuid_generate_v7(),
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  title text not null,
  body text not null,
  visibility public.update_visibility not null default 'public',
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_updates_title_length check (char_length(title) between 1 and 160),
  constraint project_updates_body_length check (char_length(body) between 1 and 20000)
);

create index project_updates_project_published_idx on public.project_updates (project_id, published_at desc);
create index project_updates_author_id_idx on public.project_updates (author_id);

create trigger project_updates_set_updated_at
  before update on public.project_updates
  for each row execute function private.set_updated_at();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.skills enable row level security;
alter table public.contributor_profiles enable row level security;
alter table public.contributor_skills enable row level security;
alter table public.projects enable row level security;
alter table public.project_skills enable row level security;
alter table public.project_contributors enable row level security;
alter table public.volunteer_applications enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_updates enable row level security;

-- One policy per role and action, with conditions OR'd together.

-- skills -------------------------------------------------------------------------
create policy "Active skills are public; administrators see all"
  on public.skills for select
  to anon, authenticated
  using (is_active or (select private.is_admin()));

create policy "Administrators can create skills"
  on public.skills for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Administrators can update skills"
  on public.skills for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Administrators can delete skills"
  on public.skills for delete
  to authenticated
  using ((select private.is_admin()));

-- contributor_profiles -----------------------------------------------------------
create policy "Contributor profiles are public once approved; owners and administrators see all"
  on public.contributor_profiles for select
  to anon, authenticated
  using (
    user_id = (select auth.uid())
    or (select private.is_admin())
    or (is_public and private.effective_role_rank(user_id) >= 20)
  );

create policy "Members can create their own contributor profile"
  on public.contributor_profiles for insert
  to authenticated
  with check ((select private.has_min_role('registered_user')) and user_id = (select auth.uid()));

create policy "Members can update their own contributor profile"
  on public.contributor_profiles for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Members can delete their own contributor profile"
  on public.contributor_profiles for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- contributor_skills -------------------------------------------------------------
create policy "Contributor skills are visible with the profile"
  on public.contributor_skills for select
  to anon, authenticated
  using (exists (select 1 from public.contributor_profiles cp where cp.user_id = contributor_skills.user_id));

create policy "Members can add skills to their own profile"
  on public.contributor_skills for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Members can update their own skills"
  on public.contributor_skills for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Members can remove skills from their own profile"
  on public.contributor_skills for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- projects -----------------------------------------------------------------------
create policy "Public projects are visible; members and administrators see private ones"
  on public.projects for select
  to anon, authenticated
  using (is_public or (select private.is_admin()) or private.is_project_member(id));

create policy "Administrators can create projects"
  on public.projects for insert
  to authenticated
  with check ((select private.is_admin()) and created_by = (select auth.uid()));

create policy "Project leads and administrators can update projects"
  on public.projects for update
  to authenticated
  using (private.can_manage_project(id))
  with check (private.can_manage_project(id));

create policy "Administrators can delete projects"
  on public.projects for delete
  to authenticated
  using ((select private.is_admin()));

-- project_skills -----------------------------------------------------------------
-- Visibility follows the project (the subquery is subject to RLS on projects).
create policy "Project skills are visible with the project"
  on public.project_skills for select
  to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id));

create policy "Project leads and administrators can add project skills"
  on public.project_skills for insert
  to authenticated
  with check (private.can_manage_project(project_id));

create policy "Project leads and administrators can update project skills"
  on public.project_skills for update
  to authenticated
  using (private.can_manage_project(project_id))
  with check (private.can_manage_project(project_id));

create policy "Project leads and administrators can remove project skills"
  on public.project_skills for delete
  to authenticated
  using (private.can_manage_project(project_id));

-- project_contributors -------------------------------------------------------------
create policy "Project teams are visible with the project"
  on public.project_contributors for select
  to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id));

create policy "Project leads and administrators can add team members"
  on public.project_contributors for insert
  to authenticated
  with check (private.can_manage_project(project_id));

create policy "Project leads and administrators can update team members"
  on public.project_contributors for update
  to authenticated
  using (private.can_manage_project(project_id))
  with check (private.can_manage_project(project_id));

create policy "Project leads and administrators can remove team members"
  on public.project_contributors for delete
  to authenticated
  using (private.can_manage_project(project_id));

-- volunteer_applications -----------------------------------------------------------
create policy "Applicants, project leads and administrators can view applications"
  on public.volunteer_applications for select
  to authenticated
  using (
    applicant_id = (select auth.uid())
    or (select private.is_admin())
    or (project_id is not null and private.can_manage_project(project_id))
  );

create policy "Members can apply to volunteer; administrators can add applications"
  on public.volunteer_applications for insert
  to authenticated
  with check (
    (select private.is_admin())
    or (
      applicant_id = (select auth.uid())
      and status = 'submitted'
      and (
        -- General application to become a contributor: any active member.
        (project_id is null and (select private.has_min_role('registered_user')))
        -- Project application: contributors only, for projects that are recruiting.
        or (
          project_id is not null
          and (select private.has_min_role('contributor'))
          and exists (
            select 1 from public.projects p
            where p.id = project_id and p.status in ('recruiting', 'active')
          )
        )
      )
    )
  );

create policy "Applicants edit or withdraw; project leads and administrators review"
  on public.volunteer_applications for update
  to authenticated
  using (
    (select private.is_admin())
    or (applicant_id = (select auth.uid()) and status in ('submitted', 'under_review'))
    or (
      project_id is not null
      and private.can_manage_project(project_id)
      and applicant_id <> (select auth.uid())
    )
  )
  with check (
    (select private.is_admin())
    or (applicant_id = (select auth.uid()) and status in ('submitted', 'withdrawn'))
    or (
      project_id is not null
      and private.can_manage_project(project_id)
      and applicant_id <> (select auth.uid())
    )
  );

create policy "Administrators can delete applications"
  on public.volunteer_applications for delete
  to authenticated
  using ((select private.is_admin()));

-- project_milestones ----------------------------------------------------------------
create policy "Milestones are visible with the project"
  on public.project_milestones for select
  to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id));

create policy "Project maintainers can add milestones"
  on public.project_milestones for insert
  to authenticated
  with check (private.can_contribute_to_project(project_id));

create policy "Project maintainers can update milestones"
  on public.project_milestones for update
  to authenticated
  using (private.can_contribute_to_project(project_id))
  with check (private.can_contribute_to_project(project_id));

create policy "Project maintainers can delete milestones"
  on public.project_milestones for delete
  to authenticated
  using (private.can_contribute_to_project(project_id));

-- project_updates -----------------------------------------------------------------
create policy "Public updates are visible with the project; team updates to members"
  on public.project_updates for select
  to anon, authenticated
  using (
    (visibility = 'public' and exists (select 1 from public.projects p where p.id = project_id))
    or (select private.is_admin())
    or private.is_project_member(project_id)
  );

create policy "Project maintainers can post updates"
  on public.project_updates for insert
  to authenticated
  with check (private.can_contribute_to_project(project_id) and author_id = (select auth.uid()));

create policy "Project maintainers can edit updates"
  on public.project_updates for update
  to authenticated
  using (private.can_contribute_to_project(project_id))
  with check (private.can_contribute_to_project(project_id));

create policy "Project maintainers can delete updates"
  on public.project_updates for delete
  to authenticated
  using (private.can_contribute_to_project(project_id));

-- =============================================================================
-- Privileges
-- =============================================================================
revoke all on
  public.skills, public.contributor_profiles, public.contributor_skills, public.projects,
  public.project_skills, public.project_contributors, public.volunteer_applications,
  public.project_milestones, public.project_updates
from anon, authenticated;

grant select on
  public.skills, public.contributor_profiles, public.contributor_skills, public.projects,
  public.project_skills, public.project_contributors, public.project_milestones, public.project_updates
to anon;

grant select, insert, update, delete on
  public.skills, public.contributor_profiles, public.contributor_skills, public.projects,
  public.project_skills, public.project_contributors, public.volunteer_applications,
  public.project_milestones, public.project_updates
to authenticated;

grant all on
  public.skills, public.contributor_profiles, public.contributor_skills, public.projects,
  public.project_skills, public.project_contributors, public.volunteer_applications,
  public.project_milestones, public.project_updates
to service_role;

-- Functions are executable by PUBLIC by default; keep private helpers locked down
-- (explicit grants to API roles above are unaffected).
revoke execute on all functions in schema private from public;
