import { connection } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";

/**
 * Liveness check for uptime monitors: GET /api/health.
 * Exposes no secrets or internals beyond whether Supabase is configured.
 */
export async function GET() {
  // Render per request; otherwise Cache Components would prerender a static response.
  await connection();

  return Response.json(
    {
      status: "ok",
      supabase: isSupabaseConfigured() ? "configured" : "not_configured",
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
