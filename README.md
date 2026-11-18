# ChristianTooling

**Technology to Help You Live Your Faith.**

ChristianTooling is a global nonprofit Christian ministry that uses technology to help Christians
practise their faith more effectively. This repository contains the platform: a directory of
Christian tools, a home for ideas that should exist, a way to connect volunteers with open-source
projects, tools built by the ministry, and support for the donations that sustain it all.

> **Status:** foundation phase complete (architecture, database, authentication, roles, design
> system, page layouts). See [BUILD_PROGRESS.md](BUILD_PROGRESS.md) for what is done and what is next.

## Tech stack

| Area          | Choice                                                          |
| ------------- | --------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router, Cache Components, Turbopack), React 19  |
| Language      | TypeScript (strict)                                             |
| Styling       | Tailwind CSS 4, shadcn/ui (Radix UI), Lucide icons              |
| Data and auth | Supabase: PostgreSQL 17, Auth, Storage, Row Level Security      |
| Forms         | React Hook Form + Zod (the same schemas validate on the server) |
| Testing       | Vitest (unit), pgTAP (database and RLS), Playwright (browser)   |
| Hosting       | Vercel (application) and Supabase (database, auth, storage)     |

## Quick start (safe local mode)

You can run the site without any credentials. In **safe local mode** public pages render, while
sign-in and registration are disabled with a clear notice (authentication is never faked).

Requirements: Node.js 22.12 or newer (see `.nvmrc`) and npm.

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Open http://localhost:3000.

## Connecting Supabase

Authentication, profiles, roles and all data features need a Supabase project. Use the local stack
for development and a hosted project for staging and production.

### Option A: local Supabase stack (recommended for development)

Requires Docker. The Supabase CLI is installed as a dev dependency.

```bash
npm run db:start
```

This starts Postgres, Auth, Storage, the API gateway and Mailpit (a local inbox for auth emails),
applies every migration in `supabase/migrations`, and prints the local API URL and keys:

```bash
npx supabase status
```

Copy the **API URL** and **publishable key** into `.env.local`:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Restart `npm run dev`. Confirmation and password-reset emails arrive in Mailpit at
http://127.0.0.1:54324.

### Option B: hosted Supabase project

1. Create a project at https://supabase.com/dashboard.
2. Link the repository and push the schema (you will be asked for the database password):

   ```bash
   npx supabase login
   ```

   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```

   ```bash
   npm run db:push
   ```

3. In **Project Settings > API Keys**, copy the project URL and the **publishable** key into your
   environment (`.env.local` locally, Vercel project settings in production).
4. In **Authentication > URL Configuration**, set the **Site URL** to your production URL and add
   redirect URLs for local development (`http://localhost:3000/**`) and, if you use Vercel previews,
   your preview domain pattern.
5. In **Authentication > Sign In / Providers > Email**, keep **Confirm email** enabled and set the
   minimum password length to 8 with "letters and digits" (this mirrors `supabase/config.toml`).
