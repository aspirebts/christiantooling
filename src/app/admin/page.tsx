import type { Metadata } from "next";
import Link from "next/link";
import {
  FolderKanbanIcon,
  HandHelpingIcon,
  InboxIcon,
  LightbulbIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react";

import { StatCard } from "@/components/admin/stat-card";
import { AppPageHeader } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminNav } from "@/config/navigation";
import { can } from "@/lib/rbac/permissions";
import { requirePermission } from "@/server/auth/guards";
import { getAdminOverviewStats } from "@/server/db/admin";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false },
};

export default async function AdminOverviewPage() {
  const user = await requirePermission("admin:access", "/admin");
  const stats = await getAdminOverviewStats();

  const sections = adminNav.filter(
    (item) => item.href !== "/admin" && (!item.permission || can(user.role, item.permission)),
  );

  return (
    <>
      <AppPageHeader
        title="Overview"
        description="Live counts from the database. Management tools arrive module by module."
      />

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Members" value={stats.members} icon={UsersIcon} href="/admin/users" />
        <StatCard
          label="Published tools"
          value={stats.publishedTools}
          icon={WrenchIcon}
          href="/admin/tools"
        />
        <StatCard
          label="Submissions awaiting review"
          value={stats.pendingSubmissions}
          icon={InboxIcon}
          href="/admin/tools"
        />
        <StatCard
          label="Ideas awaiting review"
          value={stats.ideasAwaitingReview}
          icon={LightbulbIcon}
          href="/admin/ideas"
        />
        <StatCard
          label="Contributors"
          value={stats.contributors}
          icon={HandHelpingIcon}
          href="/admin/volunteers"
        />
        <StatCard
          label="Active projects"
          value={stats.activeProjects}
          icon={FolderKanbanIcon}
          href="/admin/projects"
          hint="Recruiting or in progress"
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Administration areas</CardTitle>
          <CardDescription>Sections available to your role.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <Icon className="size-4 text-highlight" aria-hidden="true" />
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
