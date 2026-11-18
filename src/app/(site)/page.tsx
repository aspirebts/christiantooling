import Link from "next/link";

import { Section, SectionHeading } from "@/components/layout/section";
import { AnchorNav } from "@/components/marketing/anchor-nav";
import { GivePhone, IdeasPhone, PrayerPhone, TeamPhone } from "@/components/marketing/device-art";
import { EditorialBlock } from "@/components/marketing/editorial";
import { Hero } from "@/components/marketing/hero";
import { HighlightsCarousel, type Highlight } from "@/components/marketing/highlights";
import { PracticeGrid } from "@/components/marketing/practice-grid";
import {
  ConceptToolCard,
  SampleIdeaCard,
  SampleProjectCard,
  SampleToolCard,
} from "@/components/marketing/sample-cards";
import { SupportBand } from "@/components/marketing/support-band";
import { SampleNotice } from "@/components/shared/sample-badge";
import { Button } from "@/components/ui/button";
import {
  CONCEPT_OUR_TOOLS,
  SAMPLE_IDEAS,
  SAMPLE_PROJECTS,
  SAMPLE_TOOLS,
} from "@/content/placeholders";
import { getPracticeCategories, getSkills } from "@/server/db/reference-data";

const CHAPTERS = [
  { label: "Tools", href: "#explore" },
  { label: "Practices", href: "#practices" },
  { label: "Ideas", href: "#ideas" },
  { label: "Build", href: "#build" },
  { label: "Our tools", href: "#our-tools" },
  { label: "Support", href: "#support" },
];

const HIGHLIGHTS: Highlight[] = [
  {
    title: "Tools that help you pray.",
    linkLabel: "Explore tools",
    href: "/tools",
    art: <PrayerPhone />,
  },
  {
    title: "Ideas that should exist.",
    linkLabel: "Browse ideas",
    href: "/ideas",
    art: <IdeasPhone />,
  },
  {
    title: "Built by volunteers.",
    linkLabel: "Help build",
    href: "/help-build",
    art: <TeamPhone />,
  },
  {
    title: "Free, because you give.",
    linkLabel: "Support the mission",
    href: "/donate",
    art: <GivePhone />,
  },
];

