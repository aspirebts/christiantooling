import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/server/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/auth", "/reset-password", "/design-system"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
