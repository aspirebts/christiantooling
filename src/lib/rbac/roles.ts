/**
 * Role hierarchy. MUST match public.roles in the database
 * (supabase/migrations/20261118100100_identity_and_access.sql); the pgTAP suite
 * asserts the database side and src/lib/rbac/roles.test.ts asserts this side.
 *
 * A higher rank includes every lower rank. `visitor` and `registered_user` are
 * implicit (never stored): signed-out people are visitors, and every signed-in
 * member with an active account is at least a registered user.
 */
export const ROLES = [
  "visitor",
  "registered_user",
  "contributor",
  "administrator",
  "super_administrator",
] as const;

export type Role = (typeof ROLES)[number];

/** Roles that can be granted and stored in public.user_roles. */
export const ASSIGNABLE_ROLES = ["contributor", "administrator", "super_administrator"] as const;

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const ROLE_RANK: Readonly<Record<Role, number>> = {
  visitor: 0,
  registered_user: 10,
  contributor: 20,
  administrator: 30,
  super_administrator: 40,
};

export const ROLE_LABELS: Readonly<Record<Role, string>> = {
  visitor: "Visitor",
  registered_user: "Registered User",
  contributor: "Contributor",
  administrator: "Administrator",
  super_administrator: "Super Administrator",
};

export const ROLE_DESCRIPTIONS: Readonly<Record<Role, string>> = {
  visitor: "Can browse public content.",
  registered_user: "Can participate in platform activities.",
  contributor: "Can maintain a volunteer profile and apply to projects.",
  administrator: "Can manage submissions, users and projects.",
  super_administrator: "Has full platform access.",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isAssignableRole(value: unknown): value is AssignableRole {
  return typeof value === "string" && (ASSIGNABLE_ROLES as readonly string[]).includes(value);
}

/** True when `role` is `minimum` or ranks above it. */
export function hasMinRole(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

type EffectiveRoleInput = {
  isAuthenticated: boolean;
  /** False for suspended or deactivated accounts. */
  isActive: boolean;
  /** Raw role keys from public.user_roles; unknown values are ignored. */
  grantedRoles: readonly string[];
};

/**
 * Highest role a user effectively holds. Mirrors private.effective_role_rank():
 * suspended or deactivated accounts are treated as visitors.
 */
export function resolveEffectiveRole({
  isAuthenticated,
  isActive,
  grantedRoles,
}: EffectiveRoleInput): Role {
  if (!isAuthenticated || !isActive) return "visitor";

  return grantedRoles
    .filter(isAssignableRole)
    .reduce<Role>(
      (highest, role) => (ROLE_RANK[role] > ROLE_RANK[highest] ? role : highest),
      "registered_user",
    );
}

/**
 * Whether `actor` may grant or revoke `target`. Mirrors private.can_manage_role():
 * super administrators manage every role; administrators manage roles ranked
 * below their own (contributor).
 */
export function canManageRole(actor: Role, target: AssignableRole): boolean {
  if (actor === "super_administrator") return true;
  if (actor === "administrator") return ROLE_RANK[target] < ROLE_RANK[actor];
  return false;
}
