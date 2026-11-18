import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Styled native <select>. Preferred over custom listboxes for long option lists
 * (time zones, languages): it is accessible, type-to-search and mobile-native.
 */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div data-slot="native-select-wrapper" className="relative">
      <select
        data-slot="native-select"
        className={cn(
          "flex h-10 w-full appearance-none rounded-xl border border-input bg-card py-2 pr-9 pl-3 text-base transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

export { NativeSelect };
