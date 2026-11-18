-- =============================================================================
-- Donations: one-time and recurring gifts, project allocations, impact reports
-- =============================================================================
-- Payments are processed by an external provider (e.g. Stripe). This schema
-- stores provider references and amounts only: never card or bank details.
-- Donation rows are written by trusted server code (payment webhooks using the
-- service role), so there are deliberately no INSERT policies for API users.
--
-- Money is stored as integer minor units (e.g. cents) plus an ISO 4217 currency
-- code, which keeps arithmetic exact and matches payment provider APIs.
-- =============================================================================

create type public.donation_status as enum ('pending', 'succeeded', 'failed', 'refunded', 'cancelled');
create type public.recurring_interval as enum ('month', 'quarter', 'year');
create type public.recurring_status as enum ('active', 'paused', 'past_due', 'cancelled');
create type public.allocation_source as enum ('donor_designated', 'general_fund');

-- -----------------------------------------------------------------------------
-- Recurring donations (subscriptions at the payment provider)
-- -----------------------------------------------------------------------------
create table public.recurring_donations (
  id uuid primary key default private.uuid_generate_v7(),
  donor_id uuid references public.profiles (id) on delete set null,
  amount_minor bigint not null,
  currency text not null default 'USD',
  billing_interval public.recurring_interval not null default 'month',
  status public.recurring_status not null default 'active',
  provider text not null,
  provider_subscription_id text not null,
  designated_project_id uuid references public.projects (id) on delete set null,
  started_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_donations_amount_positive check (amount_minor > 0),
  constraint recurring_donations_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint recurring_donations_provider_format check (provider ~ '^[a-z][a-z0-9_]*$'),
  constraint recurring_donations_provider_unique unique (provider, provider_subscription_id)
);

comment on column public.recurring_donations.amount_minor is 'Amount per charge in minor currency units (e.g. cents).';

create index recurring_donations_donor_id_idx on public.recurring_donations (donor_id);
create index recurring_donations_project_idx on public.recurring_donations (designated_project_id);
create index recurring_donations_status_idx on public.recurring_donations (status);

create trigger recurring_donations_set_updated_at
  before update on public.recurring_donations
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Donations (individual payments, including each recurring charge)
-- -----------------------------------------------------------------------------
create table public.donations (
  id uuid primary key default private.uuid_generate_v7(),
  donor_id uuid references public.profiles (id) on delete set null,
  donor_email text,
  donor_name text,
  is_anonymous boolean not null default false,
  amount_minor bigint not null,
  currency text not null default 'USD',
  status public.donation_status not null default 'pending',
  provider text not null,
  provider_payment_id text,
  recurring_donation_id uuid references public.recurring_donations (id) on delete set null,
  designated_project_id uuid references public.projects (id) on delete set null,
  message text,
  donated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint donations_amount_positive check (amount_minor > 0),
  constraint donations_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint donations_provider_format check (provider ~ '^[a-z][a-z0-9_]*$'),
  constraint donations_email_length check (char_length(donor_email) <= 320),
  constraint donations_name_length check (char_length(donor_name) <= 120),
  constraint donations_message_length check (char_length(message) <= 1000),
  constraint donations_provider_payment_unique unique (provider, provider_payment_id)
);

comment on table public.donations is 'Individual gifts. Written by payment webhooks; contains donor PII, so access is restricted.';
comment on column public.donations.donor_email is 'Receipt address (required for guest donors). PII: visible to the donor and administrators only.';
comment on column public.donations.is_anonymous is 'When true, the donor name is never shown publicly.';

create index donations_donor_id_idx on public.donations (donor_id);
create index donations_recurring_donation_id_idx on public.donations (recurring_donation_id);
create index donations_project_idx on public.donations (designated_project_id);
create index donations_status_donated_idx on public.donations (status, donated_at desc);

create trigger donations_set_updated_at
  before update on public.donations
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Project allocations (how funds are directed to projects)
-- -----------------------------------------------------------------------------
create table public.project_allocations (
  id uuid primary key default private.uuid_generate_v7(),
  project_id uuid not null references public.projects (id) on delete restrict,
  donation_id uuid references public.donations (id) on delete cascade,
  source public.allocation_source not null,
  amount_minor bigint not null,
  currency text not null default 'USD',
  note text,
  allocated_by uuid references public.profiles (id) on delete set null,
  allocated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_allocations_amount_positive check (amount_minor > 0),
  constraint project_allocations_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint project_allocations_note_length check (char_length(note) <= 1000),
  constraint project_allocations_source_matches_donation
    check ((source = 'donor_designated') = (donation_id is not null))
);

