import { CircleDashedIcon, DatabaseIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AdminPlaceholderProps = {
  phase: string;
  summary: string;
  capabilities: string[];
  /** Database tables already in place for this module. */
  tables: string[];
};

/**
 * Describes an admin module that is designed (schema, RLS, permissions) but
 * whose management UI arrives in a later phase.
 */
export function AdminPlaceholder({ phase, summary, capabilities, tables }: AdminPlaceholderProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader className="grid-cols-[1fr_auto]">
          <CardTitle>Coming in {phase}</CardTitle>
          <CardDescription>{summary}</CardDescription>
          <Badge
            variant="outline"
            className="col-start-2 row-span-2 row-start-1 self-start border-dashed"
          >
            Planned
          </Badge>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {capabilities.map((capability) => (
              <li key={capability} className="flex gap-3 text-sm text-muted-foreground">
                <CircleDashedIcon
                  className="mt-0.5 size-4 shrink-0 text-highlight"
                  aria-hidden="true"
                />
                {capability}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DatabaseIcon className="size-4 text-highlight" aria-hidden="true" />
            Foundation in place
          </CardTitle>
          <CardDescription>
            Tables, constraints and Row Level Security policies ready for this module.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-2">
            {tables.map((table) => (
              <li key={table}>
                <code className="rounded-md bg-studio-mist px-2 py-1 font-mono text-xs text-ink">
                  {table}
                </code>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
