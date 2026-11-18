import type { Metadata } from "next";

import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { AppPageHeader } from "@/components/layout/app-shell";
import { requirePermission } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Content",
  robots: { index: false },
};

export default async function AdminContentPage() {
  await requirePermission("content:manage", "/admin/content");

  return (
    <>
      <AppPageHeader
        title="Content"
        description="Website pages, announcements and notifications."
      />
      <AdminPlaceholder
        phase="phase 5"
        summary="Content tools let staff update the website without code changes."
        capabilities={[
          "Edit website pages such as policies and FAQs",
          "Schedule announcements for specific audiences",
          "Send in-app notifications to members",
          "Manage images in the content media library",
        ]}
        tables={["site_pages", "announcements", "notifications", "audit_logs"]}
      />
    </>
  );
}
