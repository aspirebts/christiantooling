import type { Metadata } from "next";

import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { AppPageHeader } from "@/components/layout/app-shell";
import { requirePermission } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Donations",
  robots: { index: false },
};

export default async function AdminDonationsPage() {
  await requirePermission("donations:view", "/admin/donations");

  return (
    <>
      <AppPageHeader title="Donations" description="Gifts, recurring support and allocations." />
      <AdminPlaceholder
        phase="phase 5"
        summary="Online giving will integrate a payment provider through secure server-side webhooks."
        capabilities={[
          "Payment provider integration with webhook-recorded donations",
          "Recurring giving management",
          "Allocate funds to projects and record general-fund decisions",
          "Publish impact reports",
        ]}
        tables={["donations", "recurring_donations", "project_allocations", "impact_reports"]}
      />
    </>
  );
}
