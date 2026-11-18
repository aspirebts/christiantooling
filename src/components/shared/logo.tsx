import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoMarkProps = { className?: string };

/** The ChristianTooling mark: a cross with a blue "pixel" for technology. */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn("size-7", className)}>
      <rect width="32" height="32" rx="8" className="fill-ink" />
      <rect x="13.25" y="6.5" width="3.5" height="19" rx="1.75" className="fill-white" />
      <rect x="8" y="11" width="14" height="3.5" rx="1.75" className="fill-white" />
      <rect x="21" y="19.5" width="4" height="4" rx="1.25" fill="#2997ff" />
    </svg>
  );
}

type LogoProps = {
  className?: string;
  href?: string;
};

export function Logo({ className, href = "/" }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
        className,
      )}
      aria-label="ChristianTooling home"
    >
      <LogoMark />
      <span className="font-display text-[17px] font-semibold tracking-[-0.02em] text-foreground">
        ChristianTooling
      </span>
    </Link>
  );
}
