import { CircleAlertIcon } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { can } from "@/lib/rbac/permissions";
import { ROLE_LABELS } from "@/lib/rbac/roles";
import { requireUser } from "@/server/auth/guards";

/**
 * Signed-in member area. Authentication is resolved before anything renders
 * (`instant = false` lets this segment block on the session instead of
 * streaming a shell). Each page re-checks: layouts and pages render in
 * parallel, so a layout check alone never protects page data.
 */
export const instant = false;

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser("/dashboard");

  return (
    <AppShell
      variant="dashboard"
      label="Dashboard"
      user={{
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        roleLabel: ROLE_LABELS[user.role],
      }}
      switchLink={
        can(user.role, "admin:access") ? { href: "/admin", label: "Administration" } : undefined
      }
    >
      {user.status !== "active" ? (
        <Alert variant="warning">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Your account is not active</AlertTitle>
          <AlertDescription>
            <p>
              You can still sign in and view your account, but participation features are paused.
              Please contact the ChristianTooling team if you think this is a mistake.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}
      {children}
    </AppShell>
  );
}
