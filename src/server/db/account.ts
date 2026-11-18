import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth/guards";
import type { Tables } from "@/types/database.types";

/*
 * Data for the signed-in user's own account. Each function resolves the user
 * itself (no user id parameter), so callers can never request someone else's
 * data. RLS enforces the same rule in the database.
 */

export type MyProfile = Pick<
  Tables<"profiles">,
  | "display_name"
  | "username"
  | "bio"
  | "location"
  | "website_url"
  | "avatar_url"
  | "status"
  | "created_at"
>;

export type MyPreferences = Pick<
  Tables<"account_preferences">,
  "email_notifications" | "newsletter_opt_in" | "timezone"
>;

export async function getMyProfile(): Promise<MyProfile | null> {
  const user = await requireUser("/dashboard/profile");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, username, bio, location, website_url, avatar_url, status, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(`Could not load your profile (${error.code}).`);
  return data;
}

export async function getMyPreferences(): Promise<MyPreferences> {
  const user = await requireUser("/dashboard/settings");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("account_preferences")
    .select("email_notifications, newsletter_opt_in, timezone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(`Could not load your preferences (${error.code}).`);
  return data ?? { email_notifications: true, newsletter_opt_in: false, timezone: "UTC" };
}
