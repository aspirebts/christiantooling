import { describe, expect, it } from "vitest";

import {
  ASSIGNABLE_ROLES,
  canManageRole,
  hasMinRole,
  isAssignableRole,
  resolveEffectiveRole,
  ROLE_RANK,
  ROLES,
} from "./roles";

describe("role hierarchy", () => {
  it("matches the ranks stored in public.roles", () => {
    // Keep in sync with supabase/migrations/20261118100100_identity_and_access.sql
    // (asserted on the database side by supabase/tests/database/00_schema_security.test.sql).
    expect(ROLE_RANK).toEqual({
      visitor: 0,
      registered_user: 10,
      contributor: 20,
      administrator: 30,
      super_administrator: 40,
    });
  });

  it("lists roles from lowest to highest rank", () => {
    const ranks = ROLES.map((role) => ROLE_RANK[role]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it("treats higher roles as including lower ones", () => {
    expect(hasMinRole("super_administrator", "administrator")).toBe(true);
    expect(hasMinRole("administrator", "contributor")).toBe(true);
    expect(hasMinRole("contributor", "registered_user")).toBe(true);
    expect(hasMinRole("registered_user", "contributor")).toBe(false);
    expect(hasMinRole("visitor", "registered_user")).toBe(false);
  });

  it("only allows elevated roles to be assigned", () => {
    expect(ASSIGNABLE_ROLES).toEqual(["contributor", "administrator", "super_administrator"]);
    expect(isAssignableRole("visitor")).toBe(false);
    expect(isAssignableRole("registered_user")).toBe(false);
    expect(isAssignableRole("administrator")).toBe(true);
  });
});

describe("resolveEffectiveRole", () => {
  it("returns visitor when signed out", () => {
    expect(
      resolveEffectiveRole({
        isAuthenticated: false,
        isActive: true,
        grantedRoles: ["administrator"],
      }),
    ).toBe("visitor");
  });

  it("returns registered_user for an active member with no granted roles", () => {
    expect(resolveEffectiveRole({ isAuthenticated: true, isActive: true, grantedRoles: [] })).toBe(
      "registered_user",
    );
  });

  it("returns the highest granted role", () => {
    expect(
      resolveEffectiveRole({
        isAuthenticated: true,
        isActive: true,
        grantedRoles: ["contributor", "super_administrator", "administrator"],
      }),
    ).toBe("super_administrator");
  });

  it("ignores unknown or implicit role values", () => {
    expect(
      resolveEffectiveRole({
        isAuthenticated: true,
        isActive: true,
        grantedRoles: ["owner", "visitor", "contributor"],
      }),
    ).toBe("contributor");
  });

  it("treats suspended accounts as visitors (fails closed)", () => {
    expect(
      resolveEffectiveRole({
        isAuthenticated: true,
        isActive: false,
        grantedRoles: ["super_administrator"],
      }),
    ).toBe("visitor");
  });
});

describe("canManageRole", () => {
  it("lets super administrators manage every role", () => {
    for (const role of ASSIGNABLE_ROLES) {
      expect(canManageRole("super_administrator", role)).toBe(true);
    }
  });

  it("lets administrators manage only the contributor role", () => {
    expect(canManageRole("administrator", "contributor")).toBe(true);
    expect(canManageRole("administrator", "administrator")).toBe(false);
    expect(canManageRole("administrator", "super_administrator")).toBe(false);
  });

  it("denies everyone else", () => {
    for (const actor of ["visitor", "registered_user", "contributor"] as const) {
      for (const role of ASSIGNABLE_ROLES) {
        expect(canManageRole(actor, role)).toBe(false);
      }
    }
  });
});
