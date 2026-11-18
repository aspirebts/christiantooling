-- Volunteers and projects, donations, notifications, announcements and storage.
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('30000000-0000-0000-0000-000000000001', 'admin@test.local', '{"display_name":"Ada Admin"}'),
  ('30000000-0000-0000-0000-000000000002', 'lead@test.local', '{"display_name":"Lee Lead"}'),
  ('30000000-0000-0000-0000-000000000003', 'contributor@test.local', '{"display_name":"Cam Contributor"}'),
  ('30000000-0000-0000-0000-000000000004', 'member@test.local', '{"display_name":"Mary Member"}');

insert into public.user_roles (user_id, role) values
  ('30000000-0000-0000-0000-000000000001', 'administrator'),
  ('30000000-0000-0000-0000-000000000002', 'contributor'),
  ('30000000-0000-0000-0000-000000000003', 'contributor');

insert into public.projects (id, slug, name, status) values
  ('31000000-0000-0000-0000-000000000001', 'prayer-companion', 'Prayer Companion', 'recruiting'),
  ('31000000-0000-0000-0000-000000000002', 'other-project', 'Other Project', 'recruiting');

insert into public.project_contributors (project_id, user_id, role) values
  ('31000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'lead');

insert into public.donations (id, donor_id, donor_email, amount_minor, currency, status, provider, provider_payment_id) values
  ('32000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'member@test.local', 2500, 'USD', 'succeeded', 'stripe', 'pi_1'),
  ('32000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', 'contributor@test.local', 5000, 'USD', 'succeeded', 'stripe', 'pi_2');

insert into public.announcements (title, audience, status) values
  ('For everyone', 'everyone', 'published'),
  ('For contributors', 'contributors', 'published'),
  ('Draft notice', 'everyone', 'draft');

-- ---------------------------------------------------------------------------
-- A project lead
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated"}';

select lives_ok(
  $$ update public.projects set summary = 'Helping families pray together.' where id = '31000000-0000-0000-0000-000000000001' $$,
  'Project leads can update their project'
);

update public.projects set summary = 'Not mine' where id = '31000000-0000-0000-0000-000000000002';
select is(
  (select summary from public.projects where id = '31000000-0000-0000-0000-000000000002'),
  '',
  'Project leads cannot update other projects'
);

select lives_ok(
  $$ insert into public.project_updates (project_id, author_id, title, body)
     values ('31000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Kick-off', 'We started!') $$,
  'Project leads can post project updates'
);

-- ---------------------------------------------------------------------------
-- A contributor and a plain member applying to volunteer
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"30000000-0000-0000-0000-000000000003","role":"authenticated"}';

select lives_ok(
  $$ insert into public.volunteer_applications (id, applicant_id, project_id, motivation)
     values ('33000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003',
             '31000000-0000-0000-0000-000000000001', 'I would love to help build this tool for families.') $$,
  'Contributors can apply to a recruiting project'
);

select throws_ok(
  $$ insert into public.volunteer_applications (applicant_id, project_id, motivation)
     values ('30000000-0000-0000-0000-000000000003', '31000000-0000-0000-0000-000000000001',
             'Applying twice to the very same project should fail.') $$,
  '23505', null,
  'Applicants can only have one open application per project'
);

select is((select count(*)::int from public.donations), 1, 'Donors only see their own donations');

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"30000000-0000-0000-0000-000000000004","role":"authenticated"}';

select throws_ok(
  $$ insert into public.volunteer_applications (applicant_id, project_id, motivation)
     values ('30000000-0000-0000-0000-000000000004', '31000000-0000-0000-0000-000000000001',
             'I am not a contributor yet but would like to join.') $$,
  '42501', null,
  'Members must be contributors before applying to projects'
);

select lives_ok(
  $$ insert into public.volunteer_applications (applicant_id, motivation)
     values ('30000000-0000-0000-0000-000000000004', 'I would like to become a ChristianTooling contributor.') $$,
  'Members can submit a general application to become a contributor'
);

select throws_ok(
  $$ insert into public.donations (donor_id, amount_minor, provider) values ('30000000-0000-0000-0000-000000000004', 100, 'stripe') $$,
  '42501', null,
  'Members cannot record donations (only payment webhooks can)'
);

select is(
  (select count(*)::int from public.announcements where title in ('For everyone', 'For contributors', 'Draft notice')),
  1,
  'Members only see announcements for their audience'
);

-- ---------------------------------------------------------------------------
-- The project lead reviewing applications
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated"}';

select is(
  (select count(*)::int from public.volunteer_applications),
  1,
  'Project leads see applications to their own projects only'
);

select lives_ok(
  $$ update public.volunteer_applications
     set status = 'accepted', reviewed_by = '30000000-0000-0000-0000-000000000002', reviewed_at = now()
     where id = '33000000-0000-0000-0000-000000000001' $$,
  'Project leads can review applications to their project'
);

select is(
  (select count(*)::int from public.announcements where title in ('For everyone', 'For contributors', 'Draft notice')),
  2,
  'Contributors also see contributor announcements'
);

-- ---------------------------------------------------------------------------
-- Notifications and storage
-- ---------------------------------------------------------------------------
reset role;

select throws_ok(
  $$ insert into public.notifications (user_id, type, title, link_path)
     values ('30000000-0000-0000-0000-000000000004', 'system.notice', 'Hello', '//evil.example/phish') $$,
  '23514', null,
  'Notification links must be in-app paths (no protocol-relative URLs)'
);

insert into public.notifications (user_id, type, title, link_path)
values ('30000000-0000-0000-0000-000000000004', 'submission.approved', 'Your tool was approved', '/dashboard');

set local role authenticated;
set local request.jwt.claims to '{"sub":"30000000-0000-0000-0000-000000000004","role":"authenticated"}';

select lives_ok(
  $$ update public.notifications set read_at = now() $$,
  'Recipients can mark notifications as read'
);

select throws_ok(
  $$ update public.notifications set title = 'Edited' $$,
  '42501', null,
  'Recipients cannot edit notification content'
);

select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner)
     values ('avatars', '30000000-0000-0000-0000-000000000004/avatar.png', '30000000-0000-0000-0000-000000000004') $$,
  'Members can upload into their own avatar folder'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner)
     values ('avatars', '30000000-0000-0000-0000-000000000003/avatar.png', '30000000-0000-0000-0000-000000000004') $$,
  '42501', null,
  'Members cannot upload into another member''s avatar folder'
);

select * from finish();
rollback;
