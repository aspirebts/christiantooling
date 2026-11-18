"use server";

import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";

import {
  actionError,
  actionSuccess,
  validationError,
  type ActionResult,
} from "@/lib/action-result";
import { isSupabaseConfigured } from "@/lib/env";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResendVerificationInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import { getCurrentUser } from "@/server/auth/session";
import { absoluteUrl } from "@/server/site-url";

/*
 * Authentication Server Actions. Account enumeration is avoided throughout:
 * sign-in failures share one message, and password reset / resend requests
 * always report success.
 */

const AUTH_UNAVAILABLE =
  "Sign-in is not available yet: Supabase is not configured for this environment.";

function isRateLimited(error: AuthError) {
  return (
    error.status === 429 ||
    error.code === "over_request_rate_limit" ||
    error.code === "over_email_send_rate_limit"
  );
}

const RATE_LIMITED = "Too many attempts. Please wait a few minutes and try again.";

export async function signIn(input: LoginInput, next?: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return actionError(AUTH_UNAVAILABLE);

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (isRateLimited(error)) return actionError(RATE_LIMITED);
    if (error.code === "email_not_confirmed") {
      return actionError(
        "Please confirm your email address first. Check your inbox for the confirmation link.",
      );
    }
    return actionError("Incorrect email or password.");
  }

  redirect(safeRedirectPath(next));
}

export async function signUp(
  input: RegisterInput,
): Promise<ActionResult<{ needsEmailConfirmation: boolean }>> {
  if (!isSupabaseConfigured()) return actionError(AUTH_UNAVAILABLE);

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { email, password, displayName } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: absoluteUrl("/auth/confirm?next=/dashboard"),
      // Display name only: user metadata is user-editable and is never used for authorization.
      data: { display_name: displayName },
    },
  });

  if (error) {
    if (isRateLimited(error)) return actionError(RATE_LIMITED);
    if (error.code === "weak_password") {
      return actionError("Please choose a stronger password.", {
        password: "This password is too weak or too common.",
      });
    }
    return actionError(
      "We could not create an account with those details. If you already have an account, sign in or reset your password.",
    );
  }

  // Projects with email confirmation disabled return a session immediately.
  if (data.session) redirect("/dashboard");

  return actionSuccess("Check your inbox to confirm your email address.", {
    needsEmailConfirmation: true,
  });
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return actionError(AUTH_UNAVAILABLE);

  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: absoluteUrl("/auth/confirm?next=/reset-password"),
  });

  if (error && isRateLimited(error)) return actionError(RATE_LIMITED);
  if (error) console.error("[auth] Password reset request failed", { code: error.code });

  return actionSuccess(
    "If an account exists for that email, we have sent a link to reset your password.",
  );
}

/** Sets a new password for a user who arrived through a recovery link. */
export async function updatePassword(input: ResetPasswordInput): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return actionError(AUTH_UNAVAILABLE);

  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const user = await getCurrentUser();
  if (!user) {
    return actionError("Your reset link has expired. Please request a new one.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    if (isRateLimited(error)) return actionError(RATE_LIMITED);
    if (error.code === "same_password") {
      return actionError("Choose a password different from your current one.", {
        password: "Choose a password different from your current one.",
      });
    }
    if (error.code === "weak_password") {
      return actionError("Please choose a stronger password.", {
        password: "This password is too weak or too common.",
      });
    }
    return actionError("We could not update your password. Please try again.");
  }

  return actionSuccess("Your password has been updated.");
}

export async function resendVerificationEmail(
  input: ResendVerificationInput,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return actionError(AUTH_UNAVAILABLE);

  const parsed = resendVerificationSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: absoluteUrl("/auth/confirm?next=/dashboard") },
  });

  if (error && isRateLimited(error)) return actionError(RATE_LIMITED);
  if (error) console.error("[auth] Resend verification failed", { code: error.code });

  return actionSuccess("If that address is waiting for confirmation, we have sent a new link.");
}
