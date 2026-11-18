import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-hairline-silver bg-card/60 px-6 py-10 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="flex size-10 items-center justify-center rounded-full bg-studio-mist text-slate">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      ) : null}
      <p className="font-medium text-foreground">{title}</p>
      {description ? (
        <div className="max-w-md text-sm text-muted-foreground">{description}</div>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
