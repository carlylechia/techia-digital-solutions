"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";
import { ensureDefaultAdminRoles } from "@/lib/admin/bootstrap";
import { writeAuditLog } from "@/lib/admin/session";
import { getPrisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { sendWriterInviteEmail, sendWriterPasswordResetEmail } from "@/lib/email";
import { requireBlogUser, BlogAuthorizationError, isSuperAdminUser, type BlogSessionUser } from "./auth";
import { hasPermission } from "@/lib/admin/permissions";
import { normalizeHomepagePicks } from "./public-feed";
import { blogAuthorProfileSchema, blogCategorySchema, blogMediaMetadataSchema, blogPostPayloadSchema, blogTagSchema, blogTransitionSchema, writerInviteSchema, writerPasswordSchema, type BlogPostPayload } from "./validation";
import { BlogConflictError, BlogPublicationError, createBlogPost, deleteUnpublishedBlogPost, invalidateBlogCache, transitionBlogPost, updateBlogPost } from "./service";
import { translateEditorialArticle, type EditorialArticleTranslation } from "@/lib/ai/editorial-service";
import { editEditorialImage, generateEditorialImage, EditorialAiError } from "@/lib/ai/editorial-image-service";
import {
  ensureTranslationGroupForSource,
  findExistingFrenchTranslation,
  resolveActiveAuthorId,
  resolveFrenchCategory,
  resolveFrenchRelatedPostIds,
  resolveFrenchTags,
  uniqueTranslationSlug,
} from "./translation";
import { isTranslationImageMode, type TranslationImageMode } from "./translation-types";

import { slugify } from "./slug";

export type BlogActionResult = { ok: true; message: string; warning?: string; id?: string; slug?: string; scheduledAt?: string | null; version?: number; issues?: Array<{ field: string; message: string; severity: "error" | "warning" }> } | { ok: false; error: string; issues?: Array<{ field: string; message: string; severity: "error" | "warning" }> };

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}

function checked(formData: FormData, key: string) {
  return formData.getAll(key).some((entry) => entry === "on" || entry === "true" || entry === "1");
}

function tags(formData: FormData) {
  return formData.getAll("tagIds").filter((entry): entry is string => typeof entry === "string");
}

function payloadFromForm(formData: FormData, options: { fallbackSlug?: string } = {}): BlogPostPayload {
  return blogPostPayloadSchema.parse({
    title: value(formData, "title"),
    slug: value(formData, "slug") || options.fallbackSlug || "",
    excerpt: value(formData, "excerpt"),
    content: value(formData, "content"),
    locale: value(formData, "locale") || "en",
    categoryId: value(formData, "categoryId"),
    authorId: value(formData, "authorId"),
    translationSourcePostId: value(formData, "translationSourcePostId"),
    tagIds: tags(formData),
    relatedPostIds: value(formData, "relatedPostIds").split(",").map((item) => item.trim()).filter(Boolean),
    seoTitle: value(formData, "seoTitle"),
    seoDescription: value(formData, "seoDescription"),
    focusKeyword: value(formData, "focusKeyword"),
    canonicalUrl: value(formData, "canonicalUrl"),
    featuredImageUrl: value(formData, "featuredImageUrl"),
    featuredImagePublicId: value(formData, "featuredImagePublicId"),
    featuredImageAlt: value(formData, "featuredImageAlt"),
    ogImageUrl: value(formData, "ogImageUrl"),
    ogImagePublicId: value(formData, "ogImagePublicId"),
    ctaTitle: value(formData, "ctaTitle"),
    ctaDescription: value(formData, "ctaDescription"),
    ctaHref: value(formData, "ctaHref"),
    ctaLabel: value(formData, "ctaLabel"),
    featured: checked(formData, "featured"),
    allowIndex: !formData.has("allowIndex") || checked(formData, "allowIndex"),
    nofollow: checked(formData, "nofollow"),
    version: Number(value(formData, "version") || "1"),
  });
}

