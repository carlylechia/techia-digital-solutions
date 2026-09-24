import type { MetadataRoute } from "next";
import { siteConfig } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/client-portal", "/client-portal/", "/admin", "/admin/", "/en/admin", "/fr/admin", "/writer", "/writer/", "/preview", "/preview/"] }],
    sitemap: `${siteConfig.url}/sitemap.xml`
  };
}
