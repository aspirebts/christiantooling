import type { Metadata } from "next";
import Link from "next/link";
import { CodeIcon, GlobeIcon, HeartHandshakeIcon, ShieldCheckIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Section, SectionHeading } from "@/components/layout/section";
import { SampleProjectCard } from "@/components/marketing/sample-cards";
import { Steps } from "@/components/marketing/steps";
import { SampleNotice } from "@/components/shared/sample-badge";
import { SetupNotice } from "@/components/shared/setup-notice";
import { Button } from "@/components/ui/button";
import { SAMPLE_PROJECTS } from "@/content/placeholders";
import { getSkills, type Skill, type SkillCategory } from "@/server/db/reference-data";

export const metadata: Metadata = {
  title: "Help Build",
  description:
    "Volunteer your skills to build open-source Christian technology that serves the global Church.",
};

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  engineering: "Engineering",
  design: "Design",
  product: "Product",
  content: "Content",
  ministry: "Ministry",
  operations: "Operations",
};

const REASONS = [
  {
    icon: HeartHandshakeIcon,
    title: "Serve with your gifts",
    description: "Use professional skills for Kingdom work, alongside people who share your faith.",
  },
  {
    icon: CodeIcon,
    title: "Build in the open",
    description: "Projects are open source, so your work can be reused and improved by others.",
  },
  {
    icon: GlobeIcon,
    title: "Reach the global Church",
    description: "Tools are built for Christians and churches in every context and language.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Supported and sustained",
    description: "ChristianTooling provides direction, review and long-term maintenance.",
  },
];

function groupSkills(skills: Skill[]) {
  const groups = new Map<SkillCategory, Skill[]>();
  for (const skill of skills) {
    groups.set(skill.category, [...(groups.get(skill.category) ?? []), skill]);
  }
  return [...groups.entries()];
}

export default async function HelpBuildPage() {
  const skills = await getSkills();

  return (
    <>
      <PageHeader
        eyebrow="Help build"
        title="Help build Christian technology"
        description="Developers, designers, writers, translators and ministry leaders volunteer on open-source projects that help Christians practise their faith."
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/register">Become a contributor</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#skills">See the skills we need</Link>
            </Button>
          </>
        }
      />

      <Section aria-labelledby="why-heading">
        <SectionHeading
          id="why-heading"
          eyebrow="Why volunteer"
          title="Meaningful work, done together"
        />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex flex-col gap-3 rounded-3xl bg-card p-6 ring-1 ring-border/70"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-studio-mist text-slate">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <p className="font-medium text-ink">{title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="muted" aria-labelledby="process-heading">
        <SectionHeading
          id="process-heading"
          eyebrow="How it works"
          title="How contributing works"
        />
        <Steps
          className="mt-10"
          steps={[
            {
              title: "Create your contributor profile",
              description:
                "Sign up, then tell us about your skills, experience and how many hours you can give.",
            },
            {
              title: "Apply to a project",
              description:
                "Browse projects that are recruiting and apply to the ones that fit your gifts.",
            },
            {
              title: "Build and ship",
              description: "Work with a project lead and team to ship tools that serve real needs.",
            },
          ]}
        />
      </Section>

      <Section id="skills" aria-labelledby="skills-heading" className="scroll-mt-20">
        <SectionHeading
          id="skills-heading"
          eyebrow="Skills"
          title="Skills we are looking for"
          description="Every project needs more than code. Here is where you can help."
        />
        <div className="mt-10">
          {skills.configured ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {groupSkills(skills.items).map(([category, items]) => (
                <section
                  key={category}
                  aria-label={CATEGORY_LABELS[category]}
                  className="rounded-3xl bg-card p-6 ring-1 ring-border/70"
                >
                  <h3 className="font-semibold text-ink">{CATEGORY_LABELS[category]}</h3>
                  <ul className="mt-4 flex flex-col gap-3">
                    {items.map((skill) => (
                      <li key={skill.slug}>
                        <p className="text-sm font-medium text-foreground">{skill.name}</p>
                        <p className="text-sm text-muted-foreground">{skill.description}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <SetupNotice feature="The skills list" />
          )}
        </div>
      </Section>

      <Section tone="muted" aria-labelledby="projects-heading">
        <SectionHeading
          id="projects-heading"
          title="Projects"
          description="Project listings and applications open in a later phase."
        />
        <div className="mt-8 flex flex-col gap-4">
          <SampleNotice>Example projects, not open opportunities.</SampleNotice>
          <ul className="grid gap-5 md:grid-cols-2">
            {SAMPLE_PROJECTS.map((project) => (
              <li key={project.name}>
                <SampleProjectCard project={project} />
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