function messageFromError(error: unknown): BlogActionResult {
  if (error instanceof ZodError) return { ok: false, error: "Please correct the highlighted fields.", issues: error.issues.map((issue) => ({ field: issue.path.join(".") || "form", message: issue.message, severity: "error" })) };
  if (error instanceof BlogConflictError) return { ok: false, error: error.message };
  if (error instanceof BlogPublicationError) return { ok: false, error: error.message, issues: error.issues };
  if (error instanceof BlogAuthorizationError) return { ok: false, error: error.message };
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "The editorial action could not be completed." };
}

type TranslationSourceImage = {
  featuredImageUrl: string;
  featuredImagePublicId: string;
  ogImageUrl: string;
  ogImagePublicId: string;
};

type ResolvedTranslationImage = TranslationSourceImage & {
  featuredImageAlt: string;
  warning?: string;
};

/**
 * Resolve the French featured image according to the editor's choice. Any AI
 * failure degrades to the English image instead of blocking the draft, and the
 * reason travels back to the editor as a visible warning.
 */
async function resolveTranslationImage(input: {
  actor: BlogSessionUser;
  source: TranslationSourceImage & { featuredImageUrl: string; featuredImageAlt: string | null };
  translated: EditorialArticleTranslation;
  mode: TranslationImageMode;
}): Promise<ResolvedTranslationImage> {
  const fallbackAlt = input.translated.imageAltText || input.source.featuredImageAlt || "";
  const reused: ResolvedTranslationImage = {
    featuredImageUrl: input.source.featuredImageUrl,
    featuredImagePublicId: input.source.featuredImagePublicId,
    featuredImageAlt: fallbackAlt,
    ogImageUrl: input.source.ogImageUrl,
    ogImagePublicId: input.source.ogImagePublicId,
  };

  if (input.mode === "reuse") return reused;

  if (!isSuperAdminUser(input.actor)) {
    return {
      ...reused,
      warning: "Only a SuperAdmin can run editorial image AI. The English featured image was reused unchanged.",
    };
  }

  const effectiveMode: "translate" | "generate" = input.mode === "translate" && input.source.featuredImageUrl ? "translate" : "generate";
  const fallbackNote = input.source.featuredImageUrl
    ? "The English featured image was reused instead."
    : "The draft has no featured image yet; add one before publishing.";

  function isRetryableImageError(error: unknown) {
    if (!(error instanceof EditorialAiError)) return true;
    return !["disabled", "not_configured", "auth", "invalid_input"].includes(error.category);
  }

  async function attemptImage(mode: "translate" | "generate") {
    const maxAttempts = 2;
    let lastError: unknown = null;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        if (mode === "translate") {
          return await editEditorialImage({
            sourceImageUrl: input.source.featuredImageUrl,
            articleTitle: input.translated.title,
            altText: fallbackAlt,
            imagePrompt: input.translated.imagePrompt,
          }, input.actor.id);
        }
        return await generateEditorialImage({
          imagePrompt: input.translated.imagePrompt,
          altText: fallbackAlt,
          articleTitle: input.translated.title,
        }, input.actor.id);
      } catch (error) {
        lastError = error;
        if (attempt === maxAttempts - 1 || !isRetryableImageError(error)) break;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("Image operation failed.");
  }

  // Prefer the requested operation. If image translation cannot be completed,
  // retry it once and then attempt a fresh generation before falling back to
  // the English image, so a transient provider failure does not silently leave
  // the French draft with an unchanged image.
  const operations: Array<"translate" | "generate"> = effectiveMode === "translate"
    ? ["translate", "generate"]
    : ["generate"];

  let lastError: unknown = null;
  let attemptedTranslation = false;
  for (const operation of operations) {
    if (operation === "translate" && !input.source.featuredImageUrl) continue;
    attemptedTranslation = attemptedTranslation || operation === "translate";
    try {
      const image = await attemptImage(operation);
      const usedFallbackGeneration = effectiveMode === "translate" && operation === "generate";
      return {
        featuredImageUrl: image.url,
        featuredImagePublicId: image.publicId,
        featuredImageAlt: image.altText || fallbackAlt,
        ogImageUrl: image.url,
        ogImagePublicId: image.publicId,
        ...(usedFallbackGeneration
          ? { warning: "The English image text could not be translated after retrying, so a new French featured image was generated instead." }
          : {}),
      };
    } catch (error) {
      lastError = error;
    }
  }

  const attempted = effectiveMode === "translate"
    ? attemptedTranslation
      ? "translate the text in the English featured image"
      : "generate a new French featured image"
    : "generate a new French featured image";
  const reason = lastError instanceof Error && lastError.message ? ` ${lastError.message}` : "";
  return {
    ...reused,
    warning: `We could not ${attempted}.${reason} ${fallbackNote}`,
  };
}

