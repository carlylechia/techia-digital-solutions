import "server-only";

import { unstable_cache } from "next/cache";
import { getDictionary } from "@/content/site";
import { getPrisma } from "@/lib/prisma";
import { BLOG_HOMEPAGE_PICKS_LIMIT, BLOG_PAGE_SIZE, type BlogLocale } from "./constants";
import { buildPublicPostWhere, homepagePostVisibility, publicPostVisibility } from "./public-feed";

function isBlogSchemaUnavailable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  return candidate.code === "P2021" || /BlogAuthor|BlogCategory|BlogPostStatus|column .*Blog/.test(candidate.message || "");
}

async function tolerateMissingBlogSchema<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isBlogSchemaUnavailable(error)) return fallback;
    throw error;
  }
}

const publicCardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  locale: true,
  featured: true,
  allowIndex: true,
  nofollow: true,
  publishedAt: true,
  updatedAt: true,
  readingTime: true,
  featuredImageUrl: true,
  featuredImageAlt: true,
  translationGroupId: true,
  categoryId: true,
  author: {
    select: {
      id: true,
      displayName: true,
      slug: true,
      bio: true,
      jobTitle: true,
      imageUrl: true,
      websiteUrl: true,
      linkedinUrl: true,
      xUrl: true,
    },
  },
  category: {
    select: { id: true, name: true, slug: true, description: true },
  },
  tags: {
    select: {
      tag: { select: { id: true, name: true, slug: true } },
    },
  },
} as const;

const publicPostSelect = {
  ...publicCardSelect,
  content: true,
  seoTitle: true,
  seoDescription: true,
  canonicalUrl: true,
  ogImageUrl: true,
  ctaTitle: true,
  ctaDescription: true,
  ctaHref: true,
  ctaLabel: true,
} as const;

async function queryPublishedPosts(input: {
  locale: BlogLocale;
  page: number;
  query?: string;
  categorySlug?: string;
  authorSlug?: string;
  excludePostId?: string;
}) {
  const prisma = getPrisma();
  if (!prisma) return { posts: [], total: 0 };

  const where = buildPublicPostWhere(input);

  // Read-only queries run in parallel instead of inside a transaction: pooled
  // Postgres deployments can fail to start a transaction under concurrent
  // build and server workers, and a listing never needs rollback semantics.
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      select: publicCardSelect,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (input.page - 1) * BLOG_PAGE_SIZE,
      take: BLOG_PAGE_SIZE,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { posts, total };
}

const cachedPublishedPosts = unstable_cache(
  async (input: Parameters<typeof queryPublishedPosts>[0]) => {
    try {
      return await queryPublishedPosts(input);
    } catch (error) {
      if (isBlogSchemaUnavailable(error)) return { posts: [], total: 0 };
      throw error;
    }
  },
  ["blog-public-posts"],
  { revalidate: 300, tags: ["blog"] },
);

export async function getPublishedPosts(input: {
  locale: BlogLocale;
  page?: number;
  query?: string;
  categorySlug?: string;
  authorSlug?: string;
  excludePostId?: string;
}) {
  return cachedPublishedPosts({
    ...input,
    page: Math.max(1, input.page || 1),
  });
}

const queryBlogHome = unstable_cache(
  async (locale: BlogLocale) => {
    try {
      return await queryBlogHomeUncached(locale);
    } catch (error) {
      if (isBlogSchemaUnavailable(error)) return { featured: null, latest: [], total: 0, categories: [] };
      throw error;
    }
  },
  ["blog-home"],
  { revalidate: 300, tags: ["blog"] },
);

