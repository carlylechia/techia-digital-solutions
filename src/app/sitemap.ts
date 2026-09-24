import type { MetadataRoute } from "next";
import { DEMO_SLUGS } from "@/content/demo-lab";
import { getPublicAppPath } from "@/lib/site-routes";
import { dictionaries, europeLandingPages, siteConfig } from "@/content/site";
import { getSitemapPosts } from "@/lib/blog/queries";
import { getBlogAuthorPath, getBlogCategoryPath, getBlogIndexPath, getBlogPostPath, type BlogLocale } from "@/lib/blog/slug";

export const revalidate = 300;

function isCmsReplacementSlug(staticSlug: string, locale: BlogLocale, post: { locale: string; slug: string }) {
  if (post.locale !== locale) return false;
  if (post.slug === staticSlug) return true;
  const prefix = `${staticSlug}-`;
  if (!post.slug.startsWith(prefix)) return false;
  const suffix = post.slug.slice(prefix.length);
  return /^\d+$/.test(suffix) && Number(suffix) >= 2;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const base = [
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
    "/contact",
    "/start-project",
    "/process",
    "/ai-consultant",
    "/privacy",
    "/terms",
    "/cookies",
  ];
  const dict = dictionaries.en;
  const dynamic = [
    ...dict.services.map((item) => `/services/${item.slug}`),
    ...dict.industries.map((item) => `/industries/${item.slug}`),
    ...dict.caseStudies.map((item) => `/portfolio/${item.slug}`),
    ...DEMO_SLUGS.map((item) => `/demo-lab/${item}`),
    ...europeLandingPages.map((item) => `/${item.slug}`),
  ].map((path) => ({
    url: `${siteConfig.url}${getPublicAppPath(path)}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const blogIndexEntries: MetadataRoute.Sitemap = [
    { url: `${siteConfig.url}${getBlogIndexPath("en")}`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.url}${getBlogIndexPath("fr")}`, lastModified, changeFrequency: "weekly", priority: 0.8 },
  ];
  const cmsEntries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();
  let cmsPosts: Awaited<ReturnType<typeof getSitemapPosts>> = [];
  try {
    cmsPosts = await getSitemapPosts();
    for (const post of cmsPosts) {
      const locale = post.locale as BlogLocale;
      if (post.canonicalUrl) {
        try {
          if (new URL(post.canonicalUrl).origin !== new URL(siteConfig.url).origin) continue;
        } catch {
          continue;
        }
      }
      const url = `${siteConfig.url}${getBlogPostPath(locale, post.slug)}`;
      if (seen.has(url)) continue;
      seen.add(url);
      cmsEntries.push({ url, lastModified: post.updatedAt || post.publishedAt || lastModified, changeFrequency: "weekly", priority: post.featured ? 0.85 : 0.75 });
      if (post.category) {
        const categoryUrl = `${siteConfig.url}${getBlogCategoryPath(post.category.locale as BlogLocale, post.category.slug)}`;
        if (!seen.has(categoryUrl)) {
          seen.add(categoryUrl);
          cmsEntries.push({ url: categoryUrl, lastModified: post.updatedAt, changeFrequency: "weekly", priority: 0.65 });
        }
      }
      if (post.author) {
        const authorUrl = `${siteConfig.url}${getBlogAuthorPath(locale, post.author.slug)}`;
        if (!seen.has(authorUrl)) {
          seen.add(authorUrl);
          cmsEntries.push({ url: authorUrl, lastModified: post.updatedAt, changeFrequency: "weekly", priority: 0.6 });
        }
      }
    }
  } catch {
    // Sitemap remains useful during a rolling migration or temporary DB issue;
    // the editorial application surfaces the database error to authenticated users.
  }

  const localizedBlog: MetadataRoute.Sitemap = [
    ...blogIndexEntries,
    ...dictionaries.en.blog
      .filter((item) => !cmsPosts.some((post) => isCmsReplacementSlug(item.slug, "en", post)))
      .map((item) => ({ url: `${siteConfig.url}/en/blog/${item.slug}`, lastModified, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...dictionaries.fr.blog
      .filter((item) => !cmsPosts.some((post) => isCmsReplacementSlug(item.slug, "fr", post)))
      .map((item) => ({ url: `${siteConfig.url}/fr/blog/${item.slug}`, lastModified, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];

  return [
    { url: `${siteConfig.url}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    ...localizedBlog,
    ...base.map((path) => ({ url: `${siteConfig.url}${getPublicAppPath(path)}`, lastModified, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...dynamic,
    ...cmsEntries,
  ];
}
