-- Identity, profiles and role-based access control.
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

-- ---------------------------------------------------------------------------
-- Fixtures (created as the migration owner; the signup trigger builds profiles)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('10000000-0000-0000-0000-000000000001', 'super@test.local', '{"display_name":"Sam Super"}'),
  ('10000000-0000-0000-0000-000000000002', 'admin@test.local', '{"display_name":"Ada Admin"}'),
  ('10000000-0000-0000-0000-000000000003', 'member@test.local', '{"display_name":"  Mary Member  "}'),
  ('10000000-0000-0000-0000-000000000004', 'other@test.local', '{"display_name":"Oscar Other"}');

insert into public.user_roles (user_id, role) values
  ('10000000-0000-0000-0000-000000000001', 'super_administrator'),
  ('10000000-0000-0000-0000-000000000002', 'administrator');

select is(
  (select display_name from public.profiles where id = '10000000-0000-0000-0000-000000000003'),
  'Mary Member',
  'Signup creates a profile with the trimmed display name'
);

select is(
  (select count(*)::int from public.account_preferences where user_id = '10000000-0000-0000-0000-000000000003'),
  1,
  'Signup creates an account preferences row'
);

select throws_ok(
  $$ insert into public.user_roles (user_id, role) values ('10000000-0000-0000-0000-000000000003', 'registered_user') $$,
  '23514', null,
  'Implicit roles cannot be granted, even by the database owner'
);

-- ---------------------------------------------------------------------------
-- A registered member
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}';

select is((select private.current_role_rank())::int, 10, 'A member has the registered_user rank');

select is(
  (select count(*)::int from public.account_preferences),
  1,
  'Members only see their own preferences'
);

update public.profiles set display_name = 'Mary M.' where id = '10000000-0000-0000-0000-000000000003';
select is(
  (select display_name from public.profiles where id = '10000000-0000-0000-0000-000000000003'),
  'Mary M.',
  'Members can update their own profile'
);

update public.profiles set display_name = 'Hijacked' where id = '10000000-0000-0000-0000-000000000004';
select is(
  (select display_name from public.profiles where id = '10000000-0000-0000-0000-000000000004'),
  'Oscar Other',
  'Members cannot update someone else''s profile'
);

select throws_ok(
  $$ update public.profiles set status = 'suspended' where id = '10000000-0000-0000-0000-000000000003' $$,
  '42501', null,
  'Members cannot change their own account status'
);

select throws_ok(
  $$ update public.profiles set id = '10000000-0000-0000-0000-000000000099' where id = '10000000-0000-0000-0000-000000000003' $$,
  '42501', null,
  'Members cannot change their profile id (column privilege)'
);

select throws_ok(
  $$ insert into public.user_roles (user_id, role, granted_by)
     values ('10000000-0000-0000-0000-000000000003', 'administrator', '10000000-0000-0000-0000-000000000003') $$,
  '42501', null,
  'Members cannot grant themselves a role'
);

select is((select count(*)::int from public.user_roles), 0, 'Members only see their own role assignments');
select is((select count(*)::int from public.audit_logs), 0, 'Members cannot read the audit log');

-- ---------------------------------------------------------------------------
-- An administrator
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}';

select ok((select private.is_admin()), 'Administrators pass is_admin()');

select lives_ok(
  $$ insert into public.user_roles (user_id, role, granted_by)
     values ('10000000-0000-0000-0000-000000000003', 'contributor', '10000000-0000-0000-0000-000000000002') $$,
  'Administrators can grant the contributor role'
);

select throws_ok(
  $$ insert into public.user_roles (user_id, role, granted_by)
     values ('10000000-0000-0000-0000-000000000004', 'administrator', '10000000-0000-0000-0000-000000000002') $$,
  '42501', null,
  'Administrators cannot grant the administrator role'
);

select throws_ok(
  $$ update public.profiles set status = 'suspended' where id = '10000000-0000-0000-0000-000000000001' $$,
  '42501', null,
  'Administrators cannot suspend a super administrator'
);

select lives_ok(
  $$ update public.profiles set status = 'suspended' where id = '10000000-0000-0000-0000-000000000004' $$,
  'Administrators can suspend a member'
);

select is(
  (select private.effective_role_rank('10000000-0000-0000-0000-000000000004'))::int,
  0,
  'Suspended accounts lose their effective rank'
);

select is(
  (select count(*)::int from public.audit_logs
   where action in ('role.granted', 'profile.status_changed')
     and entity_id like '10000000-0000-0000-0000-00000000000_'),
  4,
  'Role grants and status changes are written to the audit log'
);

select is(
  (select actor_id::text from public.audit_logs
   where action = 'role.granted' and entity_id = '10000000-0000-0000-0000-000000000003'
     and metadata ->> 'role' = 'contributor'),
  '10000000-0000-0000-0000-000000000002',
  'The audit log records which administrator granted a role'
);

-- ---------------------------------------------------------------------------
-- A super administrator
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}';

select lives_ok(
  $$ insert into public.user_roles (user_id, role, granted_by)
     values ('10000000-0000-0000-0000-000000000003', 'administrator', '10000000-0000-0000-0000-000000000001') $$,
  'Super administrators can grant the administrator role'
);

delete from public.user_roles
where user_id = '10000000-0000-0000-0000-000000000001' and role = 'super_administrator';
select ok(
  exists (select 1 from public.user_roles where user_id = '10000000-0000-0000-0000-000000000001' and role = 'super_administrator'),
  'Nobody can revoke their own roles'
);

-- ---------------------------------------------------------------------------
-- Signed-out visitors
-- ---------------------------------------------------------------------------
reset role;
set local role anon;
set local request.jwt.claims to '{"role":"anon"}';

select is((select private.current_role_rank())::int, 0, 'Visitors have rank 0');

select is(
  (select count(*)::int from public.profiles where id = '10000000-0000-0000-0000-000000000003'),
  1,
  'Visitors can see active profiles'
);

select is(
  (select count(*)::int from public.profiles where id = '10000000-0000-0000-0000-000000000004'),
  0,
  'Visitors cannot see suspended profiles'
);

select throws_ok(
  $$ select * from public.account_preferences $$,
  '42501', null,
  'Visitors have no access to account preferences'
);

-- ---------------------------------------------------------------------------
-- Platform safety net
-- ---------------------------------------------------------------------------
reset role;

select throws_ok(
  $$ delete from public.user_roles where role = 'super_administrator' $$,
  '23514', null,
  'The last super administrator can never be removed'
);

select * from finish();
rollback;
