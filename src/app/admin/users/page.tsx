import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon, UsersIcon } from "lucide-react";

import { RoleManager } from "@/components/admin/role-manager";
import { AppPageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLE_LABELS } from "@/lib/rbac/roles";
import { getInitials } from "@/lib/utils";
import { requirePermission } from "@/server/auth/guards";
import { listMembers } from "@/server/db/admin";

export const metadata: Metadata = {
  title: "Users",
  robots: { index: false },
};

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

const STATUS_VARIANT = {
  active: "success",
  suspended: "warning",
  deactivated: "secondary",
} as const;

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const viewer = await requirePermission("users:view", "/admin/users");
  const { q } = await searchParams;
  const search = typeof q === "string" ? q : "";
  const members = await listMembers({ search });

  return (
    <>
      <AppPageHeader
        title="Users"
        description="Members of the platform, their roles and account status. Showing the 50 most recent matches."
      />

      <form role="search" method="get" className="flex max-w-md gap-2">
        <label htmlFor="member-search" className="sr-only">
          Search members
        </label>
        <Input
          id="member-search"
          name="q"
          defaultValue={search}
          placeholder="Search by name or username"
        />
        <Button type="submit" variant="outline">
          <SearchIcon aria-hidden="true" />
          Search
        </Button>
        {search ? (
          <Button asChild variant="ghost">
            <Link href="/admin/users">Clear</Link>
          </Button>
        ) : null}
      </form>

      {members.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title={search ? "No members match your search" : "No members yet"}
          description={
            search ? "Try a different name or username." : "New sign-ups will appear here."
          }
        />
      ) : (
        <Card className="py-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Member</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="pr-5 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          {member.avatarUrl ? <AvatarImage src={member.avatarUrl} alt="" /> : null}
                          <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {member.displayName}
                          </p>
                          {member.username ? (
                            <p className="truncate text-xs text-muted-foreground">
                              @{member.username}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[member.status]} className="capitalize">
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {member.roles.length === 0 ? (
                          <span className="text-sm text-muted-foreground">
                            {ROLE_LABELS.registered_user}
                          </span>
                        ) : (
                          member.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={role === "contributor" ? "secondary" : "highlight"}
                            >
                              {ROLE_LABELS[role]}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {dateFormat.format(new Date(member.createdAt))}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <RoleManager
                        member={{
                          id: member.id,
                          displayName: member.displayName,
                          status: member.status,
                          roles: member.roles,
                        }}
                        viewerRole={viewer.role}
                        isSelf={member.id === viewer.id}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