const queryBlogHomeUncached = async (locale: BlogLocale) => {
  const prisma = getPrisma();
  if (!prisma) return { featured: null, latest: [], total: 0, categories: [] };
  const now = new Date();
  const visible = publicPostVisibility(locale, now);
  const featured = await prisma.blogPost.findFirst({
    where: { ...visible, featured: true },
    select: publicCardSelect,
    orderBy: { publishedAt: "desc" },
  });
  const [latest, total, categories] = await Promise.all([
    // Every published article except the single editor's pick, featured or
    // not, so a blog whose articles are all flagged featured still has a
    // populated grid, structured data and homepage cards.
    prisma.blogPost.findMany({
      where: { ...visible, ...(featured ? { id: { not: featured.id } } : {}) },
      select: publicCardSelect,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: BLOG_PAGE_SIZE,
    }),
    prisma.blogPost.count({ where: visible }),
    prisma.blogCategory.findMany({
      where: { locale, isActive: true, posts: { some: { status: "PUBLISHED", publishedAt: { lte: now } } } },
      select: { id: true, name: true, slug: true, description: true },
      orderBy: { name: "asc" },
      take: 12,
    }),
  ]);
  return { featured, latest, total, categories };
};

export const getBlogHome = queryBlogHome;

const queryHomepageBlogPosts = unstable_cache(
  async (locale: BlogLocale, take: number) => {
    try {
      return await queryHomepageBlogPostsUncached(locale, take);
    } catch (error) {
      if (isBlogSchemaUnavailable(error)) return [];
      throw error;
    }
  },
  ["blog-homepage-picks"],
  { revalidate: 300, tags: ["blog"] },
);

/**
 * The homepage featured insights lineup. Editors pick the articles and their
 * order from the blog workspace; when no pick has been made the section falls
 * back to the most recent published articles so the homepage is never empty
 * after a migration or a fresh install.
 */
export async function getHomepageBlogPosts(locale: BlogLocale, take: number = BLOG_HOMEPAGE_PICKS_LIMIT) {
  const limit = Math.max(1, Math.min(take, BLOG_HOMEPAGE_PICKS_LIMIT));
  return queryHomepageBlogPosts(locale, limit);
}

