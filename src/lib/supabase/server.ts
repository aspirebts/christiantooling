import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { requireSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers,
 * acting as the signed-in user (Row Level Security applies).
 *
 * Reads cookies(), so with Cache Components it must run inside a <Suspense>
 * boundary or a segment that opts out with `export const instant = false`.
 * Create a new client per request; never share one across requests.
 */
export async function createClient() {
  const { url, publishableKey } = requireSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies. Safe to ignore: the proxy
          // (src/proxy.ts) refreshes sessions and writes cookies on every request.
        }
      },
    },
  });
}
