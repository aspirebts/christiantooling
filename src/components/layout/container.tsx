import { cn } from "@/lib/utils";

/** Horizontally centred page container with responsive gutters. */
export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8", className)} {...props} />
  );
}
