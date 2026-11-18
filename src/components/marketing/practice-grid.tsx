import Link from "next/link";
import { ShapesIcon } from "lucide-react";

import { DataIcon } from "@/components/shared/icon-registry";
import { EmptyState } from "@/components/shared/empty-state";
import { SetupNotice } from "@/components/shared/setup-notice";
import { cn } from "@/lib/utils";

export type PracticeGridItem = {
  slug: string;
  name: string;
  description: string;
  icon: string | null;
};

type PracticeGridProps = {
  categories: PracticeGridItem[];
  /** False in safe local mode (no database connected). */
  configured: boolean;
  /** Slug of the currently selected practice, if any. */
  activeSlug?: string;
  limit?: number;
  className?: string;
};

/**
 * Christian practice categories loaded from the database. Each card links to
 * the directory filtered by that practice.
 */
export function PracticeGrid({
  categories,
  configured,
  activeSlug,
  limit,
  className,
}: PracticeGridProps) {
  if (!configured) return <SetupNotice feature="Practice categories" />;

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={ShapesIcon}
        title="Practice categories are being prepared"
        description="Check back soon to browse tools by Christian practice."
      />
    );
  }

  const visible = typeof limit === "number" ? categories.slice(0, limit) : categories;

  return (
    <ul className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {visible.map((category) => {
        const active = category.slug === activeSlug;
        return (
          <li key={category.slug}>
            <Link
              href={`/tools?practice=${encodeURIComponent(category.slug)}#directory`}
              aria-current={active ? "true" : undefined}
              className={cn(
                "group flex h-full flex-col gap-4 rounded-3xl bg-card p-6 transition-colors hover:bg-card/70 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
                active && "ring-2 ring-primary",
              )}
            >
              <DataIcon name={category.icon} className="size-7 text-apple-blue" strokeWidth={1.5} />
              <span className="flex flex-col gap-1">
                <span className="font-display text-[19px] leading-[1.21] font-semibold text-foreground">
                  {category.name}
                </span>
                <span className="line-clamp-2 text-[14px] leading-[1.29] text-muted-foreground">
                  {category.description}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
