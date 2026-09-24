import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { writeAuditLog } from "@/lib/admin/session";
import { hasPermission } from "@/lib/admin/permissions";
import { getPrisma } from "@/lib/prisma";
import type { BlogSessionUser } from "./auth";
import { type BlogPostStatusValue, type BlogWorkflowAction } from "./constants";
import { normalizeCanonicalUrl, normalizeCtaHref, slugify, type BlogLocale } from "./slug";
import { countArticleInternalLinks } from "./sanitize";
import { prepareBlogPostPayload, getSeoIssues, type SeoIssue } from "./validation";
import { canEditBlogPost, canTransitionBlogPost } from "./authorization";
import { assertWorkflowTransition, statusForAction } from "./workflow";

export class BlogConflictError extends Error {
  constructor(message = "This article was updated by someone else. Reload before saving again.") {
    super(message);
    this.name = "BlogConflictError";
  }
}

export class BlogPublicationError extends Error {
  readonly issues: ReturnType<typeof getSeoIssues>;

  constructor(issues: ReturnType<typeof getSeoIssues>) {
    const blockingIssues = issues.filter((issue) => issue.severity === "error");
    const details = blockingIssues.map((issue) => `${issue.field}: ${issue.message}`).join(" ");
    super(details ? `Publishing is blocked. ${details}` : "Publishing is blocked. Fix the listed article requirements before trying again.");
    this.name = "BlogPublicationError";
    this.issues = issues;
  }
}

function requireDatabase(): PrismaClient {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Editorial database is unavailable.");
  return prisma;
}

function nullable(value: string | null | undefined) {
  const clean = value?.trim();
  return clean ? clean : null;
}

function assertSafeImageUrl(value: string | null | undefined, field: string) {
  if (!value) return;
  try {
    const url = new URL(value);
    const hosts = new Set(["res.cloudinary.com", "techiadigital.com", "www.techiadigital.com"]);
    if (process.env.NODE_ENV !== "production") { hosts.add("localhost"); hosts.add("127.0.0.1"); }
    if (url.protocol !== "https:" || !hosts.has(url.hostname.toLowerCase()) || url.username || url.password) throw new Error();
  } catch {
    throw new Error(`${field} must be an approved HTTPS image URL.`);
  }
}

