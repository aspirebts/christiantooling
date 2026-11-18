import "server-only";

import { isAssignableRole, type AssignableRole } from "@/lib/rbac/roles";
import { sanitizeSearchTerm } from "@/lib/validations/admin";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/server/auth/guards";
import type { Enums, Tables } from "@/types/database.types";

/*
 * Administrative data access. Every function checks its permission first and
 * then queries as the signed-in administrator, so RLS applies as well.
 */

export type AdminOverviewStats = {
  members: number | null;
  publishedTools: number | null;
  pendingSubmissions: number | null;
  ideasAwaitingReview: number | null;
  contributors: number | null;
  activeProjects: number | null;
};

type CountResult = { count: number | null; error: { code: string } | null };

function toCount({ count, error }: CountResult): number | null {
  if (error) {
    console.error("[admin] Count query failed", { code: error.code });
    return null;
  }
  return count ?? 0;
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  await requirePermission("admin:access", "/admin");
  const supabase = await createClient();
  const head = { count: "exact", head: true } as const;

  const [
    members,
    publishedTools,
    pendingSubmissions,
    ideasAwaitingReview,
    contributors,
    activeProjects,
  ] = await Promise.all([
    supabase.from("profiles").select("id", head),
    supabase.from("tools").select("id", head).eq("status", "published"),
    supabase.from("tool_submissions").select("id", head).in("status", ["pending", "in_review"]),
    supabase.from("ideas").select("id", head).eq("status", "pending_review"),
    supabase.from("user_roles").select("user_id", head).eq("role", "contributor"),
    supabase.from("projects").select("id", head).in("status", ["recruiting", "active"]),
  ]);

  return {
    members: toCount(members),
    publishedTools: toCount(publishedTools),
    pendingSubmissions: toCount(pendingSubmissions),
    ideasAwaitingReview: toCount(ideasAwaitingReview),
    contributors: toCount(contributors),
    activeProjects: toCount(activeProjects),
  };
}

export type MemberRow = {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  status: Enums<"profile_status">;
  createdAt: string;
  roles: AssignableRole[];
};

export async function listMembers(
  options: { search?: string; limit?: number } = {},
): Promise<MemberRow[]> {
  await requirePermission("users:view", "/admin/users");
  const supabase = await createClient();
  const search = sanitizeSearchTerm(options.search);

  let query = supabase
    .from("profiles")
    .select(
      "id, display_name, username, avatar_url, status, created_at, user_roles!user_roles_user_id_fkey(role)",
    )
    .order("created_at", { ascending: false })
    .limit(Math.min(options.limit ?? 50, 100));

  if (search) {
    query = query.or(`display_name.ilike.%${search}%,username.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not load members (${error.code}).`);

  return data.map((row) => ({
    id: row.id,
    displayName: row.display_name || "Unnamed member",
    username: row.username,
    avatarUrl: row.avatar_url,
    status: row.status,
    createdAt: row.created_at,
    roles: row.user_roles.map((assignment) => assignment.role).filter(isAssignableRole),
  }));
}

export type AdminCategoryRow = Pick<
  Tables<"practice_categories">,
  "id" | "slug" | "name" | "description" | "icon" | "sort_order" | "is_active"
>;

export async function listPracticeCategoriesForAdmin(): Promise<AdminCategoryRow[]> {
  await requirePermission("categories:manage", "/admin/categories");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("practice_categories")
    .select("id, slug, name, description, icon, sort_order, is_active")
    .order("sort_order")
    .order("name");

  if (error) throw new Error(`Could not load categories (${error.code}).`);
  return data;
}
