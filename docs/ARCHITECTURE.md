# Architecture

This document explains how ChristianTooling is organised and why. Read it before adding a module.

## Principles

1. **Security in depth.** Every permission is enforced on the server and again by Postgres Row
   Level Security (RLS). The UI only hides what a user cannot do.
2. **Server first.** Pages are React Server Components. Client Components are used only for
   interactivity (forms, menus, dialogs).
3. **Data in the database, not in code.** Practice categories, technology types and skills are
   managed data. Placeholder content lives in one clearly labelled file until real data replaces it.
4. **Modular growth.** Each platform module (directory, ideas, volunteers, donations, content) has
   its schema, policies and admin section in place, so features can be added without restructuring.

## Folder structure

```text
src/
├── app/                      Routes only: thin pages and layouts that compose components
│   ├── (site)/               Public site with header and footer (homepage, tools, ideas, ...)
│   │   └── _components/      Route-local server components (e.g. the header account area)
│   ├── (auth)/               Login, register, forgot/reset password (focused layout)
│   ├── auth/confirm/         Route handler that completes email links
│   ├── dashboard/            Signed-in member area
│   ├── admin/                Administration (administrators and super administrators)
│   └── api/health/           Liveness endpoint for uptime monitoring
├── components/
│   ├── ui/                   shadcn/ui primitives (design system building blocks)
│   ├── layout/               Containers, sections, header, footer, navigation, app shell
│   ├── forms/                Form helpers (submit button, feedback banner)
│   ├── auth/ dashboard/ admin/ marketing/ design-system/   Feature components
│   └── shared/               Logo, empty states, notices, icon registry
├── config/                   Site metadata and navigation (with permission requirements)
├── content/                  Placeholder content, clearly separated from platform data
├── lib/                      Isomorphic code (safe for server and client)
│   ├── supabase/             Supabase clients: browser, server, public (cached), proxy
│   ├── rbac/                 Roles and permissions (pure functions, unit tested)
│   ├── validations/          Zod schemas shared by forms and Server Actions
│   ├── env.ts                Typed environment and safe local mode
│   ├── safe-redirect.ts      Open-redirect protection
│   └── action-result.ts      Uniform Server Action results
├── server/                   Server-only code (each module imports "server-only")
│   ├── auth/                 Session (getCurrentUser) and guards (requireUser, ...)
│   ├── actions/              Server Actions grouped by area
│   └── db/                   Data access functions
├── types/                    Generated database types
└── proxy.ts                  Next.js 16 Proxy: session refresh and coarse route gating
```

### Boundaries

- `src/server/**` must never be imported by Client Components. The `server-only` package fails the
  build if it is, and an ESLint rule flags it in the editor for `src/components/**`.
- Components are presentational. Data is fetched in route files (`page.tsx`, `layout.tsx`) or in
  route-local `_components`, then passed down as props. Client Components that mutate data call
  Server Actions.
