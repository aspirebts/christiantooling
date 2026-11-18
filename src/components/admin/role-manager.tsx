"use client";

import { useState, useTransition } from "react";
import { ShieldIcon } from "lucide-react";

import { FormFeedback } from "@/components/forms/form-feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { ActionResult } from "@/lib/action-result";
import { can } from "@/lib/rbac/permissions";
import {
  ASSIGNABLE_ROLES,
  canManageRole,
  resolveEffectiveRole,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_RANK,
  type AssignableRole,
  type Role,
} from "@/lib/rbac/roles";
import { grantRole, revokeRole, setAccountStatus } from "@/server/actions/admin";

type RoleManagerProps = {
  member: {
    id: string;
    displayName: string;
    status: "active" | "suspended" | "deactivated";
    roles: AssignableRole[];
  };
  viewerRole: Role;
  isSelf: boolean;
};

/**
 * Dialog for granting/revoking roles and suspending accounts. It only offers
 * actions the viewer is allowed to take; the server re-checks every request.
 */
export function RoleManager({ member, viewerRole, isSelf }: RoleManagerProps) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const memberRank =
    ROLE_RANK[
      resolveEffectiveRole({ isAuthenticated: true, isActive: true, grantedRoles: member.roles })
    ];
  const manageableRoles = ASSIGNABLE_ROLES.filter((role) => canManageRole(viewerRole, role));
  const canChangeStatus = can(viewerRole, "users:suspend") && memberRank < ROLE_RANK[viewerRole];

  function run(action: () => Promise<ActionResult>) {
    setResult(null);
    startTransition(async () => {
      setResult(await action());
    });
  }

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">You</span>;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setResult(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShieldIcon aria-hidden="true" />
          Manage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage {member.displayName}</DialogTitle>
          <DialogDescription>
            Changes take effect immediately and are recorded in the audit log.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <FormFeedback
            status={result.ok ? "success" : "error"}
            message={result.ok ? (result.message ?? "Done.") : result.error}
          />
        ) : null}

        <section aria-labelledby="roles-heading" className="flex flex-col gap-3">
          <h3 id="roles-heading" className="text-sm font-semibold text-ink">
            Roles
          </h3>
          {manageableRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You cannot change this member&apos;s roles.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {manageableRoles.map((role) => {
                const hasRole = member.roles.includes(role);
                return (
                  <li
                    key={role}
                    className="flex items-center justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {ROLE_LABELS[role]}
                        {hasRole ? <Badge variant="success">Granted</Badge> : null}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {ROLE_DESCRIPTIONS[role]}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant={hasRole ? "outline" : "default"}
                      disabled={isPending}
                      onClick={() =>
                        run(() =>
                          hasRole
                            ? revokeRole({ userId: member.id, role })
                            : grantRole({ userId: member.id, role }),
                        )
                      }
                    >
                      {hasRole ? "Revoke" : "Grant"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {canChangeStatus ? (
          <>
            <Separator />
            <section
              aria-labelledby="status-heading"
              className="flex items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-0.5">
                <h3 id="status-heading" className="text-sm font-semibold text-ink">
                  Account status
                </h3>
                <p className="text-xs text-muted-foreground">
                  Suspended members can sign in but cannot participate.
                </p>
              </div>
              <Button
                size="sm"
                variant={member.status === "active" ? "destructive" : "outline"}
                disabled={isPending}
                onClick={() =>
                  run(() =>
                    setAccountStatus({
                      userId: member.id,
                      status: member.status === "active" ? "suspended" : "active",
                    }),
                  )
                }
              >
                {member.status === "active" ? "Suspend" : "Reactivate"}
              </Button>
            </section>
          </>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
