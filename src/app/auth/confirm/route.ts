import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/env";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * Completes email-based auth flows: sign-up confirmation, password recovery
 * and email change.
 *
 * Supports both link formats:
 *   - token_hash + type (the email templates in supabase/templates; works
 *     across devices and browsers)
 *   - code (PKCE, used by Supabase's default templates; same browser only)
 */

const EMAIL_OTP_TYPES: readonly EmailOtpType[] = [
  "email",
  "signup",
  "recovery",
  "email_change",
  "invite",
  "magiclink",
];

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (EMAIL_OTP_TYPES as readonly string[]).includes(value);
}

function redirect(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.nextUrl.origin));
  // The response may carry session cookies: never let a CDN cache it.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  if (!isSupabaseConfigured()) {
    return redirect(request, "/login?error=auth_unavailable");
  }

  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const code = params.get("code");
  const fallback = type === "recovery" ? "/reset-password" : "/dashboard";
  const next = safeRedirectPath(params.get("next"), fallback);

  const supabase = await createClient();
  let failed = true;

  if (tokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    failed = Boolean(error);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    failed = Boolean(error);
  }

  if (failed) {
    return redirect(request, "/login?error=link_invalid");
  }

  return redirect(request, next);
}