- Icons cannot be passed from Server to Client Components as props. Client navigation imports the
  navigation config directly and receives only serialisable values (such as the viewer's role).

## Rendering model (Cache Components)

The app uses Next.js 16 **Cache Components** with **Partial Prefetching**, the framework defaults:

- **Public pages** are prerendered into a static shell served from the CDN. Public reference data
  (categories, technology types, skills) is loaded with `"use cache"` through a cookie-less Supabase
  client (`src/lib/supabase/public.ts`) and revalidates hourly. Admin edits will call
  `updateTag(CACHE_TAGS.x)` for immediate refresh.
- **Session-dependent UI** (the header account menu) streams in behind `<Suspense>`.
  `getCurrentUser()` calls `connection()` so session state is always resolved at request time and
  never prerendered or reused.
- **Authenticated areas** (`/dashboard`, `/admin`) set `export const instant = false` on their
  layouts so authorisation completes before anything renders.
- Values like `new Date()` must be cached (see `CurrentYear` in the footer) or rendered at request
  time; otherwise prerendering fails.
- Navigations keep previous routes mounted (React Activity), so open menus and dialogs must close
  themselves on navigation (see `MobileNav`).

Bundled Next.js documentation lives in `node_modules/next/dist/docs/`; consult it before using
unfamiliar APIs.

## Authorisation layers

| Layer             | Where                       | Purpose                                                                                                                                                                                                             |
| ----------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Proxy          | `src/proxy.ts`              | Refreshes the session; redirects signed-out visitors away from `/dashboard` and `/admin`. UX only.                                                                                                                  |
| 2. Guards         | `src/server/auth/guards.ts` | `requireUser`, `requirePermission`, `requireRole` in every protected layout **and** page, and inside data access functions. Layouts and pages render in parallel, so a layout check alone never protects page data. |
| 3. Server Actions | `src/server/actions/*`      | `authorizeAction(permission)` first, then Zod validation. Never trust that the UI hid a button.                                                                                                                     |
| 4. Database       | `supabase/migrations/*`     | RLS on every table, least-privilege column grants, and triggers guarding sensitive columns.                                                                                                                         |

See [AUTH_AND_ROLES.md](AUTH_AND_ROLES.md) for details.

## Data access

- Read data through functions in `src/server/db/`. Each function performs its own authorisation
  check and queries as the signed-in user, so RLS applies.
- Functions for "my" data derive the user from the session and take no user id parameter, so a
  caller can never request someone else's data.
- Unexpected database errors throw (caught by error boundaries). Cached functions never cache
  failures.
- Never use the service role in application code paths. It bypasses RLS and is reserved for future
  trusted jobs such as payment webhooks.

## Server Actions

- Live in `src/server/actions/`, one file per area, with `"use server"` at the top.
- Return `ActionResult` (`{ ok: true, message } | { ok: false, error, fieldErrors }`) for expected
  failures; redirect only on success flows such as sign-in.
- Validate input with the same Zod schema the form uses.
- Call `refresh()` (or `updateTag`) after mutations that change what is on screen.

## Coding conventions

- TypeScript strict mode; no `any`. Prefer `type` imports (`import { type X }`).
- File names in kebab-case; React components in PascalCase; one main component per file.
- Server Components by default; add `"use client"` only for interactivity.
- Use semantic design tokens (`bg-primary`, `text-muted-foreground`) in components; brand scales
  (`navy`, `ember`, `sand`) for marketing accents. See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
- Accessibility is part of done: labelled controls, visible focus, sufficient contrast and keyboard
  support.
- Formatting is automatic (`npm run format`); `npm run check` must pass before merging.
- Database changes always go through a new migration plus pgTAP coverage for new policies.

## Decisions and rationale

| Decision                                    | Rationale                                                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Keep Cache Components (framework default)   | Static shells for public pages give speed and low hosting cost; sessions stream in.             |
| Supabase publishable key + `getClaims()`    | Current Supabase guidance; `getClaims()` verifies the JWT rather than trusting cookies.         |
| `token_hash` email links                    | Work across devices and browsers, unlike PKCE-only links.                                       |
| Hierarchical roles with ranks               | Matches the five required roles; one rank comparison serves both app and RLS.                   |
| Permissions defined in code                 | One readable matrix (`src/lib/rbac/permissions.ts`); RLS enforces the same rules at role level. |
| UUIDv7 primary keys                         | Time-ordered (index-friendly) yet non-sequential for public URLs.                               |
| Enums for workflow states                   | Generated TypeScript unions catch mistakes; values can be added in migrations.                  |
| Reference data in migrations                | Production receives categories via `db push`; `seed.sql` only runs locally.                     |
| Explicit GRANTs on every table              | Works whether or not a project auto-exposes new tables, and limits columns users can write.     |
| No email column on profiles                 | Avoids duplicating and leaking auth data; emails stay in `auth.users`.                          |
| shadcn/ui on the unified `radix-ui` package | Owned, editable components with accessible primitives and a single dependency.                  |
