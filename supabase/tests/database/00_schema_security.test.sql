-- Structural security guarantees that must hold for every future migration.
-- Run with: npm run db:test   (supabase test db)
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

select is_empty(
  $$ select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity $$,
  'Row Level Security is enabled on every public table'
);

select is_empty(
  $$ select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where p.prosecdef and n.nspname = 'public' $$,
  'No SECURITY DEFINER functions are exposed in the public schema'
);

select is_empty(
  $$ select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'private' and has_function_privilege('public', p.oid, 'EXECUTE') $$,
  'No private helper is executable by PUBLIC'
);

select is_empty(
  $$ select n.nspname || '.' || p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('public', 'private')
       and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%') $$,
  'Every public and private function pins its search_path'
);

select is_empty(
  $$ select table_name || ':' || privilege_type from information_schema.role_table_grants
     where grantee = 'anon' and table_schema = 'public'
       and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE') $$,
  'The anon role cannot write to any public table'
);

select is_empty(
  $$ select conrelid::regclass::text || '.' || a.attname
     from pg_constraint c
     join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
     where c.contype = 'f' and c.connamespace = 'public'::regnamespace
       and not exists (
         select 1 from pg_index i where i.indrelid = c.conrelid and i.indkey[0] = a.attnum
       ) $$,
  'Every foreign key column is indexed'
);

select results_eq(
  $$ select key, rank::int, is_assignable from public.roles order by rank $$,
  $$ values ('visitor', 0, false), ('registered_user', 10, false), ('contributor', 20, true),
            ('administrator', 30, true), ('super_administrator', 40, true) $$,
  'Roles catalog matches the documented hierarchy (mirrored in src/lib/rbac/roles.ts)'
);

select ok(
  (select count(*) from public.practice_categories where is_active) >= 10,
  'Reference practice categories are seeded'
);

select * from finish();
rollback;
