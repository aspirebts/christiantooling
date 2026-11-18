import { z } from "zod";

/**
 * Profile and preference schemas. Limits mirror the database constraints on
 * public.profiles and public.account_preferences so users see friendly
 * messages before Postgres would reject the data.
 */

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/;

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter a display name.")
    .max(80, "Display name must be 80 characters or fewer."),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (value) => value === "" || USERNAME_PATTERN.test(value),
      "Use 3-30 lowercase letters, numbers, hyphens or underscores, starting and ending with a letter or number.",
    ),
  bio: optionalText(1000, "Bio"),
  location: optionalText(100, "Location"),
  websiteUrl: z
    .string()
    .trim()
    .max(2048, "URL is too long.")
    .refine(
      (value) => value === "" || /^https?:\/\/\S+$/i.test(value),
      "Enter a full URL starting with https://",
    ),
});

export type ProfileInput = z.infer<typeof profileSchema>;

/** Valid IANA time zones in the current runtime (Node 22 and modern browsers). */
export function getSupportedTimeZones(): string[] {
  const zones = Intl.supportedValuesOf("timeZone");
  return zones.includes("UTC") ? zones : ["UTC", ...zones];
}

export const preferencesSchema = z.object({
  emailNotifications: z.boolean(),
  newsletterOptIn: z.boolean(),
  timezone: z
    .string()
    .min(1, "Choose a time zone.")
    .max(64)
    .refine((value) => getSupportedTimeZones().includes(value), "Choose a valid time zone."),
});

export type PreferencesInput = z.infer<typeof preferencesSchema>;
