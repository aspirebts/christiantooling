import { describe, expect, it } from "vitest";

import { parsePublicEnv } from "./env";

const KEY = "sb_publishable_test_key_1234567890";

describe("parsePublicEnv", () => {
  it("runs in safe local mode when Supabase variables are blank", () => {
    expect(parsePublicEnv({ supabaseUrl: "", supabasePublishableKey: "  ", siteUrl: "" })).toEqual({
      supabase: null,
      siteUrl: undefined,
    });
    expect(
      parsePublicEnv({
        supabaseUrl: undefined,
        supabasePublishableKey: undefined,
        siteUrl: undefined,
      }).supabase,
    ).toBeNull();
  });

  it("returns Supabase config when both values are present", () => {
    const env = parsePublicEnv({
      supabaseUrl: "https://abc.supabase.co/",
      supabasePublishableKey: KEY,
      siteUrl: "https://christiantooling.org/",
    });
    expect(env.supabase).toEqual({ url: "https://abc.supabase.co", publishableKey: KEY });
    expect(env.siteUrl).toBe("https://christiantooling.org");
  });

  it("rejects a half-configured project instead of silently disabling auth", () => {
    expect(() =>
      parsePublicEnv({
        supabaseUrl: "https://abc.supabase.co",
        supabasePublishableKey: "",
        siteUrl: undefined,
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
    expect(() =>
      parsePublicEnv({ supabaseUrl: "", supabasePublishableKey: KEY, siteUrl: undefined }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("rejects invalid URLs", () => {
    expect(() =>
      parsePublicEnv({ supabaseUrl: "not a url", supabasePublishableKey: KEY, siteUrl: undefined }),
    ).toThrow(/Invalid environment configuration/);
    expect(() =>
      parsePublicEnv({
        supabaseUrl: "ftp://abc.supabase.co",
        supabasePublishableKey: KEY,
        siteUrl: undefined,
      }),
    ).toThrow();
  });
});
