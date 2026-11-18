<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## ChristianTooling project rules

Read `docs/ARCHITECTURE.md` and `docs/AUTH_AND_ROLES.md` before making changes.

- **Rendering:** Cache Components is enabled. Anything that reads cookies, headers or the session
  must sit inside `<Suspense>` or a segment with `export const instant = false`. Public data uses
  `"use cache"` with the cookie-less client in `src/lib/supabase/public.ts`.
- **Authorization:** guard every protected layout, page, data function and Server Action
  (`requirePermission` / `authorizeAction`). Never rely on the proxy or on hidden UI alone.
- **Database:** never edit an applied migration; add a new one with RLS, explicit grants, indexed
  foreign keys and pgTAP tests. Run `npm run db:test` and `npx supabase db advisors`.
- **Data:** categories, technology types and skills come from the database. Placeholder content
  belongs only in `src/content/placeholders.ts` and must be labelled as a sample in the UI.
- **Secrets:** never use the service role in request paths and never expose secrets via
  `NEXT_PUBLIC_` variables.
- **Done means:** `npm run check` and `npm run build` pass.
