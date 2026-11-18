import type { Metadata } from "next";

import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { AppPageHeader } from "@/components/layout/app-shell";
import { requirePermission } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Tools",
  robots: { index: false },
};

export default async function AdminToolsPage() {
  await requirePermission("tools:manage", "/admin/tools");

  return (
    <>
      <AppPageHeader title="Tools" description="Directory listings and community submissions." />
      <AdminPlaceholder
        phase="phase 2"
        summary="The complete directory and submission system is the next development phase."
        capabilities={[
          "Review queue for community tool submissions with approve, reject and duplicate actions",
          "Create and edit directory listings with categories, technology types and logos",
          "Feature tools and mark tools built by ChristianTooling",
          "Search and filter the directory with Postgres full-text search",
        ]}
        tables={[
          "tools",
          "tool_submissions",
          "tool_categories",
          "tool_technology_types",
          "technology_types",
        ]}
      />
    </>
  );
}
