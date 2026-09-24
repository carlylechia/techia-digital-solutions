"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";
import { ensureDefaultAdminRoles } from "@/lib/admin/bootstrap";
import { writeAuditLog } from "@/lib/admin/session";
import { getPrisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { sendWriterInviteEmail, sendWriterPasswordResetEmail } from "@/lib/email";
import { requireBlogUser, BlogAuthorizationError } from "./auth";
import { blogAuthorProfileSchema, blogCategorySchema, blogMediaMetadataSchema, blogPostPayloadSchema, blogTagSchema, blogTransitionSchema, writerInviteSchema, writerPasswordSchema, type BlogPostPayload } from "./validation";
import { BlogConflictError, BlogPublicationError, createBlogPost, deleteUnpublishedBlogPost, invalidateBlogCache, transitionBlogPost, updateBlogPost } from "./service";
import { slugify } from "./slug";

export type BlogActionResult = { ok: true; message: string; id?: string; version?: number; issues?: Array<{ field: string; message: string; severity: "error" | "warning" }> } | { ok: false; error: string; issues?: Array<{ field: string; message: string; severity: "error" | "warning" }> };

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

function payloadFromForm(formData: FormData): BlogPostPayload {
  return blogPostPayloadSchema.parse({
    title: value(formData, "title"),
    slug: value(formData, "slug"),
    excerpt: value(formData, "excerpt"),
    content: value(formData, "content"),
    locale: value(formData, "locale") || "en",
    categoryId: value(formData, "categoryId"),
    authorId: value(formData, "authorId"),
    translationGroupId: value(formData, "translationGroupId"),
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

export async function createBlogPostAction(formData: FormData): Promise<BlogActionResult> {
  try {
    const actor = await requireBlogUser("blog.posts.create");
    const post = await createBlogPost(actor, payloadFromForm(formData));
    revalidatePath("/admin/blog");
    revalidatePath("/writer");
    return { ok: true, id: post.id, version: post.version, message: "Draft created." };
  } catch (error) {
    return messageFromError(error);
  }
}

export async function saveBlogPostAction(formData: FormData): Promise<BlogActionResult> {
  try {
    const actor = await requireBlogUser();
    const id = value(formData, "id");
    if (!id) return { ok: false, error: "Article identifier is required." };
    const post = await updateBlogPost({ actor, postId: id, payload: payloadFromForm(formData) });
    return { ok: true, id: post.id, version: post.version, message: "Draft saved." };
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
    return { ok: true, id: post.id, version: post.version, message: "Editorial status updated.", issues: post.publicationIssues };
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
