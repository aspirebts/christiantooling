import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarHeartIcon,
  CodeIcon,
  EyeIcon,
  FileBarChartIcon,
  GiftIcon,
  InfoIcon,
  LockIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Section, SectionHeading } from "@/components/layout/section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Support the staff, development and maintenance behind ChristianTooling's tools and platform.",
};

const USES = [
  {
    icon: UsersIcon,
    title: "Staff",
    description:
      "Coordinators who review tools, guide volunteers, moderate ideas and care for the community.",
  },
  {
    icon: CodeIcon,
    title: "Development",
    description:
      "Designing and building new open-source tools, from first prototype to public launch.",
  },
  {
    icon: WrenchIcon,
    title: "Maintenance",
    description:
      "Hosting, security updates, accessibility fixes and support so tools keep serving people.",
  },
];

const WAYS_TO_GIVE = [
  {
    icon: GiftIcon,
    title: "One-time gift",
    description: "Give once to support the platform as a whole or a specific project.",
  },
  {
    icon: CalendarHeartIcon,
    title: "Monthly partnership",
    description:
      "Recurring gifts give the ministry predictable support to plan and maintain tools.",
  },
];

const COMMITMENTS = [
  {
    icon: EyeIcon,
    title: "Transparency",
    description:
      "We will report how funds are allocated across staff, development and maintenance.",
  },
  {
    icon: FileBarChartIcon,
    title: "Impact reports",
    description: "Regular reports will show what your support made possible.",
  },
  {
    icon: LockIcon,
    title: "Respect for donors",
    description:
      "Payments are handled by a trusted processor; we never store card details or sell donor data.",
  },
];

export default function DonatePage() {
  return (
    <>
      <PageHeader
        eyebrow="Donate"
        title="Support the mission"
        description="Your generosity keeps ChristianTooling free for everyone and sustains the people and technology behind it."
      />

      <Section spacing="compact" aria-label="Giving status">
        <Alert variant="info">
          <InfoIcon aria-hidden="true" />
          <AlertTitle>Online giving opens soon</AlertTitle>
          <AlertDescription>
            <p>
              We are setting up secure online donations. Giving options, receipts and payment
              details will be published here when they are ready.
            </p>
          </AlertDescription>
        </Alert>
      </Section>

      <Section className="pt-0 sm:pt-0 lg:pt-0" aria-labelledby="uses-heading">
        <SectionHeading
          id="uses-heading"
          eyebrow="Where gifts go"
          title="What your support makes possible"
        />
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {USES.map(({ icon: Icon, title, description }) => (
            <li key={title}>
              <Card className="h-full">
                <CardHeader>
                  <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-ink text-apple-blue">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <CardDescription className="leading-relaxed">{description}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="muted" aria-labelledby="ways-heading">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <SectionHeading id="ways-heading" eyebrow="Ways to give" title="Choose how you give" />
            <ul className="flex flex-col gap-4">
              {WAYS_TO_GIVE.map(({ icon: Icon, title, description }) => (
                <li key={title}>
                  <Card className="gap-2 py-5">
                    <CardContent className="flex gap-4 px-5">
                      <Icon className="mt-0.5 size-5 shrink-0 text-highlight" aria-hidden="true" />
                      <div className="flex flex-col gap-1">
                        <p className="font-medium text-ink">{title}</p>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-8">
            <SectionHeading
              id="stewardship-heading"
              eyebrow="Stewardship"
              title="Our commitments to you"
            />
            <ul className="flex flex-col gap-5">
              {COMMITMENTS.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-slate">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium text-ink">{title}</span>
                    <span className="text-sm text-muted-foreground">{description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section aria-labelledby="meanwhile-heading">
        <div className="flex flex-col items-center gap-6 text-center">
          <SectionHeading
            id="meanwhile-heading"
            align="center"
            title="Other ways to help today"
            description="You can support the mission right now by sharing your skills or ideas."
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/help-build">Volunteer your skills</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/ideas">Share an idea</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
