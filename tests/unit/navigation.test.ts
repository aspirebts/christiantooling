import { readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { adminNav, dashboardNav, donateNavItem, footerNav, mainNav } from "@/config/navigation";

const APP_DIR = path.resolve(__dirname, "../../src/app");

/** Collects every route served by a page.tsx, ignoring route groups and private folders. */
function collectRoutes(dir: string, segments: string[] = []): Set<string> {
  const routes = new Set<string>();
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry.startsWith("_")) continue; // private folders are not routable
      const isGroup = entry.startsWith("(") && entry.endsWith(")");
      for (const route of collectRoutes(full, isGroup ? segments : [...segments, entry]))
        routes.add(route);
    } else if (entry === "page.tsx") {
      routes.add(`/${segments.join("/")}`);
    }
  }
  return routes;
}

const routes = collectRoutes(APP_DIR);

const allLinks = [
  ...mainNav,
  donateNavItem,
  ...footerNav.flatMap((group) => group.items),
  ...dashboardNav,
  ...adminNav,
].map((item) => item.href.split(/[?#]/)[0]);

describe("navigation", () => {
  it("discovers the application routes", () => {
    expect(routes.has("/")).toBe(true);
    expect(routes.size).toBeGreaterThan(20);
  });

  it.each(allLinks)("links to an existing page: %s", (href) => {
    expect(routes.has(href)).toBe(true);
  });

  it("includes every page required for the foundation", () => {
    for (const required of [
      "/",
      "/tools",
      "/ideas",
      "/help-build",
      "/our-tools",
      "/about",
      "/donate",
      "/login",
      "/register",
      "/dashboard",
      "/admin",
    ]) {
      expect(routes.has(required), required).toBe(true);
    }
  });
});
