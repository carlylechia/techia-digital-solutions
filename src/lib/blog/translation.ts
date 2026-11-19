import "server-only";

import type { PrismaClient } from "@prisma/client";
import { slugify } from "./slug";

type SourceCategory = { name: string; slug: string } | null;

function isUniqueConstraint(error: unknown) {
  return (error as { code?: string })?.code === "P2002";
}

function fitSlug(base: string, suffix: string) {
  return `${base.slice(0, Math.max(1, 120 - suffix.length)).replace(/-+$/g, "")}${suffix}`;
}

/**
 * A French article needs a French category. `validateRelations()` rejects the
 * English category id because categories are locale-bound, so translation
 * mirrors the English category into the French workspace (or reuses the
 * French counterpart that already exists).
 */
export async function resolveFrenchCategory(
  prisma: PrismaClient,
  source: SourceCategory,
  suggestedName: string,
): Promise<string | null> {
  if (source) {
    const bySlug = await prisma.blogCategory.findFirst({
      where: { locale: "fr", slug: source.slug, isActive: true },
      select: { id: true },
    });
    if (bySlug) return bySlug.id;

    const byName = await prisma.blogCategory.findFirst({
      where: { locale: "fr", name: { equals: source.name, mode: "insensitive" }, isActive: true },
      select: { id: true },
    });
    if (byName) return byName.id;
  }

  const translated = suggestedName.trim();
  if (translated) {
    const translatedSlug = slugify(translated);
    if (translatedSlug) {
      const byTranslatedSlug = await prisma.blogCategory.findFirst({
        where: { locale: "fr", slug: translatedSlug, isActive: true },
        select: { id: true },
      });
      if (byTranslatedSlug) return byTranslatedSlug.id;
    }
    const byTranslatedName = await prisma.blogCategory.findFirst({
      where: { locale: "fr", name: { equals: translated, mode: "insensitive" }, isActive: true },
      select: { id: true },
    });
    if (byTranslatedName) return byTranslatedName.id;
  }

  if (!source && !translated) return null;

  const name = (translated || source?.name || "Actualités").slice(0, 100);
  const baseSlug = slugify(translated) || slugify(source?.slug || "") || slugify(name) || "actualites";
  let slug = baseSlug;

  // An inactive French category may already own the preferred slug. Never
  // reactivate an editor's deliberate choice; create a clearly distinct slug
  // for the translated category instead.
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const conflict = await prisma.blogCategory.findUnique({
      where: { locale_slug: { locale: "fr", slug } },
      select: { id: true, isActive: true },
    });
    if (!conflict) break;
    if (conflict.isActive) return conflict.id;
    slug = fitSlug(baseSlug, `-${attempt + 2}`);
  }

  try {
    const created = await prisma.blogCategory.create({
      data: {
        name,
        slug,
        locale: "fr",
        isActive: true,
        description: source ? `Version française de la catégorie « ${source.name} », créée lors de la traduction d'un article.` : undefined,
      },
      select: { id: true },
    });
    return created.id;
  } catch (error) {
    if (!isUniqueConstraint(error)) return null;
    const existing = await prisma.blogCategory.findUnique({
      where: { locale_slug: { locale: "fr", slug } },
      select: { id: true, isActive: true },
    });
    return existing?.isActive ? existing.id : null;
  }
}

/**
 * Tags are locale-bound as well. The AI returns natural French tag names; each
 * one is matched to an existing French tag or created once.
 */
export async function resolveFrenchTags(
  prisma: PrismaClient,
  names: string[],
): Promise<{ tagIds: string[]; failed: string[] }> {
  const tagIds: string[] = [];
  const failed: string[] = [];
  const seen = new Set<string>();

  for (const rawName of names.slice(0, 12)) {
    const name = rawName.trim().slice(0, 80);
    const slug = slugify(name);
    if (!name || slug.length < 2 || seen.has(slug)) continue;
    seen.add(slug);

    try {
      const existing = await prisma.blogTag.findUnique({
        where: { locale_slug: { locale: "fr", slug } },
        select: { id: true },
      });
      if (existing) {
        tagIds.push(existing.id);
        continue;
      }
      const created = await prisma.blogTag.create({
        data: { name, slug, locale: "fr" },
        select: { id: true },
      });
      tagIds.push(created.id);
    } catch (error) {
      if (isUniqueConstraint(error)) {
        const existing = await prisma.blogTag.findUnique({
          where: { locale_slug: { locale: "fr", slug } },
          select: { id: true },
        });
        if (existing) {
          tagIds.push(existing.id);
          continue;
        }
      }
      failed.push(name);
    }
  }

  return { tagIds, failed };
}

