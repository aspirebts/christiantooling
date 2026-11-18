import type { Metadata } from "next";

import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { AppPageHeader } from "@/components/layout/app-shell";
import { requirePermission } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Ideas",
  robots: { index: false },
};

export default async function AdminIdeasPage() {
  await requirePermission("ideas:moderate", "/admin/ideas");

  return (
    <>
      <AppPageHeader title="Ideas" description="Moderate proposals for tools that should exist." />
      <AdminPlaceholder
        phase="phase 3"
        summary="Idea submission, voting and moderation build on the schema already in place."
        capabilities={[
          "Moderation queue for ideas awaiting review",
          "Publish, decline or archive ideas with review notes",
          "Moderate comments and resolve reports",
          "Promote approved ideas into projects",
        ]}
        tables={["ideas", "idea_categories", "idea_votes", "idea_comments"]}
      />
    </>
  );
}
