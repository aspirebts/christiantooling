import type { Metadata } from "next";

import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { AppPageHeader } from "@/components/layout/app-shell";
import { requirePermission } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Projects",
  robots: { index: false },
};

export default async function AdminProjectsPage() {
  await requirePermission("projects:manage", "/admin/projects");

  return (
    <>
      <AppPageHeader title="Projects" description="Open-source projects and their teams." />
      <AdminPlaceholder
        phase="phase 4"
        summary="Project management supports leads, teams, milestones and public updates."
        capabilities={[
          "Create projects from approved ideas",
          "Assign project leads and manage teams",
          "Track milestones and publish project updates",
          "Link launched projects to directory tools",
        ]}
        tables={[
          "projects",
          "project_contributors",
          "project_skills",
          "project_milestones",
          "project_updates",
        ]}
      />
    </>
  );
}
