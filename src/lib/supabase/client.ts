import { createBrowserClient } from "@supabase/ssr";

import { requireSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Supabase client for Client Components (realtime, client-side uploads).
 * createBrowserClient is a singleton, so calling this repeatedly is cheap.
 * Never use it for authorization decisions: the server is the source of truth.
 */
export function createClient() {
  const { url, publishableKey } = requireSupabaseConfig();
  return createBrowserClient<Database>(url, publishableKey);
}
