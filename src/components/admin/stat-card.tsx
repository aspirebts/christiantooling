import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: number | null;
  icon: LucideIcon;
  href?: string;
  hint?: string;
};

const numberFormat = new Intl.NumberFormat("en");

/** Headline metric. A null value means the count is unavailable. */
export function StatCard({ label, value, icon: Icon, href, hint }: StatCardProps) {
  const body = (
    <Card className="h-full gap-0 py-5 transition-shadow">
      <CardContent className="flex flex-col gap-3 px-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <Icon className="size-4 text-highlight" aria-hidden="true" />
        </div>
        <p className="text-3xl font-semibold tracking-tight text-ink tabular-nums">
          {value === null ? <span aria-label="Unavailable">—</span> : numberFormat.format(value)}
        </p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );

  if (!href) return body;

  return (
    <Link
      href={href}
      className="group block rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {body}
    </Link>
  );
}
