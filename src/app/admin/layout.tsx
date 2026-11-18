import { AppShell } from "@/components/layout/app-shell";
import { ROLE_LABELS } from "@/lib/rbac/roles";
import { requirePermission } from "@/server/auth/guards";

/**
 * Administration area: administrators and super administrators only.
 * Visitors are sent to /login; signed-in members without access get a 404 so
 * the area is not revealed. Every page and action re-checks its own permission,
 * and RLS enforces the same rules in Postgres.
 */
export const instant = false;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requirePermission("admin:access", "/admin");

  return (
    <AppShell
      variant="admin"
      label="Administration"
      user={{
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        roleLabel: ROLE_LABELS[user.role],
      }}
      switchLink={{ href: "/dashboard", label: "Back to dashboard" }}
    >
      {children}
    </AppShell>
  );
}
