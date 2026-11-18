import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CircleCheckIcon, FilterIcon, SendIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Section, SectionHeading } from "@/components/layout/section";
import { PracticeGrid } from "@/components/marketing/practice-grid";
import { SampleToolCard } from "@/components/marketing/sample-cards";
import { DataIcon } from "@/components/shared/icon-registry";
import { SampleNotice } from "@/components/shared/sample-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SAMPLE_TOOLS } from "@/content/placeholders";
import {
  getPracticeCategories,
  getTechnologyTypes,
  type ReferenceList,
  type PracticeCategory,
} from "@/server/db/reference-data";

export const metadata: Metadata = {
  title: "Explore Tools",
  description:
    "Browse Christian tools by practice and format: apps, websites and resources that help you live your faith.",
};

const REVIEW_CRITERIA = [
  "Genuinely helps people practise their faith",
  "Respects privacy and handles data responsibly",
  "Is actively maintained and works as described",
  "Treats Scripture and Christian teaching with care",
];

export default async function ToolsPage({ searchParams }: PageProps<"/tools">) {
  const [categories, technologyTypes] = await Promise.all([
    getPracticeCategories(),
    getTechnologyTypes(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Tool directory"
        title="Explore Christian tools"
        description="Find apps, websites and resources that help you pray, read Scripture, worship, serve and grow in community."
      />

      <Section id="practices" aria-labelledby="practices-heading">
        <SectionHeading
          id="practices-heading"
          title="Browse by Christian practice"
          description="Choose a practice to see the tools that support it."
        />
        <div className="mt-10">
          {/* The selected practice comes from the URL, so only the highlight streams in. */}
          <Suspense
            fallback={
              <PracticeGrid categories={categories.items} configured={categories.configured} />
            }
          >
            <SelectedPractice searchParams={searchParams} categories={categories} />
          </Suspense>
        </div>
      </Section>

      <Section id="directory" tone="muted" aria-labelledby="directory-heading">
        <div className="grid gap-10 lg:grid-cols-[1fr_18rem]">
          <div className="flex flex-col gap-6">
            <SectionHeading
              id="directory-heading"
              title="Directory preview"
              description="Searchable, filterable listings arrive in the next development phase. Here is how they will look."
            />
            <SampleNotice>These listings are samples, not real directory entries.</SampleNotice>
            <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {SAMPLE_TOOLS.map((tool) => (
                <li key={tool.name}>
                  <SampleToolCard tool={tool} />
                </li>
              ))}
            </ul>
          </div>
          <aside
            aria-labelledby="formats-heading"
            className="flex flex-col gap-4 rounded-3xl bg-card p-5 ring-1 ring-border/70"
          >
            <h3
              id="formats-heading"
              className="flex items-center gap-2 text-sm font-semibold text-ink"
            >
              <FilterIcon className="size-4 text-highlight" aria-hidden="true" />
              Formats in the directory
            </h3>
            {technologyTypes.configured && technologyTypes.items.length > 0 ? (
              <ul className="flex flex-col gap-2.5">
                {technologyTypes.items.map((type) => (
                  <li
                    key={type.slug}
                    className="flex items-center gap-2.5 text-sm text-muted-foreground"
                  >
                    <DataIcon name={type.icon} className="size-4 text-slate" />
                    {type.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Formats load from the database once it is connected.
              </p>
            )}
          </aside>
        </div>
      </Section>

      <Section aria-labelledby="submit-heading">
        <div className="grid gap-10 rounded-3xl bg-card p-8 ring-1 ring-border/70 sm:p-10 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <SectionHeading
              id="submit-heading"
              eyebrow="Suggest a tool"
              title="Know a tool that belongs here?"
              description="Members will be able to submit existing tools for review. Create an account now and you will be ready when submissions open in the next phase."
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/register">
                  <SendIcon aria-hidden="true" />
                  Create an account
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-ink">Every submission is reviewed for:</p>
            <ul className="flex flex-col gap-3">
              {REVIEW_CRITERIA.map((criterion) => (
                <li key={criterion} className="flex gap-3 text-sm text-muted-foreground">
                  <CircleCheckIcon
                    className="mt-0.5 size-4 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  {criterion}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}

async function SelectedPractice({
  searchParams,
  categories,
}: {
  searchParams: PageProps<"/tools">["searchParams"];
  categories: ReferenceList<PracticeCategory>;
}) {
  const { practice } = await searchParams;
  const activeSlug = typeof practice === "string" ? practice : undefined;
  const selected = categories.items.find((category) => category.slug === activeSlug);

  return (
    <div className="flex flex-col gap-6">
      {selected ? (
        <Alert variant="info">
          <DataIcon name={selected.icon} />
          <AlertTitle>{selected.name}</AlertTitle>
          <AlertDescription>
            <p>
              Tools for {selected.name.toLowerCase()} will be listed here when the directory opens.{" "}
              <Link href="/tools#practices" className="font-medium underline underline-offset-4">
                Clear selection
              </Link>
            </p>
          </AlertDescription>
        </Alert>
      ) : null}
      <PracticeGrid
        categories={categories.items}
        configured={categories.configured}
        activeSlug={activeSlug}
      />
    </div>
  );
}
