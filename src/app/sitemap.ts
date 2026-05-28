import type { MetadataRoute } from "next";
import { dictionaries, europeLandingPages, locales, siteConfig } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = ["", "/about", "/founder", "/services", "/solutions", "/industries", "/portfolio", "/demo-lab", "/pricing", "/blog", "/contact", "/start-project", "/process", "/privacy", "/terms", "/cookies"];
  const dynamic = locales.flatMap((locale) => {
    const dict = dictionaries[locale];
    return [
      ...dict.services.map((item) => `/services/${item.slug}`),
      ...dict.industries.map((item) => `/industries/${item.slug}`),
      ...dict.caseStudies.map((item) => `/portfolio/${item.slug}`),
      ...dict.blog.map((item) => `/blog/${item.slug}`),
      ...europeLandingPages.map((item) => `/${item.slug}`)
    ].map((path) => ({ url: `${siteConfig.url}/${locale}${path}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 }));
  });
  return [
    ...locales.flatMap((locale) => base.map((path) => ({ url: `${siteConfig.url}/${locale}${path}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.8 }))),
    ...dynamic
  ];
}
