"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-destructive-muted text-destructive">
          <TriangleAlertIcon className="size-7" aria-hidden="true" />
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Something went wrong</h1>
        <p className="text-muted-foreground">
          An unexpected error occurred. Please try again. If the problem continues, let the
          ChristianTooling team know.
        </p>
        {error.digest ? (
          <p className="font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/">Go to the homepage</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
