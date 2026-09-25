import type { Prisma } from "@prisma/client";
import { BLOG_HOMEPAGE_PICKS_LIMIT, type BlogLocale } from "./constants";

export const PUBLIC_SEARCH_MAX_LENGTH = 100;

export type PublicPostFilter = {
  locale: BlogLocale;
  query?: string;
  categorySlug?: string;
  authorSlug?: string;
  /**
   * Id of a single article to hide from the listing. Used to drop the exact
   * card already rendered above the grid (the editor's pick) without hiding
   * every other featured article.
   */
  excludePostId?: string;
  now?: Date;
};

export function normalizePublicSearch(query?: string) {
  const trimmed = query?.trim() ?? "";
  return trimmed ? trimmed.slice(0, PUBLIC_SEARCH_MAX_LENGTH) : "";
}

/**
 * An article is public once it is published, dated in the past, and both its
 * author and its category are active. Every public listing reuses this base so
 * the blog index, topic pages, author pages, sitemap and feed can never
 * disagree on what is visible.
 */
export function publicPostVisibility(locale: BlogLocale, now: Date = new Date()): Prisma.BlogPostWhereInput {
  return {
    locale,
    status: "PUBLISHED",
    publishedAt: { lte: now },
    author: { isActive: true },
    category: { isActive: true },
  };
}

/**
 * Homepage picks are public articles an editor has explicitly promoted, so the
 * homepage shows exactly what was chosen and in the chosen order.
 */
export function homepagePostVisibility(locale: BlogLocale, now: Date = new Date()): Prisma.BlogPostWhereInput {
  return { ...publicPostVisibility(locale, now), showOnHomepage: true };
}

/**
 * Cleans the ordered list of homepage picks submitted by the admin form:
 * blanks are dropped, duplicates are collapsed, and the lineup is capped so a
 * hand-crafted request cannot overflow the homepage section.
 */
export function normalizeHomepagePicks(input: { ids?: unknown; limit?: number }) {
  const limit = input.limit ?? BLOG_HOMEPAGE_PICKS_LIMIT;
  const ids = Array.isArray(input.ids) ? input.ids : [];
  const unique: string[] = [];
  for (const id of ids) {
    if (typeof id !== "string") continue;
    const trimmed = id.trim();
    if (!trimmed || unique.includes(trimmed)) continue;
    unique.push(trimmed);
    if (unique.length >= limit) break;
  }
  return unique;
}

export function buildPublicPostWhere(input: PublicPostFilter): Prisma.BlogPostWhereInput {
  const search = normalizePublicSearch(input.query);
  return {
    ...publicPostVisibility(input.locale, input.now),
    ...(input.excludePostId ? { id: { not: input.excludePostId } } : {}),
    ...(input.categorySlug ? { category: { slug: input.categorySlug, locale: input.locale, isActive: true } } : {}),
    ...(input.authorSlug ? { author: { slug: input.authorSlug, isActive: true } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { excerpt: { contains: search, mode: "insensitive" } },
            { contentText: { contains: search, mode: "insensitive" } },
            { category: { name: { contains: search, mode: "insensitive" } } },
            { tags: { some: { tag: { name: { contains: search, mode: "insensitive" } } } } },
          ],
        }
      : {}),
  };
}
