import type { MetadataRoute } from "next";
import { siteConfig } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/client-portal", "/client-portal/", "/en/admin", "/fr/admin"] }],
    sitemap: `${siteConfig.url}/sitemap.xml`
  };
}
