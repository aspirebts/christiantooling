-- =============================================================================
-- Foundation: private schema, shared types and utility functions
-- =============================================================================
-- Conventions used by every ChristianTooling migration:
--   * Tables live in `public` (exposed through the Supabase Data API) and ALWAYS
--     have Row Level Security enabled with explicit, least-privilege GRANTs.
--   * Helper functions used by policies, triggers and column defaults live in
--     `private`, which is NOT exposed through the Data API.
--   * Entity tables use time-ordered UUIDv7 primary keys; join tables use
--     composite primary keys; append-only logs use bigint identity keys.
--   * Every foreign key column is indexed.
--   * Every mutable table has created_at / updated_at maintained by a trigger.
-- =============================================================================

create schema if not exists private;
comment on schema private is
  'Internal helpers for RLS policies, triggers and defaults. Not exposed through the Data API.';

revoke all on schema private from public;
-- Policies, column defaults and check expressions are evaluated as the
-- requesting role, so API roles need to resolve names in this schema.
grant usage on schema private to anon, authenticated, service_role;
-- Postgres grants EXECUTE on new functions to PUBLIC, and a per-schema
-- ALTER DEFAULT PRIVILEGES cannot revoke a global default. Every migration that
-- creates private functions therefore ends with an explicit
-- `revoke execute on all functions in schema private from public` and grants
-- EXECUTE only to the roles that need it.

-- -----------------------------------------------------------------------------
-- Shared enum types
-- -----------------------------------------------------------------------------

-- Publication lifecycle shared by directory entries and CMS-style content.
create type public.publication_status as enum ('draft', 'published', 'archived');
comment on type public.publication_status is
  'Lifecycle for publishable content: draft (private), published (public), archived (hidden).';

-- -----------------------------------------------------------------------------
-- UUIDv7 generator
-- -----------------------------------------------------------------------------
-- Time-ordered UUIDs avoid the B-tree fragmentation of random UUIDv4 keys while
-- remaining safe to expose in URLs. Swap for the native uuidv7() once the
-- project runs on Postgres 18 or later.
create or replace function private.uuid_generate_v7()
returns uuid
language sql
volatile
parallel safe
set search_path = ''
as $$
  -- Overwrite the first 48 bits of a random v4 UUID with the Unix timestamp in
  -- milliseconds, then flip the version nibble from 4 (0100) to 7 (0111).
  select encode(
    set_bit(
      set_bit(
        overlay(
          uuid_send(gen_random_uuid())
          placing substring(int8send(floor(extract(epoch from clock_timestamp()) * 1000)::bigint) from 3)
          from 1 for 6
        ),
        52, 1
      ),
      53, 1
    ),
    'hex'
  )::uuid;
$$;

comment on function private.uuid_generate_v7() is 'Generates a time-ordered RFC 9562 UUIDv7.';
grant execute on function private.uuid_generate_v7() to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Trigger: keep updated_at current
-- -----------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function private.set_updated_at() is 'BEFORE UPDATE trigger that stamps updated_at.';

-- -----------------------------------------------------------------------------
-- Trigger: stamp published_at the first time a row is published
-- -----------------------------------------------------------------------------
-- Works for any table with `status` and `published_at` columns.
create or replace function private.set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status::text = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

comment on function private.set_published_at() is
  'BEFORE INSERT/UPDATE trigger that sets published_at when status becomes published.';

-- Functions are executable by PUBLIC by default; keep private helpers locked down
-- (explicit grants to API roles above are unaffected).
revoke execute on all functions in schema private from public;
