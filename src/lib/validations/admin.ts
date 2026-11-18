import { z } from "zod";

import { ASSIGNABLE_ROLES } from "@/lib/rbac/roles";

export const roleChangeSchema = z.object({
  userId: z.uuid("Invalid user."),
  role: z.enum(ASSIGNABLE_ROLES, "Choose a valid role."),
});

export const accountStatusSchema = z.object({
  userId: z.uuid("Invalid user."),
  status: z.enum(["active", "suspended"], "Choose a valid status."),
});

export type RoleChangeInput = z.infer<typeof roleChangeSchema>;
export type AccountStatusInput = z.infer<typeof accountStatusSchema>;

/**
 * Keeps free-text search to characters that are safe inside a PostgREST
 * filter expression (commas and parentheses would alter the filter).
 */
export function sanitizeSearchTerm(query: string | undefined): string {
  return (query ?? "")
    .replace(/[^\p{L}\p{N} _.@-]/gu, "")
    .trim()
    .slice(0, 80);
}
