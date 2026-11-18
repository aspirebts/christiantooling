import type { Metadata } from "next";

import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { PreferencesForm } from "@/components/dashboard/preferences-form";
import { AppPageHeader } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupportedTimeZones } from "@/lib/validations/account";
import { requireUser } from "@/server/auth/guards";
import { getMyPreferences } from "@/server/db/account";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false },
};

export default async function SettingsPage() {
  const user = await requireUser("/dashboard/settings");
  const preferences = await getMyPreferences();

  return (
    <>
      <AppPageHeader
        title="Settings"
        description="Manage your account, notifications and security."
      />

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>The email address you use to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-foreground">{user.email ?? "No email on file"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Choose what we send you. Emails begin when the notification system launches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm
            timeZones={getSupportedTimeZones()}
            defaultValues={{
              emailNotifications: preferences.email_notifications,
              newsletterOptIn: preferences.newsletter_opt_in,
              timezone: preferences.timezone,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>For your security, confirm your current password first.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </>
  );
}
