import "server-only";

import { cache } from "react";
import { connection } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import {
  isAssignableRole,
  resolveEffectiveRole,
  type AssignableRole,
  type Role,
} from "@/lib/rbac/roles";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database.types";

export type ProfileStatus = Enums<"profile_status">;

/** The signed-in user as the app sees them. Safe to pass to Client Components. */
export type SessionUser = {
  id: string;
  email: string | null;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  /** null when the profile could not be loaded (treated as inactive). */
  status: ProfileStatus | null;
  /** Highest effective role (suspended accounts resolve to "visitor"). */
  role: Role;
  /** Elevated roles stored in public.user_roles. */
  grantedRoles: AssignableRole[];
};

/**
 * Returns the verified signed-in user, or null.
 *
 * Identity comes from supabase.auth.getClaims(), which validates the JWT
 * signature (never trust getSession() on the server). Profile and roles are
 * read through RLS as that user. Memoised per request with React cache().
 *
 * Fails closed: if roles or the profile cannot be loaded, the user keeps only
 * the minimum rights of their verified identity.
 *
 * Call it only inside a <Suspense> boundary or a segment with
 * `export const instant = false` (it reads cookies and opts into request time).
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured()) return null;

  // Session state is request-time only. Token validation compares expiry with
  // the current time, which Cache Components forbids during (runtime)
  // prerendering, and authorization data must never be prerendered or reused.
  await connection();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;

  const { claims } = data;
  const userId = claims.sub;
  const email = typeof claims.email === "string" && claims.email !== "" ? claims.email : null;

  const [profileResult, rolesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, username, avatar_url, status")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  if (profileResult.error) {
    console.error("[auth] Could not load profile", {
      code: profileResult.error.code,
      message: profileResult.error.message,
    });
  }
  if (rolesResult.error) {
    console.error("[auth] Could not load roles", {
      code: rolesResult.error.code,
      message: rolesResult.error.message,
    });
  }

  const profile = profileResult.data;
  const grantedRoles = (rolesResult.data ?? []).map((row) => row.role).filter(isAssignableRole);
  const status = profile?.status ?? null;

  return {
    id: userId,
    email,
    displayName: profile?.display_name || email?.split("@")[0] || "Member",
    username: profile?.username ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    status,
    role: resolveEffectiveRole({
      isAuthenticated: true,
      isActive: status === "active",
      grantedRoles,
    }),
    grantedRoles,
  };
});
