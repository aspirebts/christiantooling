import { GuestActions } from "@/components/layout/site-header";
import { UserMenu } from "@/components/layout/user-menu";
import { can } from "@/lib/rbac/permissions";
import { ROLE_LABELS } from "@/lib/rbac/roles";
import { getCurrentUser } from "@/server/auth/session";

/**
 * Account area of the site header. Reads the session (cookies), so the layout
 * renders it inside <Suspense>: the rest of the page stays in the static shell.
 */
export async function HeaderAuth() {
  const user = await getCurrentUser();
  if (!user) return <GuestActions />;

  return (
    <UserMenu
      user={{
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        roleLabel: ROLE_LABELS[user.role],
        canAccessAdmin: can(user.role, "admin:access"),
      }}
    />
  );
}
