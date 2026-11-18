-- Tool directory, submissions, ideas, votes and comments.
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('20000000-0000-0000-0000-000000000001', 'admin@test.local', '{"display_name":"Ada Admin"}'),
  ('20000000-0000-0000-0000-000000000002', 'member@test.local', '{"display_name":"Mary Member"}'),
  ('20000000-0000-0000-0000-000000000003', 'suspended@test.local', '{"display_name":"Sid Suspended"}');

insert into public.user_roles (user_id, role) values ('20000000-0000-0000-0000-000000000001', 'administrator');
update public.profiles set status = 'suspended' where id = '20000000-0000-0000-0000-000000000003';

update public.practice_categories set is_active = false where slug = 'fasting';

insert into public.tools (id, slug, name, status) values
  ('21000000-0000-0000-0000-000000000001', 'published-tool', 'Published Tool', 'published'),
  ('21000000-0000-0000-0000-000000000002', 'draft-tool', 'Draft Tool', 'draft');

insert into public.ideas (id, slug, title, summary, author_id, status) values
  ('22000000-0000-0000-0000-000000000001', 'open-idea', 'An open idea for prayer', 'A summary long enough to pass.', '20000000-0000-0000-0000-000000000001', 'open'),
  ('22000000-0000-0000-0000-000000000002', 'pending-idea', 'A pending idea', 'A summary long enough to pass.', '20000000-0000-0000-0000-000000000001', 'pending_review');

select isnt(
  (select published_at from public.tools where slug = 'published-tool'),
  null,
  'Publishing a tool stamps published_at automatically'
);

-- ---------------------------------------------------------------------------
-- Visitors
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role":"anon"}';

select is(
  (select count(*)::int from public.practice_categories where slug = 'fasting'),
  0,
  'Visitors do not see inactive categories'
);

select is(
  (select count(*)::int from public.tools where id in ('21000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000002')),
  1,
  'Visitors only see published tools'
);

select is(
  (select count(*)::int from public.ideas where slug in ('open-idea', 'pending-idea')),
  1,
  'Visitors only see public ideas'
);

select throws_ok(
  $$ insert into public.practice_categories (slug, name) values ('hacked', 'Hacked') $$,
  '42501', null,
  'Visitors cannot create categories'
);

-- ---------------------------------------------------------------------------
-- A registered member
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated"}';

select throws_ok(
  $$ insert into public.practice_categories (slug, name) values ('hacked', 'Hacked') $$,
  '42501', null,
  'Members cannot create categories'
);

select lives_ok(
  $$ insert into public.tool_submissions (id, submitted_by, name, website_url)
     values ('23000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Prayer Pal', 'https://example.org') $$,
  'Members can submit a tool'
);

select throws_ok(
  $$ insert into public.tool_submissions (submitted_by, name, website_url, status)
     values ('20000000-0000-0000-0000-000000000002', 'Sneaky', 'https://example.org', 'approved') $$,
  '42501', null,
  'Members cannot submit pre-approved tools'
);

select throws_ok(
  $$ update public.tool_submissions set review_notes = 'Looks great' where id = '23000000-0000-0000-0000-000000000001' $$,
  '42501', null,
  'Members cannot write review notes'
);

select lives_ok(
  $$ update public.tool_submissions set status = 'withdrawn' where id = '23000000-0000-0000-0000-000000000001' $$,
  'Members can withdraw their own pending submission'
);

select lives_ok(
  $$ insert into public.ideas (slug, title, summary, author_id)
     values ('member-idea', 'A member idea', 'A summary long enough to pass.', '20000000-0000-0000-0000-000000000002') $$,
  'Members can propose an idea (ids are generated server-side)'
);

select is(
  (select status::text from public.ideas where slug = 'member-idea'),
  'pending_review',
  'New ideas wait for moderation'
);

select throws_ok(
  $$ update public.ideas set vote_count = 999 where slug = 'member-idea' $$,
  '42501', null,
  'Authors cannot edit vote counts'
);

select lives_ok(
  $$ insert into public.idea_votes (idea_id, user_id) values ('22000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002') $$,
  'Members can vote on an open idea'
);

select is(
  (select vote_count from public.ideas where id = '22000000-0000-0000-0000-000000000001'),
  1,
  'Voting increments the idea vote count'
);

select throws_ok(
  $$ insert into public.idea_votes (idea_id, user_id) values ('22000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002') $$,
  '23505', null,
  'Members can only vote once per idea'
);

select throws_ok(
  $$ insert into public.idea_votes (idea_id, user_id) values ('22000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002') $$,
  '42501', null,
  'Members cannot vote on ideas that are not open'
);

delete from public.idea_votes where idea_id = '22000000-0000-0000-0000-000000000001';
select is(
  (select vote_count from public.ideas where id = '22000000-0000-0000-0000-000000000001'),
  0,
  'Removing a vote decrements the count'
);

select lives_ok(
  $$ insert into public.idea_comments (id, idea_id, author_id, body)
     values ('24000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Love this.') $$,
  'Members can comment on a public idea'
);

select is(
  (select comment_count from public.ideas where id = '22000000-0000-0000-0000-000000000001'),
  1,
  'Commenting increments the comment count'
);

update public.idea_comments set status = 'deleted' where id = '24000000-0000-0000-0000-000000000001';
select is(
  (select comment_count from public.ideas where id = '22000000-0000-0000-0000-000000000001'),
  0,
  'Deleting a comment decrements the comment count'
);

-- ---------------------------------------------------------------------------
-- A suspended member
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"20000000-0000-0000-0000-000000000003","role":"authenticated"}';

select throws_ok(
  $$ insert into public.tool_submissions (submitted_by, name, website_url)
     values ('20000000-0000-0000-0000-000000000003', 'Spam', 'https://spam.example') $$,
  '42501', null,
  'Suspended members cannot submit tools'
);

select throws_ok(
  $$ insert into public.idea_votes (idea_id, user_id) values ('22000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003') $$,
  '42501', null,
  'Suspended members cannot vote'
);

-- ---------------------------------------------------------------------------
-- An administrator
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (select count(*)::int from public.practice_categories where slug = 'fasting'),
  1,
  'Administrators see inactive categories'
);

select is(
  (select count(*)::int from public.tools where id in ('21000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000002')),
  2,
  'Administrators see draft tools'
);

select lives_ok(
  $$ update public.ideas set status = 'open', reviewed_by = '20000000-0000-0000-0000-000000000001', reviewed_at = now()
     where slug = 'member-idea' $$,
  'Administrators can approve an idea for the public'
);

reset role;
set local role anon;
set local request.jwt.claims to '{"role":"anon"}';

select is(
  (select count(*)::int from public.ideas where slug = 'member-idea'),
  1,
  'Approved ideas become publicly visible'
);

select * from finish();
rollback;