/**
 * Resolve (or create) the translation group shared by the English source and
 * its French version. Creating the group first means even an unpublished
 * English draft and its translation are linked, while validation still only
 * accepts published counterparts through `translationSourcePostId`.
 */
export async function ensureTranslationGroupForSource(
  prisma: PrismaClient,
  source: { id: string; translationGroupId: string | null },
): Promise<string> {
  if (source.translationGroupId) return source.translationGroupId;

  const group = await prisma.blogTranslationGroup.create({ data: {}, select: { id: true } });
  const claimed = await prisma.blogPost.updateMany({
    where: { id: source.id, translationGroupId: null },
    data: { translationGroupId: group.id },
  });

  if (claimed.count === 0) {
    const fresh = await prisma.blogPost.findUnique({
      where: { id: source.id },
      select: { translationGroupId: true },
    });
    if (fresh?.translationGroupId) {
      await prisma.blogTranslationGroup.delete({ where: { id: group.id } }).catch(() => undefined);
      return fresh.translationGroupId;
    }
  }

  return group.id;
}

export async function findExistingFrenchTranslation(
  prisma: PrismaClient,
  translationGroupId: string,
): Promise<{ id: string; slug: string; status: string } | null> {
  return prisma.blogPost.findFirst({
    where: { translationGroupId, locale: "fr" },
    select: { id: true, slug: true, status: true },
  });
}

/**
 * Map related English articles to their published French translations when the
 * translation group already contains one. Unlinked or unpublished counterparts
 * are skipped so relation validation never blocks the translation draft.
 */
export async function resolveFrenchRelatedPostIds(
  prisma: PrismaClient,
  sourcePostId: string,
): Promise<string[]> {
  const relations = await prisma.blogPostRelation.findMany({
    where: { fromPostId: sourcePostId },
    select: { toPostId: true },
    orderBy: { sortOrder: "asc" },
  });
  if (!relations.length) return [];

  const related = await prisma.blogPost.findMany({
    where: { id: { in: relations.map((relation) => relation.toPostId) } },
    select: { translationGroupId: true },
  });
  const groupIds = related
    .map((post) => post.translationGroupId)
    .filter((groupId): groupId is string => Boolean(groupId));
  if (!groupIds.length) return [];

  const french = await prisma.blogPost.findMany({
    where: {
      translationGroupId: { in: groupIds },
      locale: "fr",
      status: "PUBLISHED",
      publishedAt: { lte: new Date() },
    },
    select: { id: true },
    take: 6,
  });
  return french.map((post) => post.id);
}

function translationSlugCandidates(base: string) {
  return [
    base,
    fitSlug(base, "-fr"),
    ...Array.from({ length: 38 }, (_, index) => fitSlug(base, `-${index + 2}`)),
  ];
}

/**
 * The editorial service refuses to create numeric URL suffixes silently. A
 * translation action has to choose its own safe slug instead, because the
 * French slug is generated and the editor never sees a slug-collision error.
 */
export async function uniqueTranslationSlug(
  prisma: PrismaClient,
  suggestedSlug: string,
  fallbackTitle: string,
): Promise<string> {
  const base = (slugify(suggestedSlug) || slugify(fallbackTitle) || `article-fr-${Date.now()}`)
    .slice(0, 120)
    .replace(/-+$/g, "");

  for (const candidate of translationSlugCandidates(base)) {
    const existing = await prisma.blogPost.findFirst({
      where: { locale: "fr", slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }

  return fitSlug(base, `-${Date.now()}`);
}

export async function resolveActiveAuthorId(
  prisma: PrismaClient,
  preferredAuthorId: string | null,
  fallbackAuthorId: string | null,
): Promise<string> {
  for (const candidate of [preferredAuthorId, fallbackAuthorId]) {
    if (!candidate) continue;
    const author = await prisma.blogAuthor.findFirst({
      where: { id: candidate, isActive: true },
      select: { id: true },
    });
    if (author) return author.id;
  }
  return "";
}