comment on table public.project_allocations is
  'Funds directed to projects: donor-designated gifts (donation_id set) or general-fund budget decisions.';

create index project_allocations_project_id_idx on public.project_allocations (project_id);
create index project_allocations_donation_id_idx on public.project_allocations (donation_id);
create index project_allocations_allocated_by_idx on public.project_allocations (allocated_by);

create trigger project_allocations_set_updated_at
  before update on public.project_allocations
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Impact reports (public accountability to supporters)
-- -----------------------------------------------------------------------------
create table public.impact_reports (
  id uuid primary key default private.uuid_generate_v7(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  body text not null default '',
  period_start date,
  period_end date,
  project_id uuid references public.projects (id) on delete set null,
  cover_image_path text,
  status public.publication_status not null default 'draft',
  published_at timestamptz,
  author_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint impact_reports_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  constraint impact_reports_title_length check (char_length(title) between 1 and 160),
  constraint impact_reports_summary_length check (char_length(summary) <= 500),
  constraint impact_reports_body_length check (char_length(body) <= 50000),
  constraint impact_reports_period_ordered check (period_end is null or period_start is null or period_end >= period_start),
  constraint impact_reports_published_requires_date check (status <> 'published' or published_at is not null)
);

comment on column public.impact_reports.cover_image_path is 'Object path inside the content-media storage bucket.';

create index impact_reports_status_published_idx on public.impact_reports (status, published_at desc);
create index impact_reports_project_id_idx on public.impact_reports (project_id);
create index impact_reports_author_id_idx on public.impact_reports (author_id);

create trigger impact_reports_set_published_at
  before insert or update on public.impact_reports
  for each row execute function private.set_published_at();

create trigger impact_reports_set_updated_at
  before update on public.impact_reports
  for each row execute function private.set_updated_at();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.recurring_donations enable row level security;
alter table public.donations enable row level security;
alter table public.project_allocations enable row level security;
alter table public.impact_reports enable row level security;

-- One policy per role and action, with conditions OR'd together.

-- recurring_donations --------------------------------------------------------------
create policy "Donors see their own recurring donations; administrators see all"
  on public.recurring_donations for select
  to authenticated
  using (donor_id = (select auth.uid()) or (select private.is_admin()));

-- donations -----------------------------------------------------------------------
create policy "Donors see their own donations; administrators see all"
  on public.donations for select
  to authenticated
  using (donor_id = (select auth.uid()) or (select private.is_admin()));

-- project_allocations -------------------------------------------------------------
create policy "Donors see allocations of their gifts; administrators see all"
  on public.project_allocations for select
  to authenticated
  using (
    (select private.is_admin())
    or (
      donation_id is not null
      and exists (
        select 1 from public.donations d where d.id = donation_id and d.donor_id = (select auth.uid())
      )
    )
  );

create policy "Administrators can create allocations"
  on public.project_allocations for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Administrators can update allocations"
  on public.project_allocations for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Administrators can delete allocations"
  on public.project_allocations for delete
  to authenticated
  using ((select private.is_admin()));

-- impact_reports ------------------------------------------------------------------
create policy "Published impact reports are public; administrators see all"
  on public.impact_reports for select
  to anon, authenticated
  using (status = 'published' or (select private.is_admin()));

create policy "Administrators can create impact reports"
  on public.impact_reports for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Administrators can update impact reports"
  on public.impact_reports for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Administrators can delete impact reports"
  on public.impact_reports for delete
  to authenticated
  using ((select private.is_admin()));

-- =============================================================================
-- Privileges
-- =============================================================================
revoke all on public.recurring_donations, public.donations, public.project_allocations, public.impact_reports
  from anon, authenticated;

grant select on public.impact_reports to anon;
-- Financial records are read-only for API users; webhooks write with the service role.
grant select on public.recurring_donations, public.donations to authenticated;
grant select, insert, update, delete on public.project_allocations, public.impact_reports to authenticated;

grant all on public.recurring_donations, public.donations, public.project_allocations, public.impact_reports
  to service_role;
