import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { SetupNotice } from "@/components/shared/setup-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your ChristianTooling account.",
};

const ERROR_MESSAGES: Record<string, string> = {
  link_invalid: "That link is invalid or has expired. Please sign in or request a new link.",
  auth_unavailable: "Sign-in is not available in this environment yet.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  const configured = isSupabaseConfigured();

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to submit tools, share ideas and volunteer."
      footer={
        <p>
          New to ChristianTooling?{" "}
          <Link
            href="/register"
            className="font-medium text-ink underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      }
    >
      {configured ? null : <SetupNotice feature="Sign-in" />}
      <Suspense fallback={<FormSkeleton />}>
        <LoginFormWithParams searchParams={searchParams} disabled={!configured} />
      </Suspense>
    </AuthCard>
  );
}

async function LoginFormWithParams({
  searchParams,
  disabled,
}: {
  searchParams: PageProps<"/login">["searchParams"];
  disabled: boolean;
}) {
  const { next, error } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;
  const initialError = typeof error === "string" ? (ERROR_MESSAGES[error] ?? null) : null;

  return <LoginForm next={nextPath} disabled={disabled} initialError={initialError} />;
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
      <Skeleton className="h-11" />
    </div>
  );
}
