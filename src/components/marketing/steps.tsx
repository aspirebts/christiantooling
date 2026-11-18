import { cn } from "@/lib/utils";

export type Step = { title: string; description: string };

/** Numbered process steps: quiet numerals, no decoration. */
export function Steps({ steps, className }: { steps: Step[]; className?: string }) {
  return (
    <ol className={cn("grid gap-8 md:grid-cols-3", className)}>
      {steps.map((step, index) => (
        <li key={step.title} className="flex flex-col gap-2">
          <span
            aria-hidden="true"
            className="font-display text-[40px] leading-none font-semibold text-apple-blue"
          >
            {index + 1}
          </span>
          <h3 className="font-display text-[21px] leading-[1.19] font-semibold text-foreground">
            {step.title}
          </h3>
          <p className="text-[17px] leading-[1.29] text-muted-foreground">{step.description}</p>
        </li>
      ))}
    </ol>
  );
}
