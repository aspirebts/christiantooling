# Build progress

_Last updated: 18 November 2026_

## Phase 1: Technical foundation (complete)

### Completed

**Project setup**

- Next.js 16.4 (App Router, Cache Components, Partial Prefetching, Turbopack), React 19, TypeScript
  strict, Tailwind CSS 4, shadcn/ui on `radix-ui`, Supabase (`@supabase/ssr`), Zod 4, React Hook
  Form, Lucide.
- Exact dependency versions (`.npmrc` `save-exact`) with a committed lockfile. Production
  dependencies have 0 known vulnerabilities.
- ESLint (Next.js config plus project rules), Prettier with Tailwind class sorting, Vitest,
  Playwright, GitHub Actions CI (verify, browser smoke tests, database tests).
- Security headers (frame, content-type, referrer, permissions and HSTS policies).

**Database (Supabase PostgreSQL 17)**

- 9 ordered migrations creating 31 tables across identity, directory, ideas, volunteers and
  projects, donations, communications and content, plus storage buckets and reference data.
- Row Level Security on every table (107 policies), least-privilege grants with column-level
  limits, `SECURITY DEFINER` helpers confined to an unexposed `private` schema, indexed foreign
  keys, workflow triggers (counters, audit log, moderation guards, last super administrator
  safeguard).
- Reference data: 15 practice categories, 12 technology types, 20 skills (managed data, not code).
- Generated TypeScript types (`src/types/database.types.ts`).

**Authentication and roles**

- Registration with email confirmation, sign-in, sign-out, forgot and reset password, change
  password, profile and preference management.
- Branded email templates using cross-device `token_hash` links; PKCE `code` links also supported.
- Five roles (Visitor, Registered User, Contributor, Administrator, Super Administrator) with a
  permission matrix, enforced in the proxy, server guards, Server Actions and RLS.
- Role management UI (grant, revoke, suspend, reactivate) with every change audited.
- Safe local mode: without credentials the site runs and auth is disabled with a clear notice.

**Design system and pages**

- Navy, ember and sand palette in OKLCH with verified WCAG AA contrast; Geist and Instrument Serif
  typography; spacing and layout primitives; buttons, inputs, forms, cards, badges, alerts, modal
  dialogs, sheets, menus, tables; living style guide at `/design-system`.
- Public pages: Home, Explore Tools, Ideas, Help Build, Our Tools, About, Donate.
- Auth pages: Login, Register, Forgot password, Reset password, email confirmation route.
- Dashboard: Overview, Profile, Settings.
- Administration: Overview (live counts), Users (role management), Categories (live data),
  Settings (roles and permission matrix), and planned-module pages for Tools, Ideas, Volunteers,
  Projects, Donations and Content.
- 404 page, error boundary, sitemap, robots rules, health endpoint (`/api/health`).

### Verification

| Check                                                                | Result                                                                     |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `npm run typecheck`                                                  | Pass                                                                       |
| `npm run lint`                                                       | Pass (0 problems)                                                          |
| `npm run format:check`                                               | Pass                                                                       |
| `npm test` (Vitest)                                                  | 81 / 81 passed                                                             |
| `npm run build`                                                      | Pass (safe local mode and connected mode)                                  |
| `npm run test:e2e` (Playwright smoke, desktop and mobile)            | 36 passed, 2 skipped by design (one desktop-only and one mobile-only test) |
| `npm run db:test` (pgTAP, real Supabase local stack)                 | 80 / 80 passed                                                             |
| Same pgTAP suite on plain PostgreSQL 16                              | 80 / 80 passed                                                             |
| `npx supabase db lint`                                               | No errors                                                                  |
| `npx supabase db advisors` (security and performance)                | 0 findings                                                                 |
| Full-stack journey (`E2E_FULL_STACK=1`, real Supabase Auth, Mailpit) | 5 / 5 passed                                                               |

The full-stack journey covers: sign-up, the confirmation email and link, profile and preference
updates (checked in the database), sign-out, route protection, the hidden admin area for members,
role granting by a super administrator (checked in the database and audit log), and the complete
password reset.

## Outstanding tasks and known issues

**Before launch**

1. **Connect production Supabase.** Create the project, run `npm run db:push`, set Vercel
   environment variables, configure Auth URLs, email templates and password policy, and create
   the first super administrator (see README).
2. **Production email.** Configure custom SMTP; Supabase's built-in sender is for testing only.
3. **Abuse protection.** Enable CAPTCHA (Turnstile or hCaptcha) for sign-up and password reset.
4. **Content Security Policy.** Add a nonce-based CSP; the other security headers are in place.
5. **Ministry content.** Statement of faith (About page shows "content pending"), privacy policy
   and terms (the `site_pages` table is ready), contact details, and a professionally designed
   logo (the current mark is a placeholder).
6. **Commit and publish this repository.** The code currently exists only in this workspace.

**Product gaps (designed in the schema, not yet built)**

- Avatar uploads (bucket and policies exist; the profile form takes no image yet).
- Member list shows names, not emails. Showing emails to administrators needs a secure
  admin-only RPC or service-role query; decide on the privacy policy first.
- The member list shows the 50 most recent matches; pagination comes with phase 2.
- Self-service account deletion and data export.
- Dark theme (tokens defined; no toggle yet) and translations (locale stored; no i18n yet).

**Technical notes**

- `npm audit` reports 14 high-severity advisories in development-only tooling (a `picomatch`
  ReDoS reached through ESLint dependencies). They do not ship to production; update when upstream
  releases fixes.
- The full-stack journey creates users in the local database; reset it with `npm run db:reset`.
- `src/lib/supabase/client.ts` (browser client) is ready for client-side uploads and realtime
  features but is not used yet.

## Next phase: tool directory and submission system

1. **Public directory**: `/tools` listing with full-text search (`tools.search_vector`), filters
   (practice, technology type, pricing, open source), pagination, and `/tools/[slug]` detail pages
   prerendered with cache tags. Replace the sample cards on the homepage and Our Tools page with
   real queries.
2. **Submission flow**: `/tools/submit` form for members (Zod plus `tool_submissions` RLS),
   "My submissions" in the dashboard with status and withdraw.
3. **Review queue**: `/admin/tools` to approve (create or link a tool, choose categories, upload a
   logo to `tool-logos`), reject with notes or mark duplicates; notify submitters; audit actions.
4. **Taxonomy management**: create, edit, reorder and hide practice categories and technology
   types, calling `updateTag` so public pages refresh immediately.
5. **Tests**: pgTAP for any new policies or functions; Playwright journey from submission to
   approval to public listing.
