import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { SetupNotice } from "@/components/shared/setup-notice";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Join ChristianTooling to submit tools, share ideas and volunteer on projects.",
};

export default function RegisterPage() {
  const configured = isSupabaseConfigured();

  return (
    <AuthCard
      title="Create your account"
      description="Join a community building technology that helps Christians live their faith."
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-ink underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {configured ? null : <SetupNotice feature="Registration" />}
      <RegisterForm disabled={!configured} />
    </AuthCard>
  );
}
