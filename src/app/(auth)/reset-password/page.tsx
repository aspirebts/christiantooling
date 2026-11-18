import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false },
};

/** Reached from the recovery email via /auth/confirm, which signs the user in. */
export default function ResetPasswordPage() {
  return (
    <AuthCard title="Choose a new password" description="Enter a new password for your account.">
      <Suspense fallback={<Skeleton className="h-56" />}>
        <ResetPasswordGate />
      </Suspense>
    </AuthCard>
  );
}

async function ResetPasswordGate() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-muted-foreground">
          This password reset link is invalid or has expired. Reset links can only be used once and
          expire after an hour.
        </p>
        <Button asChild size="lg">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return <ResetPasswordForm />;
}
