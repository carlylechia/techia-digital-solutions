import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { getPrisma } from "@/lib/prisma";
import {
  resolveFrenchCategory,
  resolveFrenchTags,
  ensureTranslationGroupForSource,
  findExistingFrenchTranslation,
  uniqueTranslationSlug,
} from "@/lib/blog/translation";

const prisma = getPrisma();

describe("translation helpers", () => {
  const createdCategoryIds: string[] = [];
  const createdTagIds: string[] = [];
  const createdPostIds: string[] = [];
  const createdGroupIds: string[] = [];

  afterAll(async () => {
    if (!prisma) return;
    for (const postId of createdPostIds) {
      await prisma.blogPost.delete({ where: { id: postId } }).catch(() => undefined);
    }
    for (const groupId of createdGroupIds) {
      await prisma.blogTranslationGroup.delete({ where: { id: groupId } }).catch(() => undefined);
    }
    for (const tagId of createdTagIds) {
      await prisma.blogTag.delete({ where: { id: tagId } }).catch(() => undefined);
    }
    for (const categoryId of createdCategoryIds) {
      await prisma.blogCategory.delete({ where: { id: categoryId } }).catch(() => undefined);
    }
  });

  it("reuses a French category with the same slug", async () => {
    if (!prisma) return;
    const category = await prisma.blogCategory.create({
      data: { name: "SEO", slug: `seo-${Date.now()}`, locale: "fr", isActive: true },
    });
    createdCategoryIds.push(category.id);

    const resolved = await resolveFrenchCategory(prisma, { name: "SEO", slug: category.slug }, "Référencement");
    expect(resolved).toBe(category.id);
  });

  it("creates a French category from the AI suggestion when none exists", async () => {
    if (!prisma) return;
    const source = { name: "Digital Strategy", slug: `digital-strategy-${Date.now()}` };
    const resolved = await resolveFrenchCategory(prisma, source, "Stratégie digitale");
    expect(resolved).toBeTruthy();
    if (resolved) createdCategoryIds.push(resolved);

    const created = await prisma.blogCategory.findUnique({ where: { id: resolved! } });
    expect(created?.locale).toBe("fr");
    expect(created?.isActive).toBe(true);
    expect(created?.name).toBe("Stratégie digitale");
  });

  it("matches or creates French tags", async () => {
    if (!prisma) return;
    const result = await resolveFrenchTags(prisma, ["référencement", "croissance"]);
    expect(result.failed).toEqual([]);
    expect(result.tagIds.length).toBe(2);
    for (const id of result.tagIds) createdTagIds.push(id);

    // Re-running should reuse them rather than create duplicates.
    const second = await resolveFrenchTags(prisma, ["référencement", "croissance"]);
    expect(second.tagIds).toEqual(result.tagIds);
  });

  it("links an English source and its French translation", async () => {
    if (!prisma) return;
    const suffix = Date.now().toString(36);
    const source = await prisma.blogPost.create({
      data: {
        title: "English source",
        slug: `english-source-${suffix}`,
        excerpt: "A sufficiently long excerpt for validation purposes here.",
        content: "<p>Source content.</p>",
        contentText: "Source content.",
        locale: "en",
        status: "DRAFT",
      },
    });
    createdPostIds.push(source.id);

    const groupId = await ensureTranslationGroupForSource(prisma, { id: source.id, translationGroupId: null });
    expect(groupId).toBeTruthy();
    createdGroupIds.push(groupId);

    const refreshed = await prisma.blogPost.findUnique({ where: { id: source.id }, select: { translationGroupId: true } });
    expect(refreshed?.translationGroupId).toBe(groupId);

    // Creating a French post in the same group should be detected as the
    // existing translation.
    const french = await prisma.blogPost.create({
      data: {
        title: "Version française",
        slug: `version-francaise-${suffix}`,
        excerpt: "Un extrait suffisamment long pour la validation.",
        content: "<p>Contenu.</p>",
        contentText: "Contenu.",
        locale: "fr",
        status: "DRAFT",
        translationGroupId: groupId,
      },
    });
    createdPostIds.push(french.id);

    const existing = await findExistingFrenchTranslation(prisma, groupId);
    expect(existing?.id).toBe(french.id);
  });

  it("chooses a unique French slug", async () => {
    if (!prisma) return;
    const suffix = Date.now().toString(36);
    const existing = await prisma.blogPost.create({
      data: {
        title: "Collision",
        slug: `collision-${suffix}`,
        excerpt: "A sufficiently long excerpt for validation purposes here.",
        content: "<p>Collision.</p>",
        contentText: "Collision.",
        locale: "fr",
        status: "DRAFT",
      },
    });
    createdPostIds.push(existing.id);

    const slug = await uniqueTranslationSlug(prisma, `collision-${suffix}`, "Collision");
    expect(slug).not.toBe(`collision-${suffix}`);
    expect(slug).toMatch(/collision/);
  });
});