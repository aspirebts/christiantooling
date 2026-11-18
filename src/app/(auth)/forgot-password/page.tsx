import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { SetupNotice } from "@/components/shared/setup-notice";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Reset your password",
};

export default function ForgotPasswordPage() {
  const configured = isSupabaseConfigured();

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we will send you a link to choose a new password."
      footer={
        <p>
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-ink underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      {configured ? null : <SetupNotice feature="Password reset" />}
      <ForgotPasswordForm disabled={!configured} />
    </AuthCard>
  );
}
