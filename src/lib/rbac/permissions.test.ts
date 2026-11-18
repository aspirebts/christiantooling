import { describe, expect, it } from "vitest";

import { adminNav, dashboardNav } from "@/config/navigation";

import { can, PERMISSIONS, type Permission } from "./permissions";
import { isRole } from "./roles";

describe("permissions", () => {
  it("maps every permission to a valid role", () => {
    for (const [permission, role] of Object.entries(PERMISSIONS)) {
      expect(isRole(role), `${permission} -> ${role}`).toBe(true);
    }
  });

  it("lets visitors browse but not participate", () => {
    expect(can("visitor", "content:browse")).toBe(true);
    expect(can("visitor", "tools:submit")).toBe(false);
    expect(can("visitor", "ideas:vote")).toBe(false);
  });

  it("lets registered users participate", () => {
    const participation: Permission[] = [
      "tools:submit",
      "ideas:submit",
      "ideas:vote",
      "ideas:comment",
      "volunteer:apply",
    ];
    for (const permission of participation) {
      expect(can("registered_user", permission)).toBe(true);
    }
    expect(can("registered_user", "projects:apply")).toBe(false);
  });

  it("lets contributors apply to projects but not administer", () => {
    expect(can("contributor", "projects:apply")).toBe(true);
    expect(can("contributor", "admin:access")).toBe(false);
  });

  it("lets administrators manage submissions, users and projects", () => {
    const adminPermissions: Permission[] = [
      "admin:access",
      "submissions:review",
      "users:view",
      "users:suspend",
      "projects:manage",
      "roles:grant-contributor",
    ];
    for (const permission of adminPermissions) {
      expect(can("administrator", permission)).toBe(true);
    }
    expect(can("administrator", "roles:grant-administrator")).toBe(false);
    expect(can("administrator", "settings:manage")).toBe(false);
  });

  it("gives super administrators every permission", () => {
    for (const permission of Object.keys(PERMISSIONS) as Permission[]) {
      expect(can("super_administrator", permission)).toBe(true);
    }
  });

  it("protects every admin navigation item with an admin-level permission", () => {
    for (const item of adminNav) {
      expect(item.permission, item.href).toBeDefined();
      expect(can("contributor", item.permission!), item.href).toBe(false);
      expect(can("super_administrator", item.permission!), item.href).toBe(true);
    }
  });

  it("does not gate member dashboard items behind admin permissions", () => {
    for (const item of dashboardNav) {
      if (item.permission) expect(can("registered_user", item.permission)).toBe(true);
    }
  });
});
