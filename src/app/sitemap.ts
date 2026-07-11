import type { MetadataRoute } from "next";
import { DEMO_SLUGS } from "@/content/demo-lab";
import { getLocalizedAppPath } from "@/lib/site-routes";
import {
  dictionaries,
  europeLandingPages,
  locales,
  siteConfig,
} from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const base = [
    "",
    "/about",
    "/founder",
    "/services",
    "/demo-lab",
    "/courses",
    "/courses/bonuses",
    "/courses/claim-bonus",
    "/courses/complete-digital-skills-pack",
    "/courses/digital-marketing-online-business",
    "/courses/creative-design-content-creation",
    "/courses/ai-tech-programming",
    "/courses/office-business-professional-skills",
    "/courses/finance-market-education",
    "/pricing",
    "/blog",
    "/contact",
    "/start-project",
    "/process",
    "/ai-consultant",
    "/privacy",
    "/terms",
    "/cookies",
  ];
  const dynamic = locales.flatMap((locale) => {
    const dict = dictionaries[locale];
    return [
      ...dict.services.map((item) => `/services/${item.slug}`),
      ...dict.solutions.map((item) => `/solutions/${item.slug}`),
      ...dict.industries.map((item) => `/industries/${item.slug}`),
      ...dict.caseStudies.map((item) => `/portfolio/${item.slug}`),
      ...dict.blog.map((item) => `/blog/${item.slug}`),
      ...DEMO_SLUGS.map((item) => `/demo-lab/${item}`),
      ...europeLandingPages.map((item) => `/${item.slug}`),
    ].map((path) => ({
      url: `${siteConfig.url}${getLocalizedAppPath(locale, path)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  });
  return [
    {
      url: `${siteConfig.url}/`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    ...locales.flatMap((locale) =>
      base.map((path) => ({
        url: `${siteConfig.url}${getLocalizedAppPath(locale, path)}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority: path === "" ? 1 : 0.8,
      })),
    ),
    ...dynamic,
  ];
}
