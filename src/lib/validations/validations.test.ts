import { describe, expect, it } from "vitest";

import { validationError } from "@/lib/action-result";

import { preferencesSchema, profileSchema } from "./account";
import { accountStatusSchema, roleChangeSchema, sanitizeSearchTerm } from "./admin";
import { changePasswordSchema, loginSchema, passwordSchema, registerSchema } from "./auth";

describe("auth schemas", () => {
  it("enforces the password policy configured in Supabase", () => {
    expect(passwordSchema.safeParse("short1").success).toBe(false);
    expect(passwordSchema.safeParse("allletters").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
    expect(passwordSchema.safeParse("a".repeat(72) + "1").success).toBe(false);
    expect(passwordSchema.safeParse("faithful1").success).toBe(true);
  });

  it("normalises and validates email addresses", () => {
    const parsed = loginSchema.parse({ email: "  mary@example.org ", password: "x" });
    expect(parsed.email).toBe("mary@example.org");
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });

  it("requires matching password confirmation on registration", () => {
    const result = registerSchema.safeParse({
      displayName: "Mary",
      email: "mary@example.org",
      password: "faithful1",
      confirmPassword: "faithful2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(validationError(result.error)).toMatchObject({
        ok: false,
        fieldErrors: { confirmPassword: "Passwords do not match." },
      });
    }
  });

  it("rejects reusing the current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "faithful1",
      password: "faithful1",
      confirmPassword: "faithful1",
    });
    expect(result.success).toBe(false);
  });
});

describe("profile schema", () => {
  const valid = { displayName: "Mary", username: "", bio: "", location: "", websiteUrl: "" };

  it("accepts optional fields left blank", () => {
    expect(profileSchema.safeParse(valid).success).toBe(true);
  });

  it("lowercases usernames and enforces the database format", () => {
    expect(profileSchema.parse({ ...valid, username: "Mary-Builds" }).username).toBe("mary-builds");
    expect(profileSchema.safeParse({ ...valid, username: "ab" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...valid, username: "-mary" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...valid, username: "mary builds" }).success).toBe(false);
  });

  it("only accepts http(s) website URLs", () => {
    expect(profileSchema.safeParse({ ...valid, websiteUrl: "https://example.org" }).success).toBe(
      true,
    );
    expect(profileSchema.safeParse({ ...valid, websiteUrl: "javascript:alert(1)" }).success).toBe(
      false,
    );
    expect(profileSchema.safeParse({ ...valid, websiteUrl: "example.org" }).success).toBe(false);
  });

  it("enforces the display name length limit", () => {
    expect(profileSchema.safeParse({ ...valid, displayName: "x".repeat(81) }).success).toBe(false);
    expect(profileSchema.safeParse({ ...valid, displayName: "   " }).success).toBe(false);
  });
});

describe("preferences schema", () => {
  it("accepts real IANA time zones only", () => {
    const base = { emailNotifications: true, newsletterOptIn: false };
    expect(preferencesSchema.safeParse({ ...base, timezone: "Africa/Lagos" }).success).toBe(true);
    expect(preferencesSchema.safeParse({ ...base, timezone: "UTC" }).success).toBe(true);
    expect(preferencesSchema.safeParse({ ...base, timezone: "Mars/Olympus_Mons" }).success).toBe(
      false,
    );
  });
});

describe("admin schemas", () => {
  it("only allows assignable roles to be granted", () => {
    const userId = "0195f0a0-0000-7000-8000-000000000001";
    expect(roleChangeSchema.safeParse({ userId, role: "contributor" }).success).toBe(true);
    expect(roleChangeSchema.safeParse({ userId, role: "registered_user" }).success).toBe(false);
    expect(roleChangeSchema.safeParse({ userId: "not-a-uuid", role: "contributor" }).success).toBe(
      false,
    );
    expect(accountStatusSchema.safeParse({ userId, status: "deactivated" }).success).toBe(false);
  });

  it("strips characters that could alter a PostgREST filter", () => {
    expect(sanitizeSearchTerm("mary),id.eq.1")).toBe("maryid.eq.1");
    expect(sanitizeSearchTerm("  O'Brien (admin)  ")).toBe("OBrien admin");
    expect(sanitizeSearchTerm("José")).toBe("José");
    expect(sanitizeSearchTerm(undefined)).toBe("");
    expect(sanitizeSearchTerm("x".repeat(200))).toHaveLength(80);
  });
});