export async function translateBlogPostToFrenchAction(
  postId: string,
  options: { imageMode?: TranslationImageMode } = {},
): Promise<BlogActionResult> {
  try {
    const actor = await requireBlogUser("blog.posts.create");
    if (!isSuperAdminUser(actor)) {
      return { ok: false, error: "Premium access is required to translate articles." };
    }
    const prisma = getPrisma();
    if (!prisma) return { ok: false, error: "Editorial database is unavailable." };

    const source = await prisma.blogPost.findUnique({
      where: { id: postId },
      include: {
        category: { select: { name: true, slug: true } },
        tags: { select: { tag: { select: { name: true } } } },
      },
    });
    if (!source) return { ok: false, error: "Article not found." };
    if (source.locale !== "en") return { ok: false, error: "Only English articles can be translated to French." };

    const canManage = hasPermission(actor.permissions, "blog.posts.manage");
    if (!canManage && source.authorId !== actor.authorId) {
      return { ok: false, error: "You can only translate your own articles." };
    }

    const existingFrench = source.translationGroupId
      ? await findExistingFrenchTranslation(prisma, source.translationGroupId)
      : null;
    if (existingFrench) {
      return {
        ok: true,
        message: "A French version is already linked to this article. Opening it instead of creating a duplicate.",
        id: existingFrench.id,
        slug: existingFrench.slug,
      };
    }

    const imageMode: TranslationImageMode = isTranslationImageMode(options?.imageMode) ? options.imageMode : "reuse";
    const warnings: string[] = [];

    const translated = await translateEditorialArticle({
      title: source.title,
      slug: source.slug,
      excerpt: source.excerpt,
      content: source.content,
      seoTitle: source.seoTitle,
      metaDescription: source.seoDescription,
      focusKeyword: source.focusKeyword,
      categoryName: source.category?.name,
      tags: source.tags.map(({ tag }) => tag.name),
      imageAltText: source.featuredImageAlt,
      ctaTitle: source.ctaTitle,
      ctaDescription: source.ctaDescription,
      ctaLabel: source.ctaLabel,
    }, actor.id);

    const [categoryId, tagResult, relatedPostIds, authorId, image, slug, translationGroupId] = await Promise.all([
      resolveFrenchCategory(prisma, source.category, translated.suggestedCategory),
      resolveFrenchTags(prisma, translated.suggestedTags),
      resolveFrenchRelatedPostIds(prisma, source.id),
      resolveActiveAuthorId(prisma, source.authorId, actor.authorId),
      resolveTranslationImage({
        actor,
        source: {
          featuredImageUrl: source.featuredImageUrl || "",
          featuredImagePublicId: source.featuredImagePublicId || "",
          featuredImageAlt: source.featuredImageAlt,
          ogImageUrl: source.ogImageUrl || "",
          ogImagePublicId: source.ogImagePublicId || "",
        },
        translated,
        mode: imageMode,
      }),
      uniqueTranslationSlug(prisma, translated.suggestedSlug, translated.title),
      ensureTranslationGroupForSource(prisma, { id: source.id, translationGroupId: source.translationGroupId }),
    ]);

    if (!categoryId && source.category) {
      warnings.push("The French category could not be resolved automatically; choose an active category before publishing.");
    }
    if (tagResult.failed.length) {
      warnings.push(`Some French tags could not be saved: ${tagResult.failed.join(", ")}.`);
    }
    if (!authorId) {
      warnings.push("The byline could not be resolved automatically; assign an active author before publishing.");
    }
    if (image.warning) warnings.push(image.warning);

    const sourceIsPublished = source.status === "PUBLISHED" && Boolean(source.publishedAt) && source.publishedAt!.getTime() <= Date.now();

    const payload = {
      title: translated.title,
      slug,
      excerpt: translated.excerpt,
      content: translated.articleContent,
      locale: "fr",
      categoryId: categoryId || "",
      authorId,
      // Validation only accepts a published counterpart. Unpublished sources
      // are still linked through the translation group created above.
      translationSourcePostId: sourceIsPublished ? source.id : "",
      tagIds: tagResult.tagIds,
      relatedPostIds,
      seoTitle: translated.seoTitle,
      seoDescription: translated.metaDescription,
      focusKeyword: translated.focusKeyword,
      // The French page canonicalizes to itself; the hreflang alternates come
      // from the translation group, not from a copied English canonical.
      canonicalUrl: "",
      featuredImageUrl: image.featuredImageUrl,
      featuredImagePublicId: image.featuredImagePublicId,
      featuredImageAlt: image.featuredImageAlt,
      ogImageUrl: image.ogImageUrl,
      ogImagePublicId: image.ogImagePublicId,
      ctaTitle: translated.ctaTitle,
      ctaDescription: translated.ctaDescription,
      ctaHref: source.ctaHref || "",
      ctaLabel: translated.ctaLabel,
      featured: false,
      allowIndex: source.allowIndex,
      nofollow: source.nofollow,
      version: 1,
    };

    const created = await createBlogPost(actor, payload, { existingTranslationGroupId: translationGroupId });
    revalidatePath("/admin/blog");
    revalidatePath("/fr/admin/blog");
    revalidatePath("/writer");

    const warning = warnings.join(" ");
    return {
      ok: true,
      message: warning ? `French translation created as a draft. ${warning}` : "French translation created as a draft.",
      warning: warning || undefined,
      id: created.id,
      slug: created.slug,
    };
  } catch (error) {
    return messageFromError(error);
  }
}

