# Database

ChristianTooling uses Supabase PostgreSQL 17. The schema lives in ordered SQL migrations in
`supabase/migrations/`, and every table in the exposed `public` schema has Row Level Security (RLS).

## Inventory

| Item                                | Count                              |
| ----------------------------------- | ---------------------------------- |
| Tables (`public`)                   | 31                                 |
| RLS policies (`public` / `storage`) | 107 / 5                            |
| Enum types                          | 20                                 |
| Helper functions (`private`)        | 26                                 |
| Indexes                             | 107 (every foreign key is indexed) |
| Storage buckets                     | 3                                  |
| pgTAP tests                         | 80                                 |

## Migrations

| File                                            | Contents                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `20261118100000_foundation.sql`                 | `private` schema, `publication_status`, UUIDv7 generator, `updated_at` / `published_at` triggers |
| `20261118100100_identity_and_access.sql`        | Roles, profiles, account preferences, role assignments, audit log, role helpers, signup trigger  |
| `20261118100200_tool_directory.sql`             | Practice categories, technology types, tools and their relationships, tool submissions           |
| `20261118100300_ideas.sql`                      | Ideas, idea categories, votes, threaded comments, counter triggers                               |
| `20261118100400_volunteers_and_projects.sql`    | Skills, contributor profiles, projects, teams, applications, milestones, updates                 |
| `20261118100500_donations.sql`                  | Donations, recurring donations, project allocations, impact reports                              |
| `20261118100600_communications_and_content.sql` | Notifications, announcements, website pages                                                      |
| `20261118100700_storage.sql`                    | Storage buckets (`avatars`, `tool-logos`, `content-media`) and policies                          |
| `20261118100800_reference_data.sql`             | Initial practice categories (15), technology types (12) and skills (20)                          |

## Tables by module

**Users and authentication**

| Table                 | Purpose                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| `auth.users`          | Managed by Supabase Auth (credentials, email).                                                               |
| `profiles`            | Public profile per user: display name, username, bio, avatar, status (`active`, `suspended`, `deactivated`). |
| `account_preferences` | Private settings: notification and newsletter choices, locale, time zone.                                    |
| `roles`               | Role catalogue with ranks (`visitor` 0 ... `super_administrator` 40).                                        |
| `user_roles`          | Elevated roles granted to users (contributor, administrator, super administrator).                           |

**Tool directory**

| Table                                      | Purpose                                                                                                        |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `practice_categories`                      | Christian practices (prayer, Bible study, worship, ...). Managed data with icon names.                         |
| `technology_types`                         | Delivery formats (web app, mobile app, API, ...).                                                              |
| `tools`                                    | Directory entries. `ownership = 'christiantooling'` marks the ministry's own tools. Full-text `search_vector`. |
| `tool_categories`, `tool_technology_types` | Many-to-many links (one primary category per tool).                                                            |
| `tool_submissions`                         | Community suggestions with a review workflow; approval links to `tools`.                                       |

**Ideas**: `ideas` (lifecycle from draft to launched, denormalised vote and comment counts,
full-text search), `idea_categories`, `idea_votes` (one per member per idea, private),
`idea_comments` (threaded, soft-deletable, moderatable).

**Volunteers and projects**: `skills`, `contributor_profiles`, `contributor_skills`, `projects`
(optionally from an idea, optionally producing a tool), `project_skills`, `project_contributors`
(lead, maintainer, contributor, advisor), `volunteer_applications` (general or per project),
`project_milestones`, `project_updates`.

**Donations**: `donations` and `recurring_donations` (provider references and integer minor-unit
amounts only; never card data), `project_allocations` (donor-designated or general-fund),
`impact_reports`.

**Administration**: `notifications` (in-app only links), `announcements` (audience-targeted),
`site_pages` (CMS pages), `audit_logs` (append-only; role grants and status changes are recorded
automatically).

## Conventions

- **Keys:** entity tables use time-ordered UUIDv7 (`private.uuid_generate_v7()`); join tables use
  composite keys; the audit log uses a bigint identity.
- **Timestamps:** `created_at` and `updated_at` (`timestamptz`) maintained by triggers;
  `published_at` is stamped automatically when content is first published.
- **Constraints:** slugs, usernames, URLs and lengths are validated in the database as well as in
  Zod schemas. URLs must be `http(s)`; notification links must be in-app paths.
- **Money:** `amount_minor bigint` plus an ISO 4217 `currency`, matching payment provider APIs.
- **Statuses:** Postgres enums, which generate TypeScript union types.
- **Indexes:** every foreign key, every column used in RLS, and the common listing orders.

## Row Level Security model

- RLS is enabled on every `public` table. One policy exists per role and action, with conditions
  combined using `OR` (the Supabase performance advisor reports no issues).
- Policies use `(select auth.uid())` and `(select private.is_admin())` so Postgres evaluates them
  once per statement instead of once per row.
- Role checks use `SECURITY DEFINER` helpers in the unexposed `private` schema (`has_min_role`,
  `is_admin`, `can_manage_role`, `can_manage_project`, ...). They avoid policy recursion, pin
  `search_path`, and answer questions only about the requesting user's rights.
- **Privileges are least-privilege as well:** each migration revokes the default grants and grants
  only what the API roles need. Column-level grants stop users from writing protected columns
  (for example `profiles.status`, vote counters or notification content).
- **Triggers protect workflows:** only administrators can set review fields; members cannot change
  their own status; implicit roles cannot be granted; the last super administrator cannot be
  removed; vote and comment counts are maintained server-side.
- **Financial records** have no insert policies for API users: they will be written by payment
  webhooks using the service role.

## Workflow for schema changes

1. Create a migration: `npm run db:new add_feature_name`.
2. Write the SQL (tables, indexes, RLS, grants) following the conventions above.
3. Apply locally: `npm run db:reset`.
4. Add pgTAP tests in `supabase/tests/database/` and run `npm run db:test`.
5. Check advisors: `npx supabase db advisors` (should report no findings).
6. Regenerate types: `npm run db:types`.
7. After review, deploy with `npm run db:push` before the code that depends on it.

Never edit a migration that has been applied to a shared or production database; add a new one.

## Testing

`supabase/tests/database/` contains pgTAP suites that run as real `anon` and `authenticated`
users:

- `00_schema_security`: RLS everywhere, no exposed `SECURITY DEFINER` functions, no
  `PUBLIC`-executable helpers, pinned `search_path`, no anonymous writes, indexed foreign keys,
  roles catalogue matches the code.
- `01_identity_and_roles`: signup trigger, own-data access, privilege escalation attempts, role
  grant rules, suspension, audit log, last super administrator safeguard.
- `02_directory_and_ideas`: visibility of drafts and inactive data, submissions and review fields,
  voting rules and counters, comments, suspended accounts.
- `03_projects_donations_content`: project-lead scoping, applications, donor privacy, announcements
  by audience, notification link safety, avatar storage isolation.
