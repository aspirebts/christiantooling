"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import { resendVerificationEmail } from "@/server/actions/auth";

/** Lets someone request a fresh confirmation email after signing up. */
export function ResendVerification({ email }: { email: string }) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        type="button"
        variant="link"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setResult(await resendVerificationEmail({ email }));
          })
        }
      >
        {isPending ? "Sending…" : "Resend confirmation email"}
      </Button>
      {result ? (
        <p
          role="status"
          className={result.ok ? "text-sm text-success" : "text-sm text-destructive"}
        >
          {result.ok ? result.message : result.error}
        </p>
      ) : null}
    </div>
  );
}