6. In **Authentication > Email Templates**, update these templates so links use the cross-device
   `token_hash` flow. Copy the HTML from `supabase/templates/`, or change the link in each template:

   | Template       | Link                                                                                                 |
   | -------------- | ---------------------------------------------------------------------------------------------------- |
   | Confirm signup | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard`                 |
   | Reset password | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`         |
   | Change email   | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/dashboard/settings` |

   The default templates also work (the app supports the PKCE `code` flow), but only when the link
   is opened in the same browser that requested it.

7. For production email delivery, configure custom SMTP under **Authentication > Emails**. The
   built-in sender is rate limited and intended for testing.

### Create the first super administrator

Roles can only be granted by administrators, so the first super administrator is created
out-of-band. Sign up through the app, confirm your email, then run this in the Supabase SQL editor
(or `psql` against the local stack) with your email address:

```sql
insert into public.user_roles (user_id, role)
select id, 'super_administrator' from auth.users where email = 'you@example.org';
```

From then on, manage roles in the app at **Administration > Users**. The database guarantees there
is always at least one super administrator.

## Environment variables

See [.env.example](.env.example) for the annotated list.

| Variable                               | Required      | Purpose                                                                                                            |
| -------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`                 | Production    | Canonical URL for auth email links and metadata. Falls back to Vercel's system URLs, then `http://localhost:3000`. |
| `NEXT_PUBLIC_SUPABASE_URL`             | For auth/data | Supabase project URL. Leave blank for safe local mode.                                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | For auth/data | Supabase publishable key (`sb_publishable_...`). Safe to expose; RLS protects data.                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`        | No            | Legacy fallback for projects still using the JWT anon key.                                                         |

No secret keys are needed yet. Never put a secret (service role) key in a `NEXT_PUBLIC_` variable.

## Scripts

| Command                 | What it does                                                        |
| ----------------------- | ------------------------------------------------------------------- |
| `npm run dev`           | Start the development server                                        |
| `npm run build`         | Production build                                                    |
| `npm run start`         | Serve the production build                                          |
| `npm run check`         | Typecheck, lint, format check and unit tests in one go              |
| `npm run typecheck`     | Generate route types and run the TypeScript compiler                |
| `npm run lint`          | ESLint                                                              |
| `npm run format`        | Format with Prettier (including Tailwind class sorting)             |
| `npm test`              | Unit tests (Vitest)                                                 |
| `npm run test:e2e`      | Browser smoke tests (Playwright, builds the app in safe local mode) |
| `npm run db:start`      | Start the local Supabase stack                                      |
| `npm run db:stop`       | Stop the local stack                                                |
| `npm run db:reset`      | Rebuild the local database from migrations and `seed.sql`           |
| `npm run db:new <name>` | Create a new migration file                                         |
| `npm run db:test`       | Run the pgTAP database and RLS tests (`supabase test db`)           |
| `npm run db:types`      | Regenerate `src/types/database.types.ts` from the local database    |
| `npm run db:push`       | Apply migrations to the linked hosted project                       |

## Testing

```bash
npm run check
```

```bash
npm run db:test
```

```bash
npm run test:e2e
```

- **Unit tests** cover roles and permissions, validation schemas, redirect safety, environment
  parsing and route coverage of every navigation link.
- **Database tests** (`supabase/tests/database`) act as real `anon` and `authenticated` users to
  prove Row Level Security, role management rules and triggers.
- **Browser smoke tests** check every page, navigation, route protection and safe local mode on
  desktop and mobile. Install the browser once with `npx playwright install chromium`.
- **Full-stack journey** (optional): with the local stack running, this registers a user, confirms
  the email via Mailpit, edits the profile, manages roles and resets the password:

  ```bash
  E2E_FULL_STACK=1 E2E_SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY from npx supabase status -o env> npm run test:e2e
  ```

## Deploying to Vercel

1. Import the repository in Vercel (framework preset: Next.js, Node.js 22).
2. Add `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   for Production (and Preview, pointing at a non-production Supabase project).
3. Make sure the hosted database has the latest migrations (`npm run db:push`) before deploying
   code that depends on them.
4. Add your production domain to Supabase **Authentication > URL Configuration**.

Public pages are prerendered into static shells and served from the CDN; only session-specific
parts (the account menu, dashboard and administration) render per request.

## Project structure

```text
src/
  app/            Routes: (site) public pages, (auth) sign-in flows, dashboard, admin, api, auth
  components/     ui (shadcn primitives), layout, marketing, auth, dashboard, admin, forms, shared
  config/         Site metadata and navigation
  content/        Clearly labelled placeholder content (not platform data)
  lib/            Isomorphic code: env, Supabase clients, RBAC, Zod validations, utilities
  server/         Server-only code: auth guards, Server Actions, data access
  types/          Generated database types
supabase/
  migrations/     Ordered SQL migrations (schema, RLS, reference data)
  tests/database/ pgTAP tests for security and behaviour
  templates/      Auth email templates
e2e/              Playwright tests
docs/             Architecture, database, auth and design system guides
```

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): structure, rendering model and conventions
- [docs/DATABASE.md](docs/DATABASE.md): schema, Row Level Security and migration workflow
- [docs/AUTH_AND_ROLES.md](docs/AUTH_AND_ROLES.md): authentication flows, roles and permissions
- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md): tokens, components and accessibility
- [BUILD_PROGRESS.md](BUILD_PROGRESS.md): completed work and outstanding tasks

The living design system is available at `/design-system` when the app is running.
