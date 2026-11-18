import type { Metadata } from "next";

import { ProfileForm } from "@/components/dashboard/profile-form";
import { AppPageHeader } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth/guards";
import { getMyProfile } from "@/server/db/account";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false },
};

export default async function ProfilePage() {
  await requireUser("/dashboard/profile");
  const profile = await getMyProfile();

  return (
    <>
      <AppPageHeader
        title="Profile"
        description="This information may be shown publicly alongside your contributions."
      />
      <Card>
        <CardHeader>
          <CardTitle>Public profile</CardTitle>
          <CardDescription>Keep it simple: a name and a sentence or two is plenty.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaultValues={{
              displayName: profile?.display_name ?? "",
              username: profile?.username ?? "",
              bio: profile?.bio ?? "",
              location: profile?.location ?? "",
              websiteUrl: profile?.website_url ?? "",
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
