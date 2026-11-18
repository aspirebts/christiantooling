import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";
import { safeRedirectPath } from "@/lib/safe-redirect";
import type { Database } from "@/types/database.types";

/** Paths that require a signed-in user. Page guards enforce this too. */
const PROTECTED_PREFIXES = ["/dashboard", "/admin"] as const;

/** Paths signed-in users have no reason to see. */
const GUEST_ONLY_PATHS = new Set(["/login", "/register", "/forgot-password"]);

const CACHE_HEADERS = ["cache-control", "expires", "pragma"] as const;

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Builds a redirect that carries over refreshed auth cookies and cache headers. */
function redirectPreservingSession(destination: URL, sessionResponse: NextResponse) {
  const redirect = NextResponse.redirect(destination);
  for (const cookie of sessionResponse.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  for (const header of CACHE_HEADERS) {
    const value = sessionResponse.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }
  return redirect;
}

/**
 * Refreshes the Supabase session on every request and applies coarse route
 * gating. This is a UX layer only: authorization is enforced again in server
 * guards, Server Actions and Postgres Row Level Security.
 */
export async function updateSession(request: NextRequest) {
  // Safe local mode: nothing to refresh. Page guards send visitors to /login,
  // which explains how to configure Supabase.
  if (!publicEnv.supabase) {
    return NextResponse.next({ request });
  }

  const { url, publishableKey } = publicEnv.supabase;
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Prevents CDNs from caching a response that carries a session cookie.
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  // Do not add code between createServerClient and getClaims(): getClaims()
  // validates the JWT signature and triggers the refresh that keeps users
  // signed in.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims?.sub);

  const { pathname, search } = request.nextUrl;

  if (!isSignedIn && PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return redirectPreservingSession(loginUrl, response);
  }

  if (isSignedIn && GUEST_ONLY_PATHS.has(pathname)) {
    const destination = new URL(
      safeRedirectPath(request.nextUrl.searchParams.get("next")),
      request.nextUrl.origin,
    );
    return redirectPreservingSession(destination, response);
  }

  return response;
}