export async function createBlogPostAction(formData: FormData): Promise<BlogActionResult> {
  try {
    const actor = await requireBlogUser("blog.posts.create");
    const post = await createBlogPost(actor, payloadFromForm(formData));
    revalidatePath("/admin/blog");
    revalidatePath("/writer");
    return { ok: true, id: post.id, slug: post.slug, version: post.version, message: "Draft created." };
  } catch (error) {
    return messageFromError(error);
  }
}

export async function saveBlogPostAction(formData: FormData): Promise<BlogActionResult> {
  try {
    const actor = await requireBlogUser();
    const id = value(formData, "id");
    if (!id) return { ok: false, error: "Article identifier is required." };
    const prisma = getPrisma();
    const existing = prisma ? await prisma.blogPost.findUnique({ where: { id }, select: { slug: true } }) : null;
    const post = await updateBlogPost({ actor, postId: id, payload: payloadFromForm(formData, { fallbackSlug: existing?.slug }) });
    return { ok: true, id: post.id, slug: post.slug, version: post.version, message: "Draft saved." };
  } catch (error) {
    return messageFromError(error);
  }
}

export async function transitionBlogPostAction(formData: FormData): Promise<BlogActionResult> {
  try {
    const actor = await requireBlogUser();
    const raw = blogTransitionSchema.parse({
      postId: value(formData, "postId"),
      action: value(formData, "action"),
      version: value(formData, "version"),
      scheduledAt: value(formData, "scheduledAt"),
      reviewNote: value(formData, "reviewNote"),
    });
    const scheduledAt = raw.scheduledAt ? new Date(raw.scheduledAt) : null;
    const post = await transitionBlogPost({ actor, postId: raw.postId, action: raw.action, version: raw.version, scheduledAt, reviewNote: raw.reviewNote });
    return { ok: true, id: post.id, slug: post.slug, scheduledAt: post.scheduledAt?.toISOString() || null, version: post.version, message: "Editorial status updated.", issues: post.publicationIssues };
  } catch (error) {
    return messageFromError(error);
  }
}