export default async function HomePage() {
  // Cached public reference data: part of the static shell, refreshed hourly.
  const [categories, skills] = await Promise.all([getPracticeCategories(), getSkills()]);

  return (
    <>
      <Hero />
      <AnchorNav items={CHAPTERS} />

      {/* Highlights stage */}
      <Section tone="muted" spacing="compact" aria-labelledby="highlights-heading">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="highlights-heading" className="text-section text-foreground">
            Explore the highlights.
          </h2>
          <Link
            href="/tools"
            className="text-[17px] tracking-[-0.374px] text-apple-blue hover:underline"
          >
            Explore the directory ›
          </Link>
        </div>
        <HighlightsCarousel items={HIGHLIGHTS} label="Highlights" />
      </Section>

      {/* Explore Christian tools */}
      <Section id="explore" className="scroll-mt-14" aria-labelledby="explore-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="explore-heading"
            eyebrow="Tool directory"
            title="Explore Christian tools"
            description="A curated directory of apps, websites and resources, reviewed for usefulness and trustworthiness."
          />
          <Link
            href="/tools"
            className="text-[17px] tracking-[-0.374px] whitespace-nowrap text-apple-blue hover:underline"
          >
            Explore the directory ›
          </Link>
        </div>
        <div className="mt-10 flex flex-col gap-4">
          <SampleNotice>Preview listings. The directory opens in the next phase.</SampleNotice>
          <ul className="grid gap-5 md:grid-cols-3">
            {SAMPLE_TOOLS.map((tool) => (
              <li key={tool.name}>
                <SampleToolCard tool={tool} />
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Browse by Christian practice */}
      <Section
        id="practices"
        tone="muted"
        className="scroll-mt-14"
        aria-labelledby="practices-heading"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="practices-heading"
            eyebrow="Browse by practice"
            title="Find tools for the way you practise your faith"
            description="From prayer and Scripture to fellowship and service, explore tools organised around Christian practices."
          />
          {categories.items.length > 8 ? (
            <Link
              href="/tools#practices"
              className="text-[17px] tracking-[-0.374px] whitespace-nowrap text-apple-blue hover:underline"
            >
              See all {categories.items.length} practices ›
            </Link>
          ) : null}
        </div>
        <PracticeGrid
          className="mt-10"
          categories={categories.items}
          configured={categories.configured}
          limit={8}
        />
      </Section>

      {/* Discover ideas that should exist */}
      <Section id="ideas" className="scroll-mt-14" aria-labelledby="ideas-heading">
        <EditorialBlock
          id="ideas-heading"
          kicker="Ideas"
          title="Discover ideas that should exist"
          art={<IdeasPhone />}
          actions={
            <>
              <Button asChild size="lg">
                <Link href="/ideas">Browse ideas</Link>
              </Button>
              <Link
                href="/ideas#submit-idea"
                className="text-[17px] tracking-[-0.374px] text-apple-blue hover:underline"
              >
                Submit an idea ›
              </Link>
            </>
          }
        >
          <p>
            Some of the most helpful tools have not been built yet. Propose an idea, gather support
            from the community, and see approved ideas become real projects.
          </p>
          <p>Propose it. Discuss and vote. Then build it together, in the open.</p>
        </EditorialBlock>
        <div className="mt-14 flex flex-col gap-4">
          <SampleNotice>Example ideas showing how proposals will appear.</SampleNotice>
          <ul className="grid gap-5 lg:grid-cols-3">
            {SAMPLE_IDEAS.map((idea) => (
              <li key={idea.title}>
                <SampleIdeaCard idea={idea} />
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Help build Christian technology */}
      <Section id="build" tone="muted" className="scroll-mt-14" aria-labelledby="build-heading">
        <EditorialBlock
          id="build-heading"
          kicker="Help build"
          title="Help build Christian technology"
          art={<TeamPhone />}
          reverse
          stage="white"
          actions={
            <>
              <Button asChild size="lg">
                <Link href="/help-build">Become a contributor</Link>
              </Button>
              <Link
                href="/register"
                className="text-[17px] tracking-[-0.374px] text-apple-blue hover:underline"
              >
                Create an account ›
              </Link>
            </>
          }
        >
          <p>
            Developers, designers, writers and ministry leaders volunteer their skills to build
            open-source tools that serve the global Church.
          </p>
          {skills.configured && skills.items.length > 0 ? (
            <div className="flex flex-col gap-3 pt-2">
              <p className="text-[14px] font-semibold text-foreground">Skills we are looking for</p>
              <ul className="flex flex-wrap gap-2">
                {skills.items.slice(0, 10).map((skill) => (
                  <li
                    key={skill.slug}
                    className="rounded-full bg-card px-3 py-1 text-[14px] tracking-[-0.224px] text-foreground"
                  >
                    {skill.name}
                  </li>
                ))}
                {skills.items.length > 10 ? (
                  <li className="px-1 py-1 text-[14px]">and {skills.items.length - 10} more</li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </EditorialBlock>
        <div className="mt-14 flex flex-col gap-4">
          <SampleNotice>
            Example projects showing how volunteer opportunities will appear.
          </SampleNotice>
          <ul className="grid gap-5 md:grid-cols-2">
            {SAMPLE_PROJECTS.map((project) => (
              <li key={project.name}>
                <SampleProjectCard project={project} />
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Tools built by ChristianTooling */}
      <Section id="our-tools" className="scroll-mt-14" aria-labelledby="our-tools-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="our-tools-heading"
            eyebrow="Our tools"
            title="Tools built by ChristianTooling"
            description="Some needs are best met by tools we build and operate ourselves: free, privacy-respecting and maintained for the long term."
          />
          <Link
            href="/our-tools"
            className="text-[17px] tracking-[-0.374px] whitespace-nowrap text-apple-blue hover:underline"
          >
            See our tools ›
          </Link>
        </div>
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {CONCEPT_OUR_TOOLS.map((tool) => (
            <li key={tool.name}>
              <ConceptToolCard tool={tool} />
            </li>
          ))}
        </ul>
      </Section>

      {/* Support the mission */}
      <Section id="support" className="scroll-mt-14 pt-0 sm:pt-0" aria-label="Support the mission">
        <SupportBand />
      </Section>
    </>
  );
}
