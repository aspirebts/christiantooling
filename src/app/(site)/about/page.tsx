import type { Metadata } from "next";
import Link from "next/link";
import {
  AwardIcon,
  BookOpenIcon,
  CompassIcon,
  HandshakeIcon,
  LightbulbIcon,
  ScrollTextIcon,
  SearchIcon,
  SendIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Section, SectionHeading } from "@/components/layout/section";
import { SupportBand } from "@/components/marketing/support-band";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description: siteConfig.mission,
};

const WHAT_WE_DO = [
  {
    icon: SearchIcon,
    title: "Aggregate tools",
    description: "Bring the best tools for practising the faith together in one trusted directory.",
  },
  {
    icon: SendIcon,
    title: "Welcome submissions",
    description: "Let anyone suggest existing Christian tools for review and inclusion.",
  },
  {
    icon: LightbulbIcon,
    title: "Gather ideas",
    description: "Collect ideas for tools that should exist and let the community refine them.",
  },
  {
    icon: UsersIcon,
    title: "Connect volunteers",
    description: "Match approved ideas with volunteer developers, designers and writers.",
  },
  {
    icon: WrenchIcon,
    title: "Build in the open",
    description: "Develop open-source Christian technology and operate tools we own.",
  },
  {
    icon: HandshakeIcon,
    title: "Steward support",
    description: "Receive donations that sustain staff, development and maintenance.",
  },
];

const VALUES = [
  {
    icon: BookOpenIcon,
    title: "Faith",
    description:
      "Everything we build serves Christians in following Jesus and loving their neighbours.",
  },
  {
    icon: SparklesIcon,
    title: "Innovation",
    description: "We use modern technology thoughtfully, in service of timeless practices.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Trust",
    description:
      "We are transparent with supporters and protect the privacy of the people we serve.",
  },
  {
    icon: AwardIcon,
    title: "Excellence",
    description: "We hold our work to a high standard because it is offered to God and to others.",
  },
  {
    icon: CompassIcon,
    title: "Usefulness",
    description: "We measure success by real help in real lives, not by features or downloads.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="A technology ministry for the global Church"
        description={siteConfig.mission}
      />

      <Section aria-labelledby="mission-heading">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <SectionHeading
            id="mission-heading"
            eyebrow="Our mission"
            title="Helping Christians practise their faith more effectively"
          />
          <div className="flex flex-col gap-5 text-lg leading-relaxed text-muted-foreground">
            <p>
              Technology shapes how we spend our attention, build relationships and learn. We
              believe it can also help people pray, engage with Scripture, worship, serve and grow
              in community.
            </p>
            <p>
              ChristianTooling exists to make that help easy to find and to build what is missing.
              We are not a church and not a social network: we are a technology platform and a
              community of people who want faithful tools to flourish.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="muted" aria-labelledby="what-heading">
        <SectionHeading id="what-heading" eyebrow="What we do" title="Six ways we serve" />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHAT_WE_DO.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex gap-4 rounded-3xl bg-card p-6 ring-1 ring-border/70">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-studio-mist text-slate">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-medium text-ink">{title}</span>
                <span className="text-sm leading-relaxed text-muted-foreground">{description}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section aria-labelledby="values-heading">
        <SectionHeading id="values-heading" eyebrow="Our values" title="What guides our work" />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {VALUES.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex flex-col gap-3 rounded-3xl bg-card p-6 ring-1 ring-border/70"
            >
              <Icon className="size-5 text-highlight" aria-hidden="true" />
              <p className="font-semibold text-ink">{title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="muted" aria-labelledby="faith-heading">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <ScrollTextIcon className="size-8 text-highlight" aria-hidden="true" />
          <h2 id="faith-heading" className="text-2xl font-semibold tracking-tight text-ink">
            Statement of faith
          </h2>
          <p className="text-muted-foreground">
            Our statement of faith will be published here by the ministry&apos;s leadership. It will
            describe the beliefs that guide our work and our review of tools and content.
          </p>
          <span className="rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground">
            Content pending
          </span>
        </div>
      </Section>

      <Section aria-labelledby="join-heading">
        <div className="flex flex-col items-center gap-6 text-center">
          <SectionHeading
            id="join-heading"
            align="center"
            title="Join the mission"
            description="Explore tools, share an idea, volunteer your skills or support the work."
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/tools">Explore Tools</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/help-build">Help Build</Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section spacing="compact" className="pb-20" aria-label="Support the mission">
        <SupportBand />
      </Section>
    </>
  );
}
