import { SampleBadge } from "@/components/shared/sample-badge";
import type { ConceptTool, SampleIdea, SampleProject, SampleTool } from "@/content/placeholders";
import { cn } from "@/lib/utils";

/*
 * Cards for PLACEHOLDER content (src/content/placeholders.ts). Each carries a
 * visible "Sample" label. Flat 28px surfaces, no borders or shadows: use the
 * Studio Mist surface on white sections and the white surface on mist bands.
 */

type Surface = "mist" | "white";

const surfaceClass = (surface: Surface) => (surface === "mist" ? "bg-secondary" : "bg-card");

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

export function SampleToolCard({
  tool,
  surface = "mist",
}: {
  tool: SampleTool;
  surface?: Surface;
}) {
  return (
    <div className={cn("flex h-full flex-col gap-5 rounded-3xl p-7", surfaceClass(surface))}>
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-ink text-[15px] font-semibold text-white"
        >
          {initialsOf(tool.name)}
        </span>
        <div className="min-w-0">
          <p className="font-display text-[19px] leading-[1.21] font-semibold text-foreground">
            {tool.name}
          </p>
          <p className="text-[14px] text-muted-foreground">{tool.format}</p>
        </div>
      </div>
      <p className="flex-1 text-[17px] leading-[1.29] text-muted-foreground">{tool.tagline}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-foreground">
        <span>{tool.practice}</span>
        <span className="text-muted-foreground">{tool.pricing}</span>
        <span className="ml-auto">
          <SampleBadge />
        </span>
      </div>
    </div>
  );
}

export function SampleIdeaCard({
  idea,
  surface = "mist",
}: {
  idea: SampleIdea;
  surface?: Surface;
}) {
  return (
    <div className={cn("flex gap-4 rounded-3xl p-6", surfaceClass(surface))}>
      <div
        className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-background text-foreground"
        aria-label={`${idea.votes} votes`}
      >
        <span aria-hidden="true" className="text-[11px] text-apple-blue">
          ▲
        </span>
        <span className="text-[17px] font-semibold">{idea.votes}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="font-display text-[19px] leading-[1.21] font-semibold text-foreground">
          {idea.title}
        </p>
        <p className="text-[14px] leading-[1.29] text-muted-foreground">{idea.summary}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
          <span>{idea.practice}</span>
          <span className={idea.status === "Approved" ? "text-success" : undefined}>
            {idea.status}
          </span>
          <SampleBadge />
        </div>
      </div>
    </div>
  );
}

export function SampleProjectCard({
  project,
  surface = "white",
}: {
  project: SampleProject;
  surface?: Surface;
}) {
  return (
    <div className={cn("flex h-full flex-col gap-3 rounded-3xl p-7", surfaceClass(surface))}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-[19px] leading-[1.21] font-semibold text-foreground">
          {project.name}
        </p>
        <span className="text-[12px] font-semibold text-apple-blue">{project.status}</span>
      </div>
      <p className="text-[17px] leading-[1.29] text-muted-foreground">{project.summary}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
        {project.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-secondary px-3 py-1 text-[12px] text-foreground"
          >
            {skill}
          </span>
        ))}
        <span className="ml-auto">
          <SampleBadge />
        </span>
      </div>
    </div>
  );
}

export function ConceptToolCard({
  tool,
  surface = "mist",
}: {
  tool: ConceptTool;
  surface?: Surface;
}) {
  const inDevelopment = tool.stage === "In development";
  return (
    <div className={cn("flex h-full flex-col gap-3 rounded-3xl p-7", surfaceClass(surface))}>
      {/* Launch status: bare text, never a pill. */}
      <p
        className={cn(
          "text-[12px] leading-4 font-semibold tracking-[-0.12px]",
          inDevelopment ? "text-launch-orange" : "text-muted-foreground",
        )}
      >
        {tool.stage}
      </p>
      <p className="font-display text-[24px] leading-[1.17] font-semibold text-foreground">
        {tool.name}
      </p>
      <p className="text-[17px] leading-[1.29] text-muted-foreground">{tool.summary}</p>
    </div>
  );
}
