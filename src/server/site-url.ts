import "server-only";

import { publicEnv } from "@/lib/env";

/**
 * Canonical site URL for auth email links and metadata.
 *
 * Deliberately derived from configuration, never from request headers: a
 * spoofed Host header must not be able to redirect password-reset links to
 * another domain. Order: NEXT_PUBLIC_SITE_URL, then Vercel's system variables
 * (production domain, then the deployment URL for previews), then localhost.
 */
export function getSiteUrl(): string {
  if (publicEnv.siteUrl) return publicEnv.siteUrl;

  const productionHost =
    process.env.VERCEL_ENV === "production" ? process.env.VERCEL_PROJECT_PRODUCTION_URL : undefined;
  const host = productionHost || process.env.VERCEL_URL;
  if (host) return `https://${host}`;

  return "http://localhost:3000";
}

/** Absolute URL for an in-app path, e.g. absoluteUrl("/auth/confirm"). */
export function absoluteUrl(path: string): string {
  return new URL(path, getSiteUrl()).toString();
}
