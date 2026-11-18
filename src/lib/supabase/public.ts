import "server-only";

import { createClient } from "@supabase/supabase-js";

import { requireSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Cookie-less Supabase client for PUBLIC data (Row Level Security as `anon`).
 *
 * Because it never reads cookies it can run inside `"use cache"` functions, so
 * public reference data (categories, technology types, skills) is cached and
 * included in static page shells. Never use it for user-specific data.
 */
export function createPublicClient() {
  const { url, publishableKey } = requireSupabaseConfig();

  return createClient<Database>(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
