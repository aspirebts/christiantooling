import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/server/site-url";

const PUBLIC_PATHS = [
  "/",
  "/tools",
  "/ideas",
  "/help-build",
  "/our-tools",
  "/about",
  "/donate",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return PUBLIC_PATHS.map((path) => ({
    url: `${siteUrl}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
