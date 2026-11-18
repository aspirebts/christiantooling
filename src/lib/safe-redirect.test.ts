import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it("allows same-origin paths with query strings and fragments", () => {
    expect(safeRedirectPath("/admin")).toBe("/admin");
    expect(safeRedirectPath("/admin/users?q=mary#top")).toBe("/admin/users?q=mary#top");
  });

  it("falls back for missing values", () => {
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath("")).toBe("/dashboard");
    expect(safeRedirectPath(undefined, "/")).toBe("/");
  });

  it.each([
    "https://evil.example",
    "http://evil.example/path",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "evil.example",
    "%2F%2Fevil.example",
    "/%2F%2Fevil.example",
    "/%5Cevil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "%E0%A4%A",
  ])("rejects open-redirect attempt %j", (attempt) => {
    expect(safeRedirectPath(attempt)).toBe("/dashboard");
  });

  it("rejects absurdly long values", () => {
    expect(safeRedirectPath(`/${"a".repeat(5000)}`)).toBe("/dashboard");
  });
});
