"use server";

import { refresh } from "next/cache";

import {
  actionError,
  actionSuccess,
  validationError,
  type ActionResult,
} from "@/lib/action-result";
import { canManageRole, ROLE_LABELS } from "@/lib/rbac/roles";
import { createClient } from "@/lib/supabase/server";
import {
  accountStatusSchema,
  roleChangeSchema,
  type AccountStatusInput,
  type RoleChangeInput,
} from "@/lib/validations/admin";
import { authorizeAction } from "@/server/auth/guards";

/*
 * Administrative user management. Each action re-checks permissions here, and
 * Postgres enforces the same rules (RLS on user_roles, the profile guard
 * trigger, and the last-super-administrator safeguard). Every change is
 * written to public.audit_logs by database triggers.
 */

export async function grantRole(input: RoleChangeInput): Promise<ActionResult> {
  const parsed = roleChangeSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const { userId, role } = parsed.data;

  const auth = await authorizeAction(
    role === "contributor" ? "roles:grant-contributor" : "roles:grant-administrator",
  );
  if (!auth.ok) return auth.result;
  if (userId === auth.user.id) return actionError("You cannot change your own roles.");
  if (!canManageRole(auth.user.role, role)) {
    return actionError("You do not have permission to grant that role.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role, granted_by: auth.user.id });

  if (error) {
    if (error.code === "23505")
      return actionSuccess(`This member is already a ${ROLE_LABELS[role]}.`);
    if (error.code === "23503") return actionError("That member no longer exists.");
    console.error("[admin] Grant role failed", { code: error.code });
    return actionError("The role could not be granted.");
  }

  refresh();
  return actionSuccess(`${ROLE_LABELS[role]} role granted.`);
}

export async function revokeRole(input: RoleChangeInput): Promise<ActionResult> {
  const parsed = roleChangeSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const { userId, role } = parsed.data;

  const auth = await authorizeAction(
    role === "contributor" ? "roles:grant-contributor" : "roles:grant-administrator",
  );
  if (!auth.ok) return auth.result;
  if (userId === auth.user.id) return actionError("You cannot change your own roles.");
  if (!canManageRole(auth.user.role, role)) {
    return actionError("You do not have permission to revoke that role.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role)
    .select("role");

  if (error) {
    if (error.code === "23514") {
      return actionError("The platform must always keep at least one super administrator.");
    }
    console.error("[admin] Revoke role failed", { code: error.code });
    return actionError("The role could not be revoked.");
  }
  if (!data || data.length === 0) return actionError("This member does not have that role.");

  refresh();
  return actionSuccess(`${ROLE_LABELS[role]} role revoked.`);
}

export async function setAccountStatus(input: AccountStatusInput): Promise<ActionResult> {
  const parsed = accountStatusSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const { userId, status } = parsed.data;

  const auth = await authorizeAction("users:suspend");
  if (!auth.ok) return auth.result;
  if (userId === auth.user.id) return actionError("You cannot change your own account status.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", userId)
    .select("id");

  if (error) {
    if (error.code === "42501") {
      return actionError("You can only change the status of members ranked below you.");
    }
    console.error("[admin] Status change failed", { code: error.code });
    return actionError("The account status could not be changed.");
  }
  if (!data || data.length === 0) return actionError("That member could not be found.");

  refresh();
  return actionSuccess(status === "suspended" ? "Account suspended." : "Account reactivated.");
}
