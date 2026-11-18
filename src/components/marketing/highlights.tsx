import Link from "next/link";

import { cn } from "@/lib/utils";

export type Highlight = {
  title: string;
  linkLabel: string;
  href: string;
  art: React.ReactNode;
};

/**
 * Highlights stage: large white 28px cards in a horizontally scrolling row.
 * Pure CSS scroll-snap (keyboard reachable, no script). Device art crops off
 * the bottom edge so the hardware, not UI chrome, is the picture.
 */
export function HighlightsCarousel({ items, label }: { items: Highlight[]; label: string }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="-mx-4 no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    >
      {items.map((item, index) => (
        <article
          key={item.title}
          className={cn(
            "relative flex h-[34rem] w-[min(86vw,32rem)] shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-card px-8 pt-9 sm:h-[38rem]",
          )}
          aria-label={`${index + 1} of ${items.length}: ${item.title}`}
        >
          <h3 className="max-w-[14ch] text-feature text-foreground">{item.title}</h3>
          <Link
            href={item.href}
            className="mt-3 inline-flex w-fit items-center text-[17px] tracking-[-0.374px] text-apple-blue hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            {item.linkLabel} ›
          </Link>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto w-[15rem] translate-y-[14%] sm:w-[16.5rem]">
            {item.art}
          </div>
        </article>
      ))}
    </div>
  );
}