export async function deleteBlogPostAction(formData: FormData): Promise<BlogActionResult> {
  try {
    const actor = await requireBlogUser("blog.posts.manage");
    await deleteUnpublishedBlogPost(actor, value(formData, "id"));
    return { ok: true, message: "Unpublished draft deleted." };
  } catch (error) {
    return messageFromError(error);
  }
}

export async function createBlogTagAction(formData: FormData): Promise<BlogActionResult> {
  try {
    const actor = await requireBlogUser("blog.categories.manage");
    const prisma = getPrisma();
    if (!prisma) return { ok: false, error: "Editorial database is unavailable." };
    const data = blogTagSchema.parse({ name: value(formData, "name"), slug: value(formData, "slug") || slugify(value(formData, "name")), locale: value(formData, "locale") || "en" });
    const tag = await prisma.blogTag.create({ data });
    await writeAuditLog({ actorId: actor.id, action: "blog.tag_created", entityType: "BlogTag", entityId: tag.id, metadata: { locale: tag.locale, slug: tag.slug } });
    invalidateBlogCache();
    revalidatePath(`/${data.locale}/admin/blog/tags`);
    return { ok: true, id: tag.id, message: "Tag created." };
  } catch (error) {
    return messageFromError(error);
  }
}

export async function saveBlogCategoryAction(formData: FormData): Promise<BlogActionResult> {
  try {
    const actor = await requireBlogUser("blog.categories.manage");
    const prisma = getPrisma();
    if (!prisma) return { ok: false, error: "Editorial database is unavailable." };
    const data = blogCategorySchema.parse({
      id: value(formData, "id") || undefined,
      name: value(formData, "name"),
      slug: value(formData, "slug") || slugify(value(formData, "name")),
      description: value(formData, "description"),
      locale: value(formData, "locale") || "en",
      seoTitle: value(formData, "seoTitle"),
      seoDescription: value(formData, "seoDescription"),
      isActive: checked(formData, "isActive"),
    });
    const category = data.id
      ? await prisma.blogCategory.update({ where: { id: data.id }, data: { name: data.name, slug: data.slug, description: data.description || null, locale: data.locale, seoTitle: data.seoTitle || null, seoDescription: data.seoDescription || null, isActive: data.isActive } })
      : await prisma.blogCategory.create({ data: { name: data.name, slug: data.slug, description: data.description || null, locale: data.locale, seoTitle: data.seoTitle || null, seoDescription: data.seoDescription || null, isActive: data.isActive } });
    await writeAuditLog({ actorId: actor.id, action: data.id ? "blog.category_updated" : "blog.category_created", entityType: "BlogCategory", entityId: category.id, metadata: { locale: category.locale, slug: category.slug } });
    invalidateBlogCache();
    revalidatePath(`/${category.locale}/admin/blog/categories`);
    revalidatePath(`/${category.locale}/blog/category/${category.slug}`);
    return { ok: true, id: category.id, message: "Category saved." };
  } catch (error) {
    return messageFromError(error);
  }
}

export async function deactivateBlogCategoryAction(formData: FormData): Promise<BlogActionResult> {
  try {
    const actor = await requireBlogUser("blog.categories.manage");
    const prisma = getPrisma();
    if (!prisma) return { ok: false, error: "Editorial database is unavailable." };
    const id = value(formData, "id");
    const category = await prisma.blogCategory.update({ where: { id }, data: { isActive: false } });
    await writeAuditLog({ actorId: actor.id, action: "blog.category_deactivated", entityType: "BlogCategory", entityId: id, metadata: { slug: category.slug } });
    revalidatePath(`/${category.locale}/admin/blog/categories`);
    return { ok: true, id, message: "Category deactivated." };
  } catch (error) {
    return messageFromError(error);
  }
}

