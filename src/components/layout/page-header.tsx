import { cn } from "@/lib/utils";

import { Container } from "./container";

type PageHeaderProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

/** Centered header for inner public pages: kicker, statement, one quiet line. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  children,
}: PageHeaderProps) {
  return (
    <header className={cn("bg-background", className)}>
      <Container className="flex flex-col items-center pt-16 pb-12 text-center sm:pt-24 sm:pb-16">
        <div className="flex max-w-3xl flex-col items-center gap-4">
          {eyebrow ? <p className="eyebrow text-foreground">{eyebrow}</p> : null}
          <h1 className="text-section text-foreground sm:text-[3.5rem] sm:leading-[1.07]">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-lead text-muted-foreground">{description}</p>
          ) : null}
          {actions ? (
            <div className="mt-4 flex flex-wrap justify-center gap-3">{actions}</div>
          ) : null}
        </div>
        {children}
      </Container>
    </header>
  );
}