async function uniqueSlug(prisma: PrismaClient, locale: BlogLocale, requestedSlug: string, excludeId?: string) {
  const base = slugify(requestedSlug) || `article-${Date.now()}`;
  let candidate = base;
  let suffix = 2;
  while (await prisma.blogPost.findFirst({ where: { locale, slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } })) {
    candidate = `${base.slice(0, 112)}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

async function validateRelations(
  prisma: PrismaClient,
  payload: ReturnType<typeof prepareBlogPostPayload>,
  options: { actor: BlogSessionUser; authorId: string | null; postId?: string },
) {
  const authorId = hasPermission(options.actor.permissions, "blog.posts.manage")
    ? nullable(payload.authorId) || options.authorId
    : options.authorId;

  if (!authorId) throw new Error("Your account must be linked to an active author profile before creating an article.");
  const author = await prisma.blogAuthor.findFirst({ where: { id: authorId, isActive: true }, select: { id: true } });
  if (!author) throw new Error("Select an active author profile.");

  let categoryId: string | null = null;
  if (payload.categoryId) {
    const category = await prisma.blogCategory.findFirst({
      where: { id: payload.categoryId, locale: payload.locale, isActive: true },
      select: { id: true },
    });
    if (!category) throw new Error("Select an active category in the article language.");
    categoryId = category.id;
  }

  let tagIds: string[] = [];
  if (payload.tagIds.length) {
    const tags = await prisma.blogTag.findMany({
      where: { id: { in: payload.tagIds }, locale: payload.locale },
      select: { id: true },
    });
    if (tags.length !== new Set(payload.tagIds).size) throw new Error("One or more tags are invalid for this language.");
    tagIds = tags.map(({ id }) => id);
  }

  let relatedPostIds: string[] = [];
  if (hasPermission(options.actor.permissions, "blog.posts.manage") && payload.relatedPostIds.length) {
    if (options.postId && payload.relatedPostIds.includes(options.postId)) throw new Error("An article cannot relate to itself.");
    const related = await prisma.blogPost.findMany({ where: { id: { in: payload.relatedPostIds }, locale: payload.locale, status: "PUBLISHED", publishedAt: { lte: new Date() } }, select: { id: true } });
    if (related.length !== new Set(payload.relatedPostIds).size) throw new Error("Related articles must be published in the same language.");
    relatedPostIds = related.map(({ id }) => id);
  } else if (options.postId) {
    const existingRelations = await prisma.blogPostRelation.findMany({ where: { fromPostId: options.postId }, select: { toPostId: true }, orderBy: { sortOrder: "asc" } });
    relatedPostIds = existingRelations.map(({ toPostId }) => toPostId);
  }

  let translationGroupId: string | null = null;
  if (hasPermission(options.actor.permissions, "blog.posts.manage") && payload.translationGroupId) {
    const group = await prisma.blogTranslationGroup.findUnique({ where: { id: payload.translationGroupId }, select: { id: true } });
    if (!group) throw new Error("Translation group not found.");
    const duplicateTranslation = await prisma.blogPost.findFirst({ where: { translationGroupId: group.id, locale: payload.locale, ...(options.postId ? { id: { not: options.postId } } : {}) }, select: { id: true } });
    if (duplicateTranslation) throw new Error("This translation group already has an article in that language.");
    translationGroupId = group.id;
  }

  return { authorId, categoryId, tagIds, relatedPostIds, translationGroupId };
}

function normalizedPostData(
  payload: ReturnType<typeof prepareBlogPostPayload>,
  relations: { authorId: string; categoryId: string | null; tagIds: string[]; relatedPostIds: string[]; translationGroupId: string | null },
  actor: BlogSessionUser,
) {
  assertSafeImageUrl(payload.featuredImageUrl || null, "Featured image");
  assertSafeImageUrl(payload.ogImageUrl || null, "Open Graph image");
  const canonicalUrl = normalizeCanonicalUrl(payload.canonicalUrl || "");
  if (payload.canonicalUrl && !canonicalUrl) throw new Error("Canonical URL must be a valid absolute URL.");
  const ctaHref = normalizeCtaHref(payload.ctaHref || "");
  if (payload.ctaHref && !ctaHref) throw new Error("CTA link is not safe.");

  return {
    title: payload.title,
    slug: slugify(payload.slug),
    excerpt: payload.excerpt,
    content: payload.content,
    contentText: payload.contentText,
    readingTime: payload.readingTime,
    locale: payload.locale as BlogLocale,
    authorId: relations.authorId,
    categoryId: relations.categoryId,
    translationGroupId: relations.translationGroupId,
    seoTitle: nullable(payload.seoTitle),
    seoDescription: nullable(payload.seoDescription),
    focusKeyword: nullable(payload.focusKeyword),
    canonicalUrl,
    featuredImageUrl: nullable(payload.featuredImageUrl),
    featuredImagePublicId: nullable(payload.featuredImagePublicId),
    featuredImageAlt: nullable(payload.featuredImageAlt),
    ogImageUrl: nullable(payload.ogImageUrl),
    ogImagePublicId: nullable(payload.ogImagePublicId),
    ctaTitle: nullable(payload.ctaTitle),
    ctaDescription: nullable(payload.ctaDescription),
    ctaHref,
    ctaLabel: nullable(payload.ctaLabel),
    ...(hasPermission(actor.permissions, "blog.posts.manage")
      ? {
          featured: payload.featured,
          allowIndex: payload.allowIndex,
          nofollow: payload.nofollow,
        }
      : {}),
    lastEditedById: actor.id,
  };
}

export function invalidateBlogCache() {
  revalidateTag("blog", "max");
}

function revalidatePublicBlog(input: { postId?: string; locale?: BlogLocale; oldSlug?: string | null }) {
  invalidateBlogCache();
  if (input.locale) revalidatePath(`/${input.locale}/blog`);
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  if (input.locale && input.postId) {
    const slug = input.oldSlug;
    if (slug) revalidatePath(`/${input.locale}/blog/${slug}`);
  }
  revalidatePath("/");
}

function revalidatePostRelations(input: {
  locale: BlogLocale;
  postId: string;
  slug: string;
  oldSlug?: string | null;
  categorySlug?: string | null;
  authorSlug?: string | null;
}) {
  invalidateBlogCache();
  revalidatePath(`/${input.locale}/blog/${input.oldSlug || input.slug}`);
  revalidatePath(`/${input.locale}/blog/${input.slug}`);
  if (input.categorySlug) revalidatePath(`/${input.locale}/blog/category/${input.categorySlug}`);
  if (input.authorSlug) revalidatePath(`/${input.locale}/blog/author/${input.authorSlug}`);
  revalidatePath(`/${input.locale}/blog`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/");
  void input.locale;
  void input.postId;
}

export async function createBlogPost(actor: BlogSessionUser, rawPayload: unknown) {
  const prisma = requireDatabase();
  if (!hasPermission(actor.permissions, "blog.posts.create") && !hasPermission(actor.permissions, "blog.posts.manage")) {
    throw new Error("You do not have permission to create articles.");
  }
  const payload = prepareBlogPostPayload(rawPayload);
  const relations = await validateRelations(prisma, payload, { actor, authorId: actor.authorId });
  const slug = await uniqueSlug(prisma, payload.locale as BlogLocale, payload.slug);
  const data = normalizedPostData({ ...payload, slug }, relations, actor);
  if (!hasPermission(actor.permissions, "blog.posts.publish")) Object.assign(data, { canonicalUrl: null, allowIndex: true, nofollow: false, featured: false });

  const post = await prisma.$transaction(async (tx) => {
    const created = await tx.blogPost.create({
      data: {
        ...data,
        slug,
        status: "DRAFT",
        published: false,
        version: 1,
        createdById: actor.id,
      },
    });
    if (relations.tagIds.length) {
      await tx.blogPostTag.createMany({ data: relations.tagIds.map((tagId) => ({ postId: created.id, tagId })) });
    }
    if (relations.relatedPostIds.length) {
      await tx.blogPostRelation.createMany({ data: relations.relatedPostIds.map((toPostId, sortOrder) => ({ fromPostId: created.id, toPostId, sortOrder })) });
    }
    await tx.auditLog.create({ data: { actorId: actor.id, action: "blog.article_created", entityType: "BlogPost", entityId: created.id, metadata: { locale: created.locale, authorId: created.authorId } } });
    return created;
  });
  revalidatePath("/admin/blog");
  revalidatePath("/writer");
  return post;
}

export async function updateBlogPost(input: {
  actor: BlogSessionUser;
  postId: string;
  payload: unknown;
}) {
  const prisma = requireDatabase();
  const { actor } = input;
  const existing = await prisma.blogPost.findUnique({
    where: { id: input.postId },
    select: { id: true, slug: true, locale: true, status: true, version: true, translationGroupId: true, canonicalUrl: true, allowIndex: true, nofollow: true, featured: true, author: { select: { userId: true } } },
  });
  if (!existing) throw new Error("Article not found.");
  const payload = prepareBlogPostPayload({ ...(input.payload as Record<string, unknown>), locale: existing.locale });

  const ownsPost = existing.author?.userId === actor.id;
  if (!canEditBlogPost({ permissions: actor.permissions, actorId: actor.id, authorUserId: existing.author?.userId || null, status: existing.status })) {
    throw new Error("You can edit only your own draft or requested changes.");
  }

  const relations = await validateRelations(prisma, payload, { actor, authorId: ownsPost ? actor.authorId : null, postId: existing.id });
  const data = normalizedPostData(payload, relations, actor);
  if (!hasPermission(actor.permissions, "blog.posts.publish")) {
    Object.assign(data, { translationGroupId: existing.translationGroupId, canonicalUrl: existing.canonicalUrl, allowIndex: existing.allowIndex, nofollow: existing.nofollow, featured: existing.featured });
  }
  const oldSlug = existing.slug;
  const slug = oldSlug === slugify(payload.slug) ? oldSlug : await uniqueSlug(prisma, payload.locale as BlogLocale, payload.slug, existing.id);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.blogPost.updateMany({
      where: { id: existing.id, version: payload.version },
      data: { ...data, slug, version: { increment: 1 } },
    });
    if (result.count !== 1) throw new BlogConflictError();

    await tx.blogPostTag.deleteMany({ where: { postId: existing.id } });
    if (relations.tagIds.length) {
      await tx.blogPostTag.createMany({
        data: relations.tagIds.map((tagId) => ({ postId: existing.id, tagId })),
      });
    }
    await tx.blogPostRelation.deleteMany({ where: { fromPostId: existing.id } });
    if (relations.relatedPostIds.length) {
      await tx.blogPostRelation.createMany({ data: relations.relatedPostIds.filter((toPostId) => toPostId !== existing.id).map((toPostId, sortOrder) => ({ fromPostId: existing.id, toPostId, sortOrder })) });
    }

    const fullExisting = await tx.blogPost.findUniqueOrThrow({ where: { id: existing.id }, select: { publishedAt: true } });
    if (fullExisting.publishedAt && oldSlug !== slug) {
      await tx.blogSlugRedirect.upsert({
        where: { locale_slug: { locale: existing.locale, slug: oldSlug } },
        create: { locale: existing.locale, slug: oldSlug, targetSlug: slug, postId: existing.id },
        update: { targetSlug: slug, postId: existing.id },
      });
    }

    return tx.blogPost.findUniqueOrThrow({ where: { id: existing.id } });
  });

  await writeAuditLog({
    actorId: actor.id,
    action: "blog.article_edited",
    entityType: "BlogPost",
    entityId: existing.id,
    metadata: { version: updated.version, locale: updated.locale },
  });
  revalidatePublicBlog({ postId: updated.id, locale: updated.locale, oldSlug });
  revalidatePath(`/${updated.locale}/blog/${updated.slug}`);
  if (existing.status === "PUBLISHED") {
    const full = await prisma.blogPost.findUnique({ where: { id: updated.id }, include: { category: true, author: true } });
    if (full?.category) revalidatePath(`/${updated.locale}/blog/category/${full.category.slug}`);
    if (full?.author) revalidatePath(`/${updated.locale}/blog/author/${full.author.slug}`);
  }
  return updated;
}

async function assertPublicationReady(prisma: PrismaClient, postId: string) {
  const post = await prisma.blogPost.findUniqueOrThrow({
    where: { id: postId },
    include: { author: true, category: true },
  });
  const issues = getSeoIssues({
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    featuredImageUrl: post.featuredImageUrl,
    featuredImageAlt: post.featuredImageAlt,
    hasAuthor: Boolean(post.author?.isActive),
    hasCategory: Boolean(post.category?.isActive),
    internalLinkCount: countArticleInternalLinks(post.content),
  });
  if (issues.some((issue) => issue.severity === "error")) throw new BlogPublicationError(issues);

  const duplicate = await prisma.blogPost.findFirst({
    where: {
      id: { not: post.id },
      locale: post.locale,
      status: "PUBLISHED",
      title: { equals: post.title, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (duplicate) throw new BlogPublicationError([{ field: "title", message: "A published article already uses this title in this language.", severity: "error" }]);
  return issues.filter((issue) => issue.severity === "warning");
}

export async function transitionBlogPost(input: {
  actor: BlogSessionUser;
  postId: string;
  action: BlogWorkflowAction;
  version: number;
  scheduledAt?: Date | null;
  reviewNote?: string | null;
}) {
  const prisma = requireDatabase();
  const post = await prisma.blogPost.findUnique({
    where: { id: input.postId },
    include: { author: { select: { userId: true, slug: true } }, category: true },
  });
  if (!post) throw new Error("Article not found.");

  const isAdmin = hasPermission(input.actor.permissions, "blog.posts.manage");
  if (!canTransitionBlogPost({ permissions: input.actor.permissions, actorId: input.actor.id, authorUserId: post.author?.userId || null, status: post.status, action: input.action })) throw new Error("You cannot perform that workflow action.");
  if (["PUBLISH", "SCHEDULE", "REQUEST_CHANGES", "APPROVE", "ARCHIVE", "RESTORE"].includes(input.action) && !hasPermission(input.actor.permissions, "blog.posts.publish")) {
    throw new Error("Publishing permission is required.");
  }
  if (input.action === "REQUEST_CHANGES" && !input.reviewNote?.trim()) {
    throw new Error("Add a review note explaining the requested changes.");
  }

  assertWorkflowTransition({
    status: post.status as BlogPostStatusValue,
    action: input.action,
    isAdmin,
    scheduledAt: input.scheduledAt,
  });

  let publicationIssues: SeoIssue[] = [];
  if (input.action === "PUBLISH" || input.action === "SCHEDULE") {
    publicationIssues = await assertPublicationReady(prisma, post.id);
  }

  const nextStatus = statusForAction(input.action);
  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.blogPost.updateMany({
      where: { id: post.id, version: input.version },
      data: {
        status: nextStatus,
        published: nextStatus === "PUBLISHED",
        publishedAt: nextStatus === "PUBLISHED" ? post.publishedAt || now : post.publishedAt,
        publishedById: nextStatus === "PUBLISHED" ? input.actor.id : post.publishedById,
        submittedAt: input.action === "SUBMIT" ? now : post.submittedAt,
        scheduledAt: input.action === "SCHEDULE" ? input.scheduledAt : input.action === "PUBLISH" ? null : post.scheduledAt,
        archivedAt: input.action === "ARCHIVE" ? now : input.action === "RESTORE" ? null : post.archivedAt,
        lastEditedById: input.actor.id,
        version: { increment: 1 },
      },
    });
    if (result.count !== 1) throw new BlogConflictError();

    await tx.blogPostRevision.create({
      data: {
        postId: post.id,
        version: post.version,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        featuredImageUrl: post.featuredImageUrl,
        featuredImagePublicId: post.featuredImagePublicId,
        featuredImageAlt: post.featuredImageAlt,
        createdById: input.actor.id,
      },
    });

    if (input.action === "REQUEST_CHANGES" && input.reviewNote?.trim()) {
      await tx.blogReviewNote.create({
        data: { postId: post.id, authorId: input.actor.id, body: input.reviewNote.trim() },
      });
    }
    return tx.blogPost.findUniqueOrThrow({ where: { id: post.id } });
  });

  await writeAuditLog({
    actorId: input.actor.id,
    action: `blog.article_${input.action.toLowerCase()}`,
    entityType: "BlogPost",
    entityId: post.id,
    metadata: { from: post.status, to: nextStatus, version: updated.version },
  });

  revalidatePostRelations({
    locale: post.locale,
    postId: post.id,
    slug: post.slug,
    categorySlug: post.category?.slug,
    authorSlug: post.author?.slug,
  });
  revalidatePath("/admin/blog");
  revalidatePath("/writer");
  return Object.assign(updated, { publicationIssues });
}

export async function deleteUnpublishedBlogPost(actor: BlogSessionUser, postId: string) {
  const prisma = requireDatabase();
  if (!hasPermission(actor.permissions, "blog.posts.manage")) throw new Error("Administrative permission is required.");
  const post = await prisma.blogPost.findUnique({ where: { id: postId } });
  if (!post) return;
  if (post.publishedAt || post.status === "PUBLISHED" || post.status === "ARCHIVED") {
    throw new Error("Published or archived articles must be unpublished and archived, not hard-deleted.");
  }
  const deleted = await prisma.blogPost.deleteMany({ where: { id: post.id, version: post.version, publishedAt: null, status: { in: ["DRAFT", "CHANGES_REQUESTED"] } } });
  if (deleted.count !== 1) throw new BlogConflictError("The article changed before it could be deleted. Reload and try again.");
  await writeAuditLog({ actorId: actor.id, action: "blog.article_deleted", entityType: "BlogPost", entityId: post.id, metadata: { slug: post.slug } });
  revalidatePath("/admin/blog");
  revalidatePath("/writer");
}

export async function publishDueScheduledPosts() {
  const prisma = requireDatabase();
  const [due, systemPublisher] = await Promise.all([
    prisma.blogPost.findMany({
      where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
      select: { id: true, locale: true, slug: true, version: true, title: true, excerpt: true, content: true, seoTitle: true, seoDescription: true, featuredImageUrl: true, featuredImagePublicId: true, featuredImageAlt: true, category: true, author: true },
      orderBy: { scheduledAt: "asc" },
      take: 100,
    }),
    prisma.adminUser.findFirst({ where: { role: "super_admin", status: "ACTIVE" }, select: { id: true } }),
  ]);
  let published = 0;
  for (const post of due) {
    try {
      await assertPublicationReady(prisma, post.id);
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.blogPost.updateMany({
          where: { id: post.id, status: "SCHEDULED", version: post.version },
          data: { status: "PUBLISHED", published: true, publishedAt: new Date(), publishedById: systemPublisher?.id || null, scheduledAt: null, version: { increment: 1 } },
        });
        if (updated.count !== 1) return false;
        await tx.blogPostRevision.create({ data: { postId: post.id, version: post.version, title: post.title, excerpt: post.excerpt, content: post.content, seoTitle: post.seoTitle, seoDescription: post.seoDescription, featuredImageUrl: post.featuredImageUrl, featuredImagePublicId: post.featuredImagePublicId, featuredImageAlt: post.featuredImageAlt, createdById: systemPublisher?.id || null } });
        return true;
      });
      if (result) {
        published += 1;
        await writeAuditLog({ actorId: systemPublisher?.id || null, action: "blog.article_published", entityType: "BlogPost", entityId: post.id, metadata: { scheduled: true } });
        revalidatePostRelations({ locale: post.locale, postId: post.id, slug: post.slug, categorySlug: post.category?.slug, authorSlug: post.author?.slug });
      }
    } catch (error) {
      console.error("blog_scheduled_publish_failed", { postId: post.id, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
  return { checked: due.length, published };
}

export type EditorialPost = Prisma.BlogPostGetPayload<{ include: { author: true; category: true; tags: { include: { tag: true } }; reviewNotes: { include: { author: true } }; revisions: true } }>;
