import type { Metadata } from "next";
import Link from "next/link";
import { BookCheckIcon, CodeIcon, GiftIcon, LockIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Section, SectionHeading } from "@/components/layout/section";
import { ConceptToolCard } from "@/components/marketing/sample-cards";
import { SampleNotice } from "@/components/shared/sample-badge";
import { Button } from "@/components/ui/button";
import { CONCEPT_OUR_TOOLS } from "@/content/placeholders";

export const metadata: Metadata = {
  title: "Our Tools",
  description:
    "Tools built and operated by ChristianTooling: free, privacy-respecting and open source.",
};

const PRINCIPLES = [
  {
    icon: GiftIcon,
    title: "Free to use",
    description: "Funded by donations so cost is never a barrier for churches or individuals.",
  },
  {
    icon: LockIcon,
    title: "Privacy first",
    description: "We collect only what a tool needs and never sell personal data.",
  },
  {
    icon: CodeIcon,
    title: "Open source",
    description: "Code is public so others can learn from it, audit it and build on it.",
  },
  {
    icon: BookCheckIcon,
    title: "Carefully reviewed",
    description: "Content touching Scripture and doctrine is reviewed with care.",
  },
];

export default function OurToolsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our tools"
        title="Tools built by ChristianTooling"
        description="When a need is not met by existing tools, we build and operate solutions ourselves, sustained for the long term by our staff and supporters."
        actions={
          <Button asChild size="lg" variant="outline">
            <Link href="/ideas">See ideas in progress</Link>
          </Button>
        }
      />

      <Section aria-labelledby="catalog-heading">
        <SectionHeading
          id="catalog-heading"
          title="What we are building"
          description="Our first tools are in planning and development. Each will be listed here with links when it launches."
        />
        <div className="mt-8 flex flex-col gap-4">
          <SampleNotice>Planned tools. Names and scope may change before launch.</SampleNotice>
          <ul className="grid gap-5 md:grid-cols-3">
            {CONCEPT_OUR_TOOLS.map((tool) => (
              <li key={tool.name}>
                <ConceptToolCard tool={tool} />
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="muted" aria-labelledby="principles-heading">
        <SectionHeading id="principles-heading" eyebrow="Our principles" title="How we build" />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex flex-col gap-3 rounded-3xl bg-card p-6 ring-1 ring-border/70"
            >
              <Icon className="size-5 text-highlight" aria-hidden="true" />
              <p className="font-medium text-ink">{title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section aria-labelledby="involved-heading">
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-card p-8 ring-1 ring-border/70 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <SectionHeading
            id="involved-heading"
            title="Want to help build our tools?"
            description="Volunteers and supporters make every ChristianTooling tool possible."
          />
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/help-build">Volunteer</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/donate">Donate</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
