import type { Metadata } from "next";

import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { AppPageHeader } from "@/components/layout/app-shell";
import { requirePermission } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Volunteers",
  robots: { index: false },
};

export default async function AdminVolunteersPage() {
  await requirePermission("volunteers:manage", "/admin/volunteers");

  return (
    <>
      <AppPageHeader
        title="Volunteers"
        description="Contributors, skills and volunteer applications."
      />
      <AdminPlaceholder
        phase="phase 4"
        summary="Volunteer onboarding connects approved ideas with the people who can build them."
        capabilities={[
          "Review general applications to become a contributor",
          "Browse contributor profiles by skill and availability",
          "Grant the contributor role on approval",
          "Manage the skills catalogue",
        ]}
        tables={["contributor_profiles", "contributor_skills", "skills", "volunteer_applications"]}
      />
    </>
  );
}
