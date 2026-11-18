import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  CircleCheckIcon,
  CircleIcon,
  HandHelpingIcon,
  LightbulbIcon,
  SendIcon,
  SettingsIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react";

import { AppPageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/lib/rbac/permissions";
import { hasMinRole, ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/rbac/roles";
import { requireUser } from "@/server/auth/guards";
import { getMyProfile } from "@/server/db/account";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const profile = await getMyProfile();

  const checklist = [
    { label: "Add a display name", done: Boolean(profile?.display_name) },
    { label: "Choose a username", done: Boolean(profile?.username) },
    { label: "Write a short bio", done: Boolean(profile?.bio) },
  ];
  const completed = checklist.filter((item) => item.done).length;
  const isContributor = hasMinRole(user.role, "contributor");

  return (
    <>
      <AppPageHeader
        title={`Welcome, ${user.displayName}`}
        description="Your home for tools, ideas and volunteering on ChristianTooling."
      />

      <Card>
        <CardHeader className="sm:grid-cols-[1fr_auto]">
          <CardTitle>Your role</CardTitle>
          <CardDescription>{ROLE_DESCRIPTIONS[user.role]}</CardDescription>
          <div className="flex flex-wrap gap-2 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:self-center">
            <Badge variant="highlight">{ROLE_LABELS[user.role]}</Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="size-4 text-highlight" aria-hidden="true" />
              Complete your profile
            </CardTitle>
            <CardDescription>
              {completed} of {checklist.length} steps done
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2.5">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2.5 text-sm">
                  {item.done ? (
                    <CircleCheckIcon className="size-4 text-success" aria-hidden="true" />
                  ) : (
                    <CircleIcon className="size-4 text-steel" aria-hidden="true" />
                  )}
                  <span
                    className={item.done ? "text-muted-foreground line-through" : "text-foreground"}
                  >
                    {item.label}
                  </span>
                  <span className="sr-only">{item.done ? "(done)" : "(to do)"}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="sm" className="self-start">
              <Link href="/dashboard/profile">Edit profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandHelpingIcon className="size-4 text-highlight" aria-hidden="true" />
              {isContributor ? "You are a contributor" : "Become a contributor"}
            </CardTitle>
            <CardDescription>
              {isContributor
                ? "Thank you for serving. Project applications open in an upcoming phase."
                : "Volunteer your skills on open-source projects that serve the Church."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/help-build">
                {isContributor ? "See how projects will work" : "Learn about volunteering"}
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="activity-heading" className="flex flex-col gap-4">
        <h2 id="activity-heading" className="text-lg font-semibold text-ink">
          Your activity
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <EmptyState
            icon={SendIcon}
            title="Tool submissions"
            description="Tools you suggest for the directory will appear here."
          />
          <EmptyState
            icon={LightbulbIcon}
            title="Ideas"
            description="Ideas you propose and vote for will appear here."
          />
          <EmptyState
            icon={HandHelpingIcon}
            title="Volunteer applications"
            description="Your applications to projects will appear here."
          />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/dashboard/settings">
            <SettingsIcon aria-hidden="true" />
            Account settings
          </Link>
        </Button>
        {can(user.role, "admin:access") ? (
          <Button asChild>
            <Link href="/admin">
              <ShieldIcon aria-hidden="true" />
              Open administration
            </Link>
          </Button>
        ) : null}
      </div>
    </>
  );
}
