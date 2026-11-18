"use server";

import { refresh } from "next/cache";

import {
  actionError,
  actionSuccess,
  validationError,
  type ActionResult,
} from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import {
  preferencesSchema,
  profileSchema,
  type PreferencesInput,
  type ProfileInput,
} from "@/lib/validations/account";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/auth";
import { authorizeAction } from "@/server/auth/guards";

const emptyToNull = (value: string) => (value === "" ? null : value);

export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  const auth = await authorizeAction("profile:manage");
  if (!auth.ok) return auth.result;

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { displayName, username, bio, location, websiteUrl } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      username: emptyToNull(username),
      bio: emptyToNull(bio),
      location: emptyToNull(location),
      website_url: emptyToNull(websiteUrl),
    })
    .eq("id", auth.user.id);

  if (error) {
    if (error.code === "23505") {
      return actionError("That username is already taken.", {
        username: "That username is already taken.",
      });
    }
    console.error("[account] Profile update failed", { code: error.code });
    return actionError("We could not save your profile. Please try again.");
  }

  refresh();
  return actionSuccess("Your profile has been saved.");
}

export async function updatePreferences(input: PreferencesInput): Promise<ActionResult> {
  const auth = await authorizeAction("profile:manage");
  if (!auth.ok) return auth.result;

  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const values = {
    email_notifications: parsed.data.emailNotifications,
    newsletter_opt_in: parsed.data.newsletterOptIn,
    timezone: parsed.data.timezone,
  };

  const supabase = await createClient();
  // The signup trigger creates this row; insert only if it is somehow missing.
  // (An upsert would try to SET user_id, which API users may not update.)
  const { data: updated, error: updateError } = await supabase
    .from("account_preferences")
    .update(values)
    .eq("user_id", auth.user.id)
    .select("user_id");

  let error = updateError;
  if (!error && (updated ?? []).length === 0) {
    ({ error } = await supabase
      .from("account_preferences")
      .insert({ user_id: auth.user.id, ...values }));
  }

  if (error) {
    console.error("[account] Preferences update failed", { code: error.code });
    return actionError("We could not save your preferences. Please try again.");
  }

  return actionSuccess("Your preferences have been saved.");
}

export async function changePassword(input: ChangePasswordInput): Promise<ActionResult> {
  const auth = await authorizeAction("profile:manage");
  if (!auth.ok) return auth.result;

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const email = auth.user.email;
  if (!email) {
    return actionError("Password sign-in is not enabled for this account.");
  }

  const supabase = await createClient();

  // Re-verify the current password before allowing a change.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.currentPassword,
  });
  if (verifyError) {
    return actionError("Your current password is incorrect.", {
      currentPassword: "Your current password is incorrect.",
    });
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "weak_password") {
      return actionError("Please choose a stronger password.", {
        password: "This password is too weak or too common.",
      });
    }
    return actionError("We could not change your password. Please try again.");
  }

  return actionSuccess("Your password has been changed.");
}
