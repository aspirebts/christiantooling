-- =============================================================================
-- Ideas: proposals for tools that should exist, with votes and comments
-- =============================================================================
-- Lifecycle:
--   draft          -> private to the author
--   pending_review -> waiting for moderation (author + administrators)
--   open           -> public, accepting votes and comments
--   approved       -> public, approved for development and seeking volunteers
--   in_development -> public, linked to a project
--   launched       -> public, shipped as a tool
--   declined       -> visible to the author and administrators
--   archived       -> visible to the author and administrators
-- =============================================================================

create type public.idea_status as enum (
  'draft', 'pending_review', 'open', 'approved', 'in_development', 'launched', 'declined', 'archived'
);

-- Statuses visible to the public. Kept in one function so policies agree.
create or replace function private.is_public_idea_status(status public.idea_status)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select status in ('open', 'approved', 'in_development', 'launched');
$$;

grant execute on function private.is_public_idea_status(public.idea_status) to anon, authenticated, service_role;

create table public.ideas (
  id uuid primary key default private.uuid_generate_v7(),
  slug text not null unique,
  title text not null,
  summary text not null,
  problem_statement text not null default '',
  proposed_solution text not null default '',
  target_audience text not null default '',
  author_id uuid references public.profiles (id) on delete set null,
  status public.idea_status not null default 'pending_review',
  vote_count integer not null default 0,
  comment_count integer not null default 0,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A')
    || setweight(to_tsvector('english', coalesce(summary, '')), 'B')
    || setweight(to_tsvector('english', coalesce(problem_statement, '') || ' ' || coalesce(proposed_solution, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ideas_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 140),
  constraint ideas_title_length check (char_length(title) between 5 and 140),
  constraint ideas_summary_length check (char_length(summary) between 10 and 300),
  constraint ideas_problem_length check (char_length(problem_statement) <= 5000),
  constraint ideas_solution_length check (char_length(proposed_solution) <= 5000),
  constraint ideas_audience_length check (char_length(target_audience) <= 500),
  constraint ideas_review_notes_length check (char_length(review_notes) <= 2000),
  constraint ideas_counts_non_negative check (vote_count >= 0 and comment_count >= 0)
);

comment on table public.ideas is 'Proposals for Christian tools that should exist.';
comment on column public.ideas.vote_count is 'Denormalised count maintained by triggers on idea_votes.';
comment on column public.ideas.comment_count is 'Denormalised count of visible comments maintained by triggers.';

create index ideas_status_created_idx on public.ideas (status, created_at desc);
create index ideas_status_votes_idx on public.ideas (status, vote_count desc);
create index ideas_author_id_idx on public.ideas (author_id);
create index ideas_reviewed_by_idx on public.ideas (reviewed_by);
create index ideas_search_vector_idx on public.ideas using gin (search_vector);

create trigger ideas_guard_moderation
  before insert or update on public.ideas
  for each row execute function private.guard_moderation_fields();

-- Fires only for content columns, so counter updates do not bump updated_at.
create trigger ideas_set_updated_at
  before update of slug, title, summary, problem_statement, proposed_solution, target_audience, status,
    review_notes
  on public.ideas
  for each row execute function private.set_updated_at();

-- Idea <-> practice category -------------------------------------------------
create table public.idea_categories (
  idea_id uuid not null references public.ideas (id) on delete cascade,
  category_id uuid not null references public.practice_categories (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (idea_id, category_id)
);

create index idea_categories_category_id_idx on public.idea_categories (category_id);

-- Votes (one per member per idea) -------------------------------------------
create table public.idea_votes (
  idea_id uuid not null references public.ideas (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idea_id, user_id)
);

comment on table public.idea_votes is 'One vote per member per idea. Individual votes are private; ideas.vote_count is public.';

create index idea_votes_user_id_idx on public.idea_votes (user_id);

-- Comments (threaded) -----------------------------------------------------------
create type public.comment_status as enum ('visible', 'hidden', 'deleted');

create table public.idea_comments (
  id uuid primary key default private.uuid_generate_v7(),
  idea_id uuid not null references public.ideas (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  parent_id uuid references public.idea_comments (id) on delete cascade,
  body text not null,
  status public.comment_status not null default 'visible',
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint idea_comments_body_length check (char_length(btrim(body)) between 1 and 5000),
  constraint idea_comments_not_self_parent check (parent_id is distinct from id)
);

comment on column public.idea_comments.status is
  'visible (public), hidden (removed by a moderator) or deleted (removed by the author).';

create index idea_comments_idea_created_idx on public.idea_comments (idea_id, created_at);
create index idea_comments_author_id_idx on public.idea_comments (author_id);
create index idea_comments_parent_id_idx on public.idea_comments (parent_id);

create trigger idea_comments_set_updated_at
  before update on public.idea_comments
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Counter maintenance
-- -----------------------------------------------------------------------------
create or replace function private.sync_idea_vote_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.ideas set vote_count = vote_count + 1 where id = new.idea_id;
  elsif tg_op = 'DELETE' then
    update public.ideas set vote_count = greatest(vote_count - 1, 0) where id = old.idea_id;
  end if;
  return null;
end;
$$;

create trigger idea_votes_sync_count
  after insert or delete on public.idea_votes
  for each row execute function private.sync_idea_vote_count();

create or replace function private.sync_idea_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  delta integer := 0;
  target uuid;
begin
  if tg_op = 'INSERT' then
    target := new.idea_id;
    delta := case when new.status = 'visible' then 1 else 0 end;
  elsif tg_op = 'DELETE' then
    target := old.idea_id;
    delta := case when old.status = 'visible' then -1 else 0 end;
  else
    target := new.idea_id;
    delta := (case when new.status = 'visible' then 1 else 0 end)
           - (case when old.status = 'visible' then 1 else 0 end);
  end if;

  if delta <> 0 then
    update public.ideas set comment_count = greatest(comment_count + delta, 0) where id = target;
  end if;
  return null;
end;
$$;

create trigger idea_comments_sync_count
  after insert or delete or update of status on public.idea_comments
  for each row execute function private.sync_idea_comment_count();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.ideas enable row level security;
alter table public.idea_categories enable row level security;
alter table public.idea_votes enable row level security;
alter table public.idea_comments enable row level security;

-- One policy per role and action, with conditions OR'd together.

-- ideas --------------------------------------------------------------------------
create policy "Public ideas are visible to everyone; authors and administrators see more"
  on public.ideas for select
  to anon, authenticated
  using (
    private.is_public_idea_status(status)
    or author_id = (select auth.uid())
    or (select private.is_admin())
  );

create policy "Members can propose ideas; administrators can add ideas"
  on public.ideas for insert
  to authenticated
  with check (
    (select private.is_admin())
    or (
      (select private.has_min_role('registered_user'))
      and author_id = (select auth.uid())
      and status in ('draft', 'pending_review')
      and vote_count = 0
      and comment_count = 0
    )
  );

create policy "Authors can edit unpublished ideas; administrators can manage ideas"
  on public.ideas for update
  to authenticated
  using (
    (select private.is_admin())
    or (author_id = (select auth.uid()) and status in ('draft', 'pending_review'))
  )
  with check (
    (select private.is_admin())
    or (author_id = (select auth.uid()) and status in ('draft', 'pending_review'))
  );

create policy "Authors can delete drafts; administrators can delete ideas"
  on public.ideas for delete
  to authenticated
  using (
    (select private.is_admin())
    or (author_id = (select auth.uid()) and status = 'draft')
  );

-- idea_categories --------------------------------------------------------------
-- Visibility follows the idea (the subquery is subject to RLS on ideas).
create policy "Idea categories are visible when the idea is visible"
  on public.idea_categories for select
  to anon, authenticated
  using (exists (select 1 from public.ideas i where i.id = idea_id));

create policy "Authors can categorise unpublished ideas; administrators any idea"
  on public.idea_categories for insert
  to authenticated
  with check (
    (select private.is_admin())
    or exists (
      select 1 from public.ideas i
      where i.id = idea_id and i.author_id = (select auth.uid()) and i.status in ('draft', 'pending_review')
    )
  );

create policy "Administrators can update idea categories"
  on public.idea_categories for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Authors can uncategorise unpublished ideas; administrators any idea"
  on public.idea_categories for delete
  to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.ideas i
      where i.id = idea_id and i.author_id = (select auth.uid()) and i.status in ('draft', 'pending_review')
    )
  );

-- idea_votes -------------------------------------------------------------------
create policy "Members see their own votes; administrators see all"
  on public.idea_votes for select
  to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

create policy "Members can vote on open ideas"
  on public.idea_votes for insert
  to authenticated
  with check (
    (select private.has_min_role('registered_user'))
    and user_id = (select auth.uid())
    and exists (
      select 1 from public.ideas i where i.id = idea_id and i.status in ('open', 'approved')
    )
  );

create policy "Members can remove their own votes"
  on public.idea_votes for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- idea_comments ----------------------------------------------------------------
create policy "Visible comments on visible ideas are public; authors and administrators see more"
  on public.idea_comments for select
  to anon, authenticated
  using (
    (status = 'visible' and exists (select 1 from public.ideas i where i.id = idea_id))
    or author_id = (select auth.uid())
    or (select private.is_admin())
  );

create policy "Members can comment on public ideas; administrators can add comments"
  on public.idea_comments for insert
  to authenticated
  with check (
    (select private.is_admin())
    or (
      (select private.has_min_role('registered_user'))
      and author_id = (select auth.uid())
      and status = 'visible'
      and exists (
        select 1 from public.ideas i where i.id = idea_id and private.is_public_idea_status(i.status)
      )
    )
  );

create policy "Authors can edit or delete their comments; administrators can moderate"
  on public.idea_comments for update
  to authenticated
  using (
    (select private.is_admin())
    or (author_id = (select auth.uid()) and status <> 'hidden')
  )
  with check (
    (select private.is_admin())
    or (author_id = (select auth.uid()) and status in ('visible', 'deleted'))
  );

create policy "Administrators can delete comments"
  on public.idea_comments for delete
  to authenticated
  using ((select private.is_admin()));

-- =============================================================================
-- Privileges
-- =============================================================================
revoke all on public.ideas, public.idea_categories, public.idea_votes, public.idea_comments
  from anon, authenticated;

grant select on public.ideas, public.idea_categories, public.idea_comments to anon;

grant select, delete on public.ideas to authenticated;
grant insert (slug, title, summary, problem_statement, proposed_solution, target_audience, author_id, status,
  reviewed_by, reviewed_at, review_notes)
  on public.ideas to authenticated;
-- Counters are never writable by API users; they are maintained by triggers.
grant update (slug, title, summary, problem_statement, proposed_solution, target_audience, status,
  reviewed_by, reviewed_at, review_notes)
  on public.ideas to authenticated;

grant select, insert, delete on public.idea_categories to authenticated;
grant select, insert, delete on public.idea_votes to authenticated;
grant select, insert, delete on public.idea_comments to authenticated;
grant update (body, status, edited_at) on public.idea_comments to authenticated;

grant all on public.ideas, public.idea_categories, public.idea_votes, public.idea_comments to service_role;

-- Functions are executable by PUBLIC by default; keep private helpers locked down
-- (explicit grants to API roles above are unaffected).
revoke execute on all functions in schema private from public;
