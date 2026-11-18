import type { Metadata } from "next";
import Link from "next/link";
import { LightbulbIcon, MessagesSquareIcon, RocketIcon, VoteIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Section, SectionHeading } from "@/components/layout/section";
import { SampleIdeaCard } from "@/components/marketing/sample-cards";
import { Steps } from "@/components/marketing/steps";
import { SampleNotice } from "@/components/shared/sample-badge";
import { Button } from "@/components/ui/button";
import { SAMPLE_IDEAS } from "@/content/placeholders";

export const metadata: Metadata = {
  title: "Ideas",
  description:
    "Discover ideas for Christian tools that should exist, vote for the most needed and propose your own.",
};

const GOOD_IDEA_TRAITS = [
  {
    icon: LightbulbIcon,
    title: "A real need",
    description: "Start from a problem Christians or churches actually face.",
  },
  {
    icon: MessagesSquareIcon,
    title: "Clear audience",
    description: "Say who it helps: families, pastors, new believers, a region.",
  },
  {
    icon: VoteIcon,
    title: "Simple first version",
    description: "Describe the smallest useful tool, not every feature at once.",
  },
  {
    icon: RocketIcon,
    title: "Room to grow",
    description: "Volunteers can build on it; open source keeps it shareable.",
  },
];

export default function IdeasPage() {
  return (
    <>
      <PageHeader
        eyebrow="Ideas"
        title="Ideas that should exist"
        description="Some of the most helpful tools have not been built yet. Share what you wish existed, gather support, and watch approved ideas become open-source projects."
        actions={
          <Button asChild size="lg">
            <Link href="#submit-idea">Submit an idea</Link>
          </Button>
        }
      />

      <Section aria-labelledby="how-heading">
        <SectionHeading id="how-heading" eyebrow="How it works" title="From idea to tool" />
        <Steps
          className="mt-10"
          steps={[
            {
              title: "Propose an idea",
              description:
                "Describe the need, who it serves and what a first version could do. Moderators review ideas before they are published.",
            },
            {
              title: "Discuss and vote",
              description:
                "Members vote and comment to refine the idea. The most supported ideas rise to the top.",
            },
            {
              title: "Build together",
              description:
                "Approved ideas become projects. Volunteer contributors build them in the open, supported by ChristianTooling.",
            },
          ]}
        />
      </Section>

      <Section tone="muted" aria-labelledby="trending-heading">
        <SectionHeading
          id="trending-heading"
          title="Popular ideas"
          description="Voting and discussion open in a later phase. These examples show how ideas will appear."
        />
        <div className="mt-8 flex flex-col gap-4">
          <SampleNotice>Example ideas, not real submissions.</SampleNotice>
          <ul className="grid gap-4 lg:grid-cols-3">
            {SAMPLE_IDEAS.map((idea) => (
              <li key={idea.title}>
                <SampleIdeaCard idea={idea} />
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section id="submit-idea" aria-labelledby="submit-heading" className="scroll-mt-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <SectionHeading
              id="submit-heading"
              eyebrow="Submit an idea"
              title="What tool do you wish existed?"
              description="Idea submissions open soon for members. Create a free account now so you are ready to share your idea, vote and join the conversation."
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">Create a free account</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {GOOD_IDEA_TRAITS.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="flex flex-col gap-2 rounded-3xl bg-card p-5 ring-1 ring-border/70"
              >
                <Icon className="size-5 text-highlight" aria-hidden="true" />
                <p className="font-medium text-ink">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
