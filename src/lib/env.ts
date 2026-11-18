import { z } from "zod";

/**
 * Typed access to public environment variables.
 *
 * Next.js only inlines NEXT_PUBLIC_* values into browser bundles when they are
 * referenced literally (process.env.NEXT_PUBLIC_X), so each one is read
 * explicitly below. Blank values are treated as unset so the committed
 * .env.example works as-is.
 *
 * When Supabase variables are missing the app runs in SAFE LOCAL MODE: public
 * pages render, authentication is disabled (never faked), and no requests are
 * made to Supabase. See README.md.
 */

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const httpUrl = z.url({ protocol: /^https?$/ }).transform((value) => value.replace(/\/+$/, ""));

const publicEnvSchema = z
  .object({
    supabaseUrl: z.preprocess(blankToUndefined, httpUrl.optional()),
    supabasePublishableKey: z.preprocess(blankToUndefined, z.string().min(20).optional()),
    siteUrl: z.preprocess(blankToUndefined, httpUrl.optional()),
  })
  .superRefine((value, ctx) => {
    const hasUrl = value.supabaseUrl !== undefined;
    const hasKey = value.supabasePublishableKey !== undefined;
    if (hasUrl !== hasKey) {
      ctx.addIssue({
        code: "custom",
        path: [hasUrl ? "supabasePublishableKey" : "supabaseUrl"],
        message:
          "Set both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or leave both blank for safe local mode.",
      });
    }
  });

export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

export type PublicEnv = {
  /** Supabase connection details, or null in safe local mode. */
  supabase: SupabasePublicConfig | null;
  /** Explicit NEXT_PUBLIC_SITE_URL, if provided. Prefer getSiteUrl() on the server. */
  siteUrl: string | undefined;
};

type RawPublicEnv = {
  supabaseUrl: string | undefined;
  supabasePublishableKey: string | undefined;
  siteUrl: string | undefined;
};

/** Parses raw values; exported for unit tests. Throws on misconfiguration. */
export function parsePublicEnv(raw: RawPublicEnv): PublicEnv {
  const result = publicEnvSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration. ${details}`);
  }

  const { supabaseUrl, supabasePublishableKey, siteUrl } = result.data;
  return {
    supabase:
      supabaseUrl && supabasePublishableKey
        ? { url: supabaseUrl, publishableKey: supabasePublishableKey }
        : null,
    siteUrl,
  };
}

export const publicEnv: PublicEnv = parsePublicEnv({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  // Prefer the publishable key; fall back to a legacy anon key if that is all a project has.
  supabasePublishableKey:
    blankToUndefined(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) === undefined
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
});

/** True when Supabase credentials are present (auth and data are available). */
export function isSupabaseConfigured(): boolean {
  return publicEnv.supabase !== null;
}

/**
 * Returns the Supabase config or throws. Call only after checking
 * isSupabaseConfigured(), e.g. inside code paths that require authentication.
 */
export function requireSupabaseConfig(): SupabasePublicConfig {
  if (!publicEnv.supabase) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return publicEnv.supabase;
}