const queryHomepageBlogPostsUncached = async (locale: BlogLocale, take: number) => {
  const prisma = getPrisma();
  if (!prisma) return [];
  const picks = await prisma.blogPost.findMany({
    where: homepagePostVisibility(locale),
    select: publicCardSelect,
    orderBy: [{ homepageOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take,
  });
  if (picks.length) return picks;
  return prisma.blogPost.findMany({
    where: publicPostVisibility(locale),
    select: publicCardSelect,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take,
  });
};

const queryPublishedPost = unstable_cache(
  async (locale: BlogLocale, slug: string) => {
    try {
      return await queryPublishedPostUncached(locale, slug);
    } catch (error) {
      if (isBlogSchemaUnavailable(error)) return null;
      throw error;
    }
  },
  ["blog-public-post"],
  { revalidate: 300, tags: ["blog"] },
);

const queryPublishedPostUncached = async (locale: BlogLocale, slug: string) => {
  const prisma = getPrisma();
  if (!prisma) return null;
  const post = await prisma.blogPost.findFirst({
    where: { locale, slug, status: "PUBLISHED", publishedAt: { lte: new Date() }, author: { isActive: true }, category: { isActive: true } },
    select: publicPostSelect,
  });
  if (!post) return null;
  if (!post.translationGroupId) return { ...post, translationGroup: null };

  try {
    const translationGroup = await prisma.blogTranslationGroup.findUnique({
      where: { id: post.translationGroupId },
      select: {
        posts: {
          where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
          select: { locale: true, slug: true },
        },
      },
    });
    return { ...post, translationGroup };
  } catch (error) {
    console.error("blog_translation_group_query_failed", { postId: post.id, message: error instanceof Error ? error.message : "Unknown error" });
    return { ...post, translationGroup: null };
  }
};

function normalizeCachedDate(value: Date | string | null | undefined) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeCachedPublicPost<T extends { publishedAt: Date | string | null; updatedAt: Date | string }>(post: T) {
  return {
    ...post,
    publishedAt: normalizeCachedDate(post.publishedAt),
    updatedAt: normalizeCachedDate(post.updatedAt) || new Date(0),
  };
}

/**
 * Next's data cache serializes Date values. Normalize the result at the
 * boundary so article pages never receive cached ISO strings while expecting
 * Date methods during rendering or metadata generation.
 */
export async function getPublishedPost(locale: BlogLocale, slug: string) {
  const post = await queryPublishedPost(locale, slug);
  return post ? normalizeCachedPublicPost(post) : null;
}

async function getLegacyCanonicalSlug(locale: BlogLocale, slug: string) {
  const legacyBase = slug.replace(/-\d+$/, "");
  const legacy = getDictionary(locale).blog.find((item) => item.slug === legacyBase);
  if (!legacy) return null;
  const prisma = getPrisma();
  if (!prisma) return null;
  const variants = [legacyBase, ...Array.from({ length: 50 }, (_, index) => `${legacyBase}-${index + 2}`)];
  try {
    const candidate = await prisma.blogPost.findFirst({
      where: {
        locale,
        status: "PUBLISHED",
        publishedAt: { lte: new Date() },
        author: { isActive: true },
        category: { isActive: true },
        OR: [
          { title: { equals: legacy.title, mode: "insensitive" } },
          { slug: { in: variants } },
        ],
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: { slug: true },
    });
    return candidate && candidate.slug !== slug ? candidate.slug : null;
  } catch (error) {
    console.error("blog_legacy_canonical_query_failed", { locale, slug, message: error instanceof Error ? error.message : "Unknown error" });
    return null;
  }
}

export async function getPublishedPostRedirect(locale: BlogLocale, slug: string) {
  const prisma = getPrisma();
  if (!prisma) return null;
  try {
    const redirect = await prisma.blogSlugRedirect.findUnique({
      where: { locale_slug: { locale, slug } },
      select: {
        targetSlug: true,
        post: { select: { slug: true, locale: true, status: true, publishedAt: true, author: { select: { isActive: true } }, category: { select: { isActive: true } } } },
      },
    });
    if (redirect?.post && redirect.post.slug === redirect.targetSlug && redirect.post.locale === locale && redirect.post.status === "PUBLISHED" && redirect.post.publishedAt && redirect.post.publishedAt <= new Date() && redirect.post.author?.isActive && redirect.post.category?.isActive && redirect.targetSlug !== slug) {
      return redirect.targetSlug;
    }
  } catch (error) {
    if (!isBlogSchemaUnavailable(error)) console.error("blog_slug_redirect_query_failed", { locale, slug, message: error instanceof Error ? error.message : "Unknown error" });
  }
  return getLegacyCanonicalSlug(locale, slug);
}

const queryRelatedPosts = unstable_cache(
  async (post: NonNullable<Awaited<ReturnType<typeof getPublishedPost>>>) => {
    try {
    const prisma = getPrisma();
    if (!prisma) return [];
    const languageAndPublished = { locale: post.locale, status: "PUBLISHED" as const, publishedAt: { lte: new Date() } };
    const tagIds = post.tags.map(({ tag }) => tag.id);

    const manual = await prisma.blogPost.findMany({
      where: {
        id: { not: post.id },
        ...languageAndPublished,
        relatedFrom: { some: { fromPostId: post.id } },
      },
      select: publicCardSelect,
      orderBy: { publishedAt: "desc" },
      take: 3,
    });
    if (manual.length >= 3) return manual;

    const manualIds = new Set(manual.map((item) => item.id));
    const automaticFilters = [
      ...(post.categoryId ? [{ categoryId: post.categoryId }] : []),
      ...(tagIds.length ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
    ];
    if (!automaticFilters.length) return manual;
    const automatic = await prisma.blogPost.findMany({
      where: {
        id: { notIn: [post.id, ...manualIds] },
        ...languageAndPublished,
        OR: automaticFilters,
      },
      select: publicCardSelect,
      orderBy: [{ categoryId: { sort: "desc", nulls: "last" } }, { publishedAt: "desc" }],
      take: 3 - manual.length,
    });

    return [...manual, ...automatic];
    } catch (error) {
      if (isBlogSchemaUnavailable(error)) return [];
      throw error;
    }
  },
  ["blog-related-posts"],
  { revalidate: 300, tags: ["blog"] },
);

export const getRelatedPosts = queryRelatedPosts;

const queryAdjacentPosts = unstable_cache(
  async (locale: BlogLocale, publishedAt: Date, id: string) => {
    try {
    const prisma = getPrisma();
    if (!prisma) return { previous: null, next: null };
    const base = { locale, status: "PUBLISHED" as const, publishedAt: { lte: new Date() } };
    const [previous, next] = await Promise.all([
      prisma.blogPost.findFirst({
        where: { ...base, OR: [{ publishedAt: { lt: publishedAt } }, { publishedAt, id: { lt: id } }] },
        select: { slug: true, title: true, publishedAt: true },
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      }),
      prisma.blogPost.findFirst({
        where: { ...base, OR: [{ publishedAt: { gt: publishedAt } }, { publishedAt, id: { gt: id } }] },
        select: { slug: true, title: true, publishedAt: true },
        orderBy: [{ publishedAt: "asc" }, { id: "asc" }],
      }),
    ]);
    return { previous, next };
    } catch (error) {
      if (isBlogSchemaUnavailable(error)) return { previous: null, next: null };
      throw error;
    }
  },
  ["blog-adjacent-posts"],
  { revalidate: 300, tags: ["blog"] },
);

export const getAdjacentPosts = queryAdjacentPosts;

export async function getPublishedCategory(locale: BlogLocale, slug: string) {
  const prisma = getPrisma();
  if (!prisma) return null;
  return tolerateMissingBlogSchema(() => prisma.blogCategory.findFirst({
    where: { locale, slug, isActive: true, posts: { some: { locale, status: "PUBLISHED", publishedAt: { lte: new Date() } } } },
    select: { id: true, name: true, slug: true, description: true, locale: true, seoTitle: true, seoDescription: true },
  }), null);
}

export async function getPublishedCategories() {
  const prisma = getPrisma();
  if (!prisma) return [];
  return tolerateMissingBlogSchema(() => prisma.blogCategory.findMany({
    where: { isActive: true, posts: { some: { status: "PUBLISHED", publishedAt: { lte: new Date() } } } },
    select: { id: true, name: true, slug: true, description: true, locale: true },
    orderBy: [{ locale: "asc" }, { name: "asc" }],
  }), []);
}

export async function getPublishedAuthor(locale: BlogLocale, slug: string) {
  const prisma = getPrisma();
  if (!prisma) return null;
  return tolerateMissingBlogSchema(() => prisma.blogAuthor.findFirst({
    where: {
      slug,
      isActive: true,
      posts: { some: { locale, status: "PUBLISHED", publishedAt: { lte: new Date() } } },
    },
    select: { id: true, displayName: true, slug: true, bio: true, jobTitle: true, imageUrl: true, websiteUrl: true, linkedinUrl: true, xUrl: true },
  }), null);
}

export async function getIndexableAuthors() {
  const prisma = getPrisma();
  if (!prisma) return [];
  return tolerateMissingBlogSchema(() => prisma.blogAuthor.findMany({
    where: {
      isActive: true,
      posts: { some: { status: "PUBLISHED", publishedAt: { lte: new Date() } } },
    },
    select: { id: true, displayName: true, slug: true, bio: true, jobTitle: true, imageUrl: true },
  }), []);
}

export type PublicBlogPost = NonNullable<Awaited<ReturnType<typeof getPublishedPost>>>;
export type PublicBlogListPost = Awaited<ReturnType<typeof getPublishedPosts>>["posts"][number];

export async function getSitemapPosts() {
  const prisma = getPrisma();
  if (!prisma) return [];
  return prisma.blogPost.findMany({
    where: { status: "PUBLISHED", allowIndex: true, publishedAt: { lte: new Date() }, author: { isActive: true }, category: { isActive: true } },
    select: {
      id: true,
      locale: true,
      slug: true,
      featured: true,
      canonicalUrl: true,
      updatedAt: true,
      publishedAt: true,
      category: { select: { slug: true, locale: true } },
      author: { select: { slug: true } },
    },
    orderBy: { publishedAt: "desc" },
  });
}