export async function saveWriterProfileAction(formData: FormData): Promise<BlogActionResult> {
  try {
    const actor = await requireBlogUser("blog.profile.edit.own");
    const prisma = getPrisma();
    if (!prisma || !actor.authorId) return { ok: false, error: "Your account is not linked to an author profile." };
    const data = blogAuthorProfileSchema.parse({
      displayName: value(formData, "displayName"),
      bio: value(formData, "bio"),
      jobTitle: value(formData, "jobTitle"),
      imageUrl: value(formData, "imageUrl"),
      imagePublicId: value(formData, "imagePublicId"),
      websiteUrl: value(formData, "websiteUrl"),
      linkedinUrl: value(formData, "linkedinUrl"),
      xUrl: value(formData, "xUrl"),
    });
    const profile = await prisma.blogAuthor.update({ where: { id: actor.authorId }, data: { ...data, imageUrl: data.imageUrl || null, imagePublicId: data.imagePublicId || null, websiteUrl: data.websiteUrl || null, linkedinUrl: data.linkedinUrl || null, xUrl: data.xUrl || null } });
    await writeAuditLog({ actorId: actor.id, action: "blog.author_profile_updated", entityType: "BlogAuthor", entityId: profile.id });
    invalidateBlogCache();
    revalidatePath("/writer/profile");
    if (profile.slug) revalidatePath(`/en/blog/author/${profile.slug}`);
    if (profile.slug) revalidatePath(`/fr/blog/author/${profile.slug}`);
    return { ok: true, id: profile.id, message: "Author profile saved." };
  } catch (error) {
    return messageFromError(error);
  }
}

export async function inviteWriterAction(formData: FormData): Promise<BlogActionResult> {
  try {
    const actor = await requireBlogUser("blog.writers.manage");
    const prisma = getPrisma();
    if (!prisma) return { ok: false, error: "Editorial database is unavailable." };
    await ensureDefaultAdminRoles(prisma);
    const data = writerInviteSchema.parse({
      name: value(formData, "name"),
      email: value(formData, "email"),
      authorDisplayName: value(formData, "authorDisplayName"),
      authorSlug: value(formData, "authorSlug") || slugify(value(formData, "authorDisplayName")),
      jobTitle: value(formData, "jobTitle"),
      bio: value(formData, "bio"),
    });
    const writerRole = await prisma.adminRole.findUnique({ where: { name: "writer" } });
    if (!writerRole) return { ok: false, error: "Writer role is not configured." };
    const temporaryPassword = `${randomBytes(24).toString("base64url")}A9!`;
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.adminUser.create({ data: { name: data.name, email: data.email, passwordHash: await hashPassword(temporaryPassword), role: "writer", roleId: writerRole.id, status: "INVITED", createdById: actor.id } });
      await tx.blogAuthor.create({ data: { userId: created.id, displayName: data.authorDisplayName, slug: data.authorSlug, bio: data.bio, jobTitle: data.jobTitle || null, isActive: true } });
      return created;
    });
    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://techiadigital.com"}/writer`;
    try {
      await sendWriterInviteEmail({ toEmail: user.email, toName: data.name, temporaryPassword, loginUrl });
      await prisma.adminUser.update({ where: { id: user.id }, data: { status: "ACTIVE" } });
    } catch {
      console.error("blog_writer_invite_email_failed", { userId: user.id });
      return { ok: false, error: "The account was created but the invitation email could not be delivered. It remains disabled until an administrator retries access." };
    }
    await writeAuditLog({ actorId: actor.id, action: "blog.writer_created", entityType: "AdminUser", entityId: user.id, metadata: { role: "writer" } });
    revalidatePath("/admin/blog/writers");
    return { ok: true, id: user.id, message: "Writer account created and invitation sent." };
  } catch (error) {
    return messageFromError(error);
  }
}

