import "server-only";

import { notFound, redirect } from "next/navigation";

import { actionError, type ActionResult } from "@/lib/action-result";
import { can, type Permission } from "@/lib/rbac/permissions";
import { hasMinRole, type Role } from "@/lib/rbac/roles";

import { getCurrentUser, type SessionUser } from "./session";

/**
 * Server-side authorization guards.
 *
 * Call these in every protected layout AND page (layouts and pages render in
 * parallel, so a layout check alone does not protect a page's data), in data
 * access functions, and in Server Actions. Postgres RLS is the final safety net.
 */

function loginUrl(returnTo?: string) {
  return returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login";
}

/** Requires a signed-in user; otherwise redirects to /login. */
export async function requireUser(returnTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(returnTo));
  return user;
}

/**
 * Requires a permission. Signed-out visitors are sent to /login; signed-in
 * users without the permission get a 404 so restricted areas are not revealed.
 */
export async function requirePermission(
  permission: Permission,
  returnTo?: string,
): Promise<SessionUser> {
  const user = await requireUser(returnTo);
  if (!can(user.role, permission)) notFound();
  return user;
}

/** Requires a minimum role. Prefer requirePermission for feature checks. */
export async function requireRole(minimum: Role, returnTo?: string): Promise<SessionUser> {
  const user = await requireUser(returnTo);
  if (!hasMinRole(user.role, minimum)) notFound();
  return user;
}

type ActionAuthorization =
  { ok: true; user: SessionUser } | { ok: false; result: ActionResult<never> };

/**
 * Authorization for Server Actions, which must return results rather than
 * redirect. Every action calls this first: never rely on the UI hiding a button.
 */
export async function authorizeAction(permission: Permission): Promise<ActionAuthorization> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, result: actionError("Please sign in to continue.") };
  }
  if (user.status !== "active") {
    return {
      ok: false,
      result: actionError("Your account is not active. Please contact support."),
    };
  }
  if (!can(user.role, permission)) {
    return { ok: false, result: actionError("You do not have permission to do that.") };
  }
  return { ok: true, user };
}
