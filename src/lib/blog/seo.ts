import type { Metadata } from "next";
import { logoAssets } from "@/components/brand/logo-assets";
import { siteConfig, type Locale } from "@/content/site";
import { getBlogAuthorPath, getBlogCategoryPath, getBlogPostPath, type BlogLocale } from "./slug";

type PublicPost = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  locale: BlogLocale;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  ogImageUrl: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  allowIndex?: boolean;
  nofollow?: boolean;
  author: {
    displayName: string;
    slug: string;
  } | null;
  category: { name: string; slug: string } | null;
  tags: Array<{ tag: { name: string } }>;
  translationGroup?: { posts: Array<{ locale: BlogLocale; slug: string }> } | null;
};

function absolute(path: string) {
  return `${siteConfig.url}${path}`;
}

function defaultLanguage(locale: BlogLocale) {
  return locale === "fr" ? "fr-FR" : "en-US";
}

export function buildArticleMetadata(locale: Locale, post: PublicPost): Metadata {
  const blogLocale: BlogLocale = locale;
  const canonical = post.canonicalUrl || absolute(getBlogPostPath(blogLocale, post.slug));
  const description = post.seoDescription?.trim() || post.excerpt;
  const title = post.seoTitle?.trim() || post.title;
  const image = post.ogImageUrl || post.featuredImageUrl || "/og/og-default.svg";
  const translations = post.translationGroup?.posts.length
    ? post.translationGroup.posts
    : [{ locale: blogLocale, slug: post.slug }];
  const languageAlternates: Record<string, string> = {};

  for (const translation of translations) {
    languageAlternates[defaultLanguage(translation.locale)] = absolute(
      getBlogPostPath(translation.locale, translation.slug),
    );
  }
  languageAlternates["x-default"] = languageAlternates["en-US"] || canonical;

  const authorUrl = post.author ? absolute(getBlogAuthorPath(blogLocale, post.author.slug)) : undefined;

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    authors: authorUrl ? [{ name: post.author?.displayName, url: authorUrl }] : undefined,
    alternates: {
      canonical,
      languages: languageAlternates,
    },
    robots: {
      index: post.allowIndex ?? true,
      follow: !(post.nofollow ?? false),
      googleBot: {
        index: post.allowIndex ?? true,
        follow: !(post.nofollow ?? false),
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      locale: defaultLanguage(blogLocale),
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: authorUrl ? [authorUrl] : undefined,
      section: post.category?.name,
      tags: post.tags.map(({ tag }) => tag.name),
      images: [{ url: image, alt: post.featuredImageAlt || title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function articleJsonLd(locale: Locale, post: PublicPost) {
  const blogLocale: BlogLocale = locale;
  const url = absolute(getBlogPostPath(blogLocale, post.slug));
  const image = post.ogImageUrl || post.featuredImageUrl;
  const authorUrl = post.author ? absolute(getBlogAuthorPath(blogLocale, post.author.slug)) : undefined;
  const categoryUrl = post.category ? absolute(getBlogCategoryPath(blogLocale, post.category.slug)) : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: post.title,
    description: post.seoDescription?.trim() || post.excerpt,
    ...(image ? { image: [image] } : {}),
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: blogLocale,
    ...(authorUrl && post.author
      ? {
          author: {
            "@type": "Person",
            name: post.author.displayName,
            url: authorUrl,
          },
        }
      : {}),
    ...(categoryUrl && post.category
      ? {
          articleSection: {
            "@type": "Thing",
            name: post.category.name,
            url: categoryUrl,
          },
        }
      : {}),
    ...(post.tags.length ? { keywords: post.tags.map(({ tag }) => tag.name).join(", ") } : {}),
    publisher: {
      "@type": "ProfessionalService",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: absolute(logoAssets.primary.src),
      },
    },
  };
}

export function authorProfileJsonLd(locale: Locale, author: {
  displayName: string;
  slug: string;
  bio: string;
  jobTitle: string | null;
  imageUrl: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  xUrl: string | null;
}) {
  const url = absolute(getBlogAuthorPath(locale, author.slug));
  const sameAs = [author.websiteUrl, author.linkedinUrl, author.xUrl].filter(
    (value): value is string => Boolean(value),
  );

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url,
    mainEntity: {
      "@type": "Person",
      "@id": `${url}#person`,
      name: author.displayName,
      description: author.bio,
      url,
      ...(author.jobTitle ? { jobTitle: author.jobTitle } : {}),
      ...(author.imageUrl ? { image: author.imageUrl } : {}),
      ...(sameAs.length ? { sameAs } : {}),
      worksFor: {
        "@type": "Organization",
        name: siteConfig.name,
        url: siteConfig.url,
      },
    },
  };
}

export function blogBreadcrumbJsonLd(locale: Locale, items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}
