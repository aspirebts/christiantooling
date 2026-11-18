import type { Metadata } from "next";
import { CheckIcon, MinusIcon } from "lucide-react";

import { AppPageHeader } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { can, PERMISSIONS, type Permission } from "@/lib/rbac/permissions";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLES } from "@/lib/rbac/roles";
import { requirePermission } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false },
};

const permissionKeys = Object.keys(PERMISSIONS) as Permission[];

export default async function AdminSettingsPage() {
  await requirePermission("settings:manage", "/admin/settings");

  return (
    <>
      <AppPageHeader
        title="Settings"
        description="Platform configuration for super administrators. Roles and permissions are defined in code and enforced again by database policies."
      />

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>
            Each role includes every permission of the roles below it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-3">
            {ROLES.map((role) => (
              <li
                key={role}
                className="flex flex-col gap-0.5 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-4"
              >
                <span className="w-48 shrink-0 text-sm font-medium text-ink">
                  {ROLE_LABELS[role]}
                </span>
                <span className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="pb-0">
        <CardHeader>
          <CardTitle>Permission matrix</CardTitle>
          <CardDescription>Source: src/lib/rbac/permissions.ts</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Permission</TableHead>
                {ROLES.map((role) => (
                  <TableHead key={role} className="text-center">
                    {ROLE_LABELS[role]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissionKeys.map((permission) => (
                <TableRow key={permission}>
                  <TableCell className="pl-6">
                    <code className="font-mono text-xs">{permission}</code>
                  </TableCell>
                  {ROLES.map((role) => (
                    <TableCell key={role} className="text-center">
                      {can(role, permission) ? (
                        <CheckIcon className="mx-auto size-4 text-success" aria-label="Allowed" />
                      ) : (
                        <MinusIcon className="mx-auto size-4 text-steel" aria-label="Not allowed" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
