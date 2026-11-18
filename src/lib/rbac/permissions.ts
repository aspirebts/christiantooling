import { hasMinRole, type Role } from "./roles";

/**
 * Application permissions and the minimum role each requires.
 *
 * Application code checks permissions (`can(role, "tools:submit")`), never raw
 * roles, so access rules live in one place. These checks drive the UI and
 * server-side guards; Row Level Security in Postgres enforces the same rules
 * as the final safety net.
 */
export const PERMISSIONS = {
  // Visitors
  "content:browse": "visitor",

  // Registered users
  "profile:manage": "registered_user",
  "tools:submit": "registered_user",
  "ideas:submit": "registered_user",
  "ideas:vote": "registered_user",
  "ideas:comment": "registered_user",
  "volunteer:apply": "registered_user",
  "contributor-profile:manage": "registered_user",

  // Contributors
  "projects:apply": "contributor",

  // Administrators
  "admin:access": "administrator",
  "submissions:review": "administrator",
  "ideas:moderate": "administrator",
  "tools:manage": "administrator",
  "categories:manage": "administrator",
  "volunteers:manage": "administrator",
  "projects:manage": "administrator",
  "donations:view": "administrator",
  "users:view": "administrator",
  "users:suspend": "administrator",
  "roles:grant-contributor": "administrator",
  "content:manage": "administrator",
  "audit-log:view": "administrator",

  // Super administrators
  "roles:grant-administrator": "super_administrator",
  "settings:manage": "super_administrator",
} as const satisfies Record<string, Role>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return hasMinRole(role, PERMISSIONS[permission]);
}
