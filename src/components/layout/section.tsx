import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { Container } from "./container";

/** Alternating white and Studio Mist bands, 90px apart, no borders or textures. */
const sectionVariants = cva("relative", {
  variants: {
    tone: {
      default: "bg-background",
      muted: "bg-secondary",
    },
    spacing: {
      default: "py-16 sm:py-[90px]",
      compact: "py-12 sm:py-16",
    },
  },
  defaultVariants: { tone: "default", spacing: "default" },
});

type SectionProps = React.ComponentProps<"section"> &
  VariantProps<typeof sectionVariants> & {
    /** Set to false to manage the inner container yourself. */
    contained?: boolean;
  };

export function Section({
  className,
  tone,
  spacing,
  contained = true,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn(sectionVariants({ tone, spacing }), className)} {...props}>
      {contained ? <Container>{children}</Container> : children}
    </section>
  );
}

type SectionHeadingProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  /** Heading level; sections default to h2. */
  as?: "h1" | "h2" | "h3";
  className?: string;
  id?: string;
};

/** Small kicker, a large statement, and one quiet line of support. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as: Heading = "h2",
  className,
  id,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex max-w-3xl flex-col gap-3",
        align === "center" && "mx-auto items-center text-center",
        className,
      )}
    >
      {eyebrow ? <p className="eyebrow text-foreground">{eyebrow}</p> : null}
      <Heading id={id} className="text-section text-foreground">
        {title}
      </Heading>
      {description ? <p className="text-lead text-muted-foreground">{description}</p> : null}
    </div>
  );
}
