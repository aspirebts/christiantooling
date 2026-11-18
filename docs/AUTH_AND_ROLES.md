# Authentication, roles and permissions

## Authentication

Supabase Auth with email and password. Sessions are stored in cookies by `@supabase/ssr`.

| Flow                    | Entry point                                                        | Implementation                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Register                | `/register`                                                        | `signUp` action. Display name stored in user metadata (never used for authorisation). A profile and preferences row are created by the `on_auth_user_created` trigger. |
| Email verification      | Email link to `/auth/confirm`                                      | Required before sign-in. `verifyOtp` with `token_hash` (cross-device) or `exchangeCodeForSession` with `code` (PKCE).                                                  |
| Sign in                 | `/login?next=/path`                                                | `signIn` action; `next` is validated by `safeRedirectPath` to prevent open redirects.                                                                                  |
| Sign out                | User menu, dashboard and admin sidebars                            | `signOut` action (works without JavaScript in the sidebars).                                                                                                           |
| Forgot password         | `/forgot-password`                                                 | `requestPasswordReset` always reports success (no account enumeration).                                                                                                |
| Reset password          | Email link to `/auth/confirm?type=recovery` then `/reset-password` | Recovery session; `updatePassword` action.                                                                                                                             |
| Change password         | `/dashboard/settings`                                              | `changePassword` re-verifies the current password first.                                                                                                               |
| Profile and preferences | `/dashboard/profile`, `/dashboard/settings`                        | `updateProfile` and `updatePreferences` actions, validated by Zod and constrained by RLS.                                                                              |

Security notes:

- Identity on the server comes from `supabase.auth.getClaims()`, which validates the JWT. The app
  never trusts `getSession()` on the server.
- Auth email links are built from configured URLs, never from request headers (prevents
  password-reset poisoning through a spoofed `Host` header).
- Sign-in errors use one generic message; signup and password reset never reveal whether an email
  is registered.
- The confirm route marks responses `Cache-Control: private, no-store`, and the proxy forwards
  Supabase's cache headers so session cookies are never cached by a CDN.
- Supabase Auth rate limits apply. Add CAPTCHA (Turnstile or hCaptcha) before public launch.

## Roles

Roles are hierarchical: each role includes every permission of the roles below it.

| Role                | Rank | How someone gets it                                  | Can                                                                                   |
| ------------------- | ---- | ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Visitor             | 0    | Signed out (or suspended)                            | Browse public content                                                                 |
| Registered User     | 10   | Signed in with an active account (implicit)          | Participate: submit tools and ideas, vote, comment, apply to volunteer                |
| Contributor         | 20   | Granted by an administrator                          | Maintain a public volunteer profile, apply to projects                                |
| Administrator       | 30   | Granted by a super administrator                     | Manage submissions, users (below their rank) and projects; grant the contributor role |
| Super Administrator | 40   | Granted by a super administrator (first one via SQL) | Everything, including granting administrator roles and platform settings              |

`visitor` and `registered_user` are implicit and never stored. Elevated roles live in
`public.user_roles`. A suspended or deactivated account is treated as a visitor everywhere,
including in RLS.

The ranks are defined twice and tested on both sides: in `public.roles` (asserted by
`supabase/tests/database/00_schema_security.test.sql`) and in `src/lib/rbac/roles.ts` (asserted by
`roles.test.ts`).

## Permissions

Application code checks permissions, never raw roles: `can(user.role, "tools:submit")`. The
matrix lives in `src/lib/rbac/permissions.ts` and is visible to super administrators at
**Administration > Settings**.

| Permission                                                                                                                                                                                                                                          | Minimum role        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `content:browse`                                                                                                                                                                                                                                    | Visitor             |
| `profile:manage`, `tools:submit`, `ideas:submit`, `ideas:vote`, `ideas:comment`, `volunteer:apply`, `contributor-profile:manage`                                                                                                                    | Registered User     |
| `projects:apply`                                                                                                                                                                                                                                    | Contributor         |
| `admin:access`, `submissions:review`, `ideas:moderate`, `tools:manage`, `categories:manage`, `volunteers:manage`, `projects:manage`, `donations:view`, `users:view`, `users:suspend`, `roles:grant-contributor`, `content:manage`, `audit-log:view` | Administrator       |
| `roles:grant-administrator`, `settings:manage`                                                                                                                                                                                                      | Super Administrator |

Project-level roles (lead, maintainer) add scoped rights without platform roles: leads manage their
project's team, skills and applications; leads and maintainers post updates and milestones.

## Enforcement

1. **Proxy** (`src/proxy.ts`): refreshes sessions; sends signed-out visitors from `/dashboard` and
   `/admin` to `/login?next=...`; sends signed-in users away from `/login` and `/register`.
2. **Guards** (`src/server/auth/guards.ts`):
   - `requireUser(returnTo)`: redirects to `/login` when signed out.
   - `requirePermission(permission, returnTo)`: also returns 404 when the user lacks the
     permission, so restricted areas are not revealed.
   - `requireRole(role, returnTo)`: the same, for a minimum role.
   - `authorizeAction(permission)`: for Server Actions; returns an error result instead of
     redirecting, and rejects inactive accounts.
3. **Server Actions** check permissions, validate input and refuse self-targeting changes
   (nobody can change their own roles or status).
4. **Database**: RLS, column grants and triggers enforce the same rules even if application code
   has a bug. For example, an administrator can only grant roles ranked below their own, and the
   last super administrator cannot be removed.

Role grants, revocations and status changes are written to `public.audit_logs` by triggers,
including the acting administrator.

## Adding a protected feature

1. Add a permission to `PERMISSIONS` with the minimum role.
2. Guard the page with `requirePermission` (and the layout if it is a new area).
3. Guard each Server Action with `authorizeAction`.
4. Write RLS policies and grants in a migration, plus pgTAP tests for allowed and denied cases.
5. Add the navigation item with its `permission` so it only appears for eligible users.