export async function resetWriterPasswordAction(formData: FormData): Promise<BlogActionResult> {
  try {
    const actor = await requireBlogUser("blog.writers.manage");
    const prisma = getPrisma();
    if (!prisma) return { ok: false, error: "Editorial database is unavailable." };
    const id = value(formData, "id");
    const target = await prisma.adminUser.findUnique({ where: { id }, include: { roleRef: true } });
    if (!target || target.roleRef?.name !== "writer") return { ok: false, error: "Writer account not found." };
    if (target.roleRef && target.roleRef.level >= actor.roleLevel && actor.roleLevel < 100) return { ok: false, error: "You cannot modify an equal or higher-level account." };
    if (id === actor.id) return { ok: false, error: "Use your profile password form for your own account." };
    const temporaryPassword = `${randomBytes(24).toString("base64url")}A9!`;
    await prisma.adminUser.update({ where: { id }, data: { passwordHash: await hashPassword(temporaryPassword), status: "DISABLED" } });
    try {
      await sendWriterPasswordResetEmail({ toEmail: target.email, toName: target.name || "Writer", temporaryPassword, loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://techiadigital.com"}/writer` });
      await prisma.adminUser.update({ where: { id }, data: { status: "ACTIVE" } });
    } catch {
      return { ok: false, error: "The password was reset, but the reset email could not be delivered. The account remains disabled until delivery succeeds." };
    }
    await writeAuditLog({ actorId: actor.id, action: "blog.writer_password_reset", entityType: "AdminUser", entityId: id });
    revalidatePath("/admin/blog/writers");
    return { ok: true, id, message: "A temporary password was emailed to the writer." };
  } catch (error) {
    return messageFromError(error);
  }
}

export async function setWriterStatusAction(formData: FormData): Promise<BlogActionResult> {
  try {
    const actor = await requireBlogUser("blog.writers.manage");
    const prisma = getPrisma();
    if (!prisma) return { ok: false, error: "Editorial database is unavailable." };
    const id = value(formData, "id");
    const status = z.enum(["ACTIVE", "DISABLED"]).parse(value(formData, "status"));
    if (id === actor.id) return { ok: false, error: "You cannot disable your own account." };
    const targetUser = await prisma.adminUser.findUnique({ where: { id }, include: { roleRef: true } });
    if (!targetUser || targetUser.roleRef?.name !== "writer") return { ok: false, error: "The selected account is not a writer." };
    if (targetUser.roleRef && targetUser.roleRef.level >= actor.roleLevel && actor.roleLevel < 100) return { ok: false, error: "You cannot modify an equal or higher-level account." };
    const target = await prisma.adminUser.update({ where: { id }, data: { status } });
    await writeAuditLog({ actorId: actor.id, action: `blog.writer_${status.toLowerCase()}`, entityType: "AdminUser", entityId: id });
    revalidatePath("/admin/blog/writers");
    return { ok: true, id: target.id, message: status === "ACTIVE" ? "Writer reactivated." : "Writer deactivated." };
  } catch (error) {
    return messageFromError(error);
  }
}

export async function updateWriterRoleAction(formData: FormData): Promise<BlogActionResult> {
  try {
    const actor = await requireBlogUser("blog.writers.manage");
    const prisma = getPrisma();
    if (!prisma) return { ok: false, error: "Editorial database is unavailable." };
    const id = value(formData, "id");
    const roleId = value(formData, "roleId");
    const targetUser = await prisma.adminUser.findUnique({ where: { id }, include: { roleRef: true } });
    if (!targetUser || targetUser.roleRef?.name !== "writer") return { ok: false, error: "The selected account is not a writer." };
    if (targetUser.roleRef && targetUser.roleRef.level >= actor.roleLevel && actor.roleLevel < 100) return { ok: false, error: "You cannot modify an equal or higher-level account." };
    const role = await prisma.adminRole.findUnique({ where: { id: roleId } });
    if (!role) return { ok: false, error: "Role not found." };
    if (role.level >= actor.roleLevel && actor.roleLevel < 100) return { ok: false, error: "You can only assign subordinate roles." };
    const target = await prisma.adminUser.update({ where: { id }, data: { role: role.name, roleId: role.id } });
    await writeAuditLog({ actorId: actor.id, action: "blog.writer_role_changed", entityType: "AdminUser", entityId: id, metadata: { role: role.name } });
    revalidatePath("/admin/blog/writers");
    return { ok: true, id: target.id, message: "Writer role updated." };
  } catch (error) {
    return messageFromError(error);
  }
}

export async function changeWriterPasswordAction(formData: FormData): Promise<BlogActionResult> {
  try {
    const actor = await requireBlogUser();
    const prisma = getPrisma();
    if (!prisma) return { ok: false, error: "Editorial database is unavailable." };
    const data = writerPasswordSchema.parse({ currentPassword: value(formData, "currentPassword"), newPassword: value(formData, "newPassword") });
    const user = await prisma.adminUser.findUnique({ where: { id: actor.id }, select: { passwordHash: true } });
    if (!user?.passwordHash || !(await verifyPassword(data.currentPassword, user.passwordHash))) return { ok: false, error: "Current password is incorrect." };
    await prisma.adminUser.update({ where: { id: actor.id }, data: { passwordHash: await hashPassword(data.newPassword) } });
    await writeAuditLog({ actorId: actor.id, action: "blog.writer_password_changed", entityType: "AdminUser", entityId: actor.id });
    return { ok: true, message: "Password changed. Use the new password for your next sign-in." };
  } catch (error) {
    return messageFromError(error);
  }
}

export async function saveHomepageBlogPicksAction(formData: FormData): Promise<BlogActionResult> {
  try {
    const actor = await requireBlogUser("blog.posts.manage");
    const prisma = getPrisma();
    if (!prisma) return { ok: false, error: "Editorial database is unavailable." };
    const locale = value(formData, "locale");
    if (locale !== "en" && locale !== "fr") return { ok: false, error: "Choose a valid language." };
    const pickIds = normalizeHomepagePicks({ ids: formData.getAll("pickIds") });

    // Only published articles of this language can be promoted, so a stale or
    // hand-crafted id can never place a draft or archived article on the
    // homepage.
    const eligible = await prisma.blogPost.findMany({
      where: { id: { in: pickIds }, locale, status: "PUBLISHED", publishedAt: { lte: new Date() } },
      select: { id: true },
    });
    const eligibleIds = new Set(eligible.map((post) => post.id));
    const orderedIds = pickIds.filter((id) => eligibleIds.has(id));
    const rejected = pickIds.length - orderedIds.length;

    const [, cleared] = await Promise.all([
      prisma.$transaction(
        orderedIds.map((id, index) => prisma.blogPost.update({ where: { id }, data: { showOnHomepage: true, homepageOrder: index } })),
      ),
      prisma.blogPost.updateMany({
        where: { locale, showOnHomepage: true, ...(orderedIds.length ? { id: { notIn: orderedIds } } : {}) },
        data: { showOnHomepage: false, homepageOrder: 0 },
      }),
    ]);

    await writeAuditLog({
      actorId: actor.id,
      action: "blog.homepage_picks_updated",
      entityType: "BlogPost",
      entityId: orderedIds[0] || locale,
      metadata: { locale, order: orderedIds, cleared: cleared.count, rejected },
    });
    invalidateBlogCache();
    revalidatePath(`/${locale}/admin/blog/homepage`);
    revalidatePath(`/${locale}`);
    revalidatePath("/");
    return {
      ok: true,
      message: rejected
        ? `Homepage lineup saved. ${rejected} unavailable ${rejected > 1 ? "articles were" : "article was"} skipped.`
        : orderedIds.length
          ? "Homepage lineup saved."
          : "Homepage lineup cleared. The section will show the most recent articles.",
    };
  } catch (error) {
    return messageFromError(error);
  }
}

export async function updateBlogMediaAltAction(formData: FormData): Promise<BlogActionResult> {
  try {
    await requireBlogUser("blog.media.manage");
    const prisma = getPrisma();
    if (!prisma) return { ok: false, error: "Editorial database is unavailable." };
    const data = blogMediaMetadataSchema.parse({ id: value(formData, "id"), altText: value(formData, "altText") });
    const media = await prisma.blogMedia.update({ where: { id: data.id }, data: { altText: data.altText } });
    await writeAuditLog({ actorId: (await requireBlogUser()).id, action: "blog.media_metadata_updated", entityType: "BlogMedia", entityId: media.id });
    invalidateBlogCache();
    revalidatePath("/admin/blog/media");
    return { ok: true, id: media.id, message: "Media alt text updated." };
  } catch (error) {
    return messageFromError(error);
  }
}
