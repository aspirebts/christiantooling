import { cn } from "@/lib/utils";

type EditorialBlockProps = {
  id: string;
  kicker: string;
  title: string;
  /** Quiet paragraph copy, 17px. */
  children: React.ReactNode;
  actions?: React.ReactNode;
  /** Product art: cropped into the stage on the opposite side. */
  art: React.ReactNode;
  /** Put the art on the left on large screens. */
  reverse?: boolean;
  /** Stage surface; use "white" when the section itself is Studio Mist. */
  stage?: "mist" | "white";
};

/**
 * Long-form product story: kicker, big left-aligned statement, 17px body, and
 * an oversized product render entering the stage from below.
 */
export function EditorialBlock({
  id,
  kicker,
  title,
  children,
  actions,
  art,
  reverse = false,
  stage = "mist",
}: EditorialBlockProps) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={cn("flex flex-col gap-5", reverse && "lg:order-2")}>
        <p className="eyebrow text-foreground">{kicker}</p>
        <h2 id={id} className="text-section text-foreground">
          {title}
        </h2>
        <div className="flex max-w-xl flex-col gap-4 text-[17px] leading-[1.24] tracking-[-0.374px] text-muted-foreground">
          {children}
        </div>
        {actions ? <div className="mt-2 flex flex-wrap items-center gap-4">{actions}</div> : null}
      </div>
      <div
        className={cn(
          "relative flex h-[30rem] items-start justify-center overflow-hidden rounded-3xl pt-12 sm:h-[36rem]",
          stage === "mist" ? "bg-secondary" : "bg-card",
          reverse && "lg:order-1",
        )}
      >
        <div className="w-[15.5rem] sm:w-[18rem]">{art}</div>
      </div>
    </div>
  );
}
