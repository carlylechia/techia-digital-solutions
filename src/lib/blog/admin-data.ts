import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import { hasPermission, type AdminPermission } from "@/lib/admin/permissions";
import { getPrisma } from "@/lib/prisma";
import type { BlogSessionUser } from "./auth";
import { BLOG_ADMIN_PAGE_SIZE, type BlogLocale, type BlogPostStatusValue } from "./constants";

function db() {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Editorial database is unavailable.");
  return prisma;
}

function postScope(user: BlogSessionUser) {
  return hasPermission(user.permissions, "blog.posts.manage") ? {} : { author: { userId: user.id } };
}

export async function getBlogDashboard(user: BlogSessionUser, locale: BlogLocale) {
  const prisma = db();
  const scope = postScope(user);
  const statuses = ["DRAFT", "IN_REVIEW", "CHANGES_REQUESTED", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;
  const [counts, recentPosts, categories, authors, writers, audit] = await Promise.all([
    prisma.blogPost.groupBy({ by: ["status"], where: { ...scope, locale }, orderBy: { status: "asc" }, _count: { _all: true } }),
    prisma.blogPost.findMany({
      where: { ...scope, locale },
      select: { id: true, title: true, slug: true, status: true, updatedAt: true, publishedAt: true, scheduledAt: true, author: { select: { displayName: true, slug: true } }, category: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: BLOG_ADMIN_PAGE_SIZE,
    }),
    hasPermission(user.permissions, "blog.categories.manage")
      ? prisma.blogCategory.findMany({ where: { locale }, select: { id: true, name: true, slug: true, isActive: true, _count: { select: { posts: true } } }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    hasPermission(user.permissions, "blog.posts.manage")
      ? prisma.blogAuthor.findMany({ where: { isActive: true }, select: { id: true, displayName: true, slug: true, userId: true, _count: { select: { posts: true } } }, orderBy: { displayName: "asc" } })
      : Promise.resolve(user.authorId ? prisma.blogAuthor.findMany({ where: { id: user.authorId }, select: { id: true, displayName: true, slug: true, userId: true, _count: { select: { posts: true } } } }) : Promise.resolve([])),
    hasPermission(user.permissions, "blog.writers.manage")
      ? prisma.adminUser.findMany({ where: { roleRef: { name: "writer" } }, select: { id: true, name: true, email: true, status: true, lastLoginAt: true, blogAuthor: { select: { id: true, displayName: true, slug: true } }, _count: { select: { blogPostsCreated: true } } }, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
    hasPermission(user.permissions, "blog.audit.view")
      ? prisma.auditLog.findMany({ where: { entityType: "BlogPost" }, select: { id: true, action: true, entityId: true, createdAt: true, actor: { select: { name: true, email: true } }, metadata: true }, orderBy: { createdAt: "desc" }, take: 20 })
      : Promise.resolve([]),
  ]);

  const countMap = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<(typeof statuses)[number], number>;
  for (const item of counts) countMap[item.status] = item._count._all;
  return {
    counts: { total: Object.values(countMap).reduce((sum, value) => sum + value, 0), ...countMap },
    recentPosts,
    categories,
    authors,
    writers,
    audit,
  };
}

export async function getBlogPostsForList(user: BlogSessionUser, locale: BlogLocale, input: { page?: number; query?: string; status?: string } = {}) {
  const prisma = db();
  const page = Math.max(1, input.page || 1);
  const query = input.query?.trim().slice(0, 100);
  const status = input.status && ["DRAFT", "IN_REVIEW", "CHANGES_REQUESTED", "SCHEDULED", "PUBLISHED", "ARCHIVED"].includes(input.status) ? input.status as BlogPostStatusValue : undefined;
  const where: Prisma.BlogPostWhereInput = {
    ...postScope(user),
    locale,
    ...(status ? { status } : {}),
    ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { excerpt: { contains: query, mode: "insensitive" } }, { slug: { contains: query, mode: "insensitive" } }, { contentText: { contains: query, mode: "insensitive" } }] } : {}),
  };
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({ where, select: { id: true, title: true, slug: true, status: true, updatedAt: true, publishedAt: true, scheduledAt: true, author: { select: { displayName: true, slug: true } }, category: { select: { name: true } } }, orderBy: { updatedAt: "desc" }, skip: (page - 1) * BLOG_ADMIN_PAGE_SIZE, take: BLOG_ADMIN_PAGE_SIZE }),
    prisma.blogPost.count({ where }),
  ]);
  return { posts, total, page, pageCount: Math.max(1, Math.ceil(total / BLOG_ADMIN_PAGE_SIZE)) };
}

export async function getBlogPostForEditor(user: BlogSessionUser, postId: string) {
  const prisma = db();
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    include: {
      author: { select: { id: true, displayName: true, slug: true, userId: true, bio: true, jobTitle: true, imageUrl: true } },
      category: { select: { id: true, name: true, slug: true, locale: true, isActive: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true, locale: true } } } },
      relatedFrom: { select: { toPostId: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
      reviewNotes: { include: { author: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: "desc" } },
      revisions: { select: { id: true, version: true, title: true, excerpt: true, createdAt: true, createdBy: { select: { name: true } } }, orderBy: { version: "desc" }, take: 20 },
    },
  });
  if (!post) return null;
  const canManage = hasPermission(user.permissions, "blog.posts.manage");
  if (!canManage && post.author?.userId !== user.id) return null;
  return { post, canManage };
}

export async function getWriterProfile(user: BlogSessionUser) {
  if (!user.authorId) return null;
  return db().blogAuthor.findUnique({ where: { id: user.authorId }, select: { id: true, displayName: true, slug: true, bio: true, jobTitle: true, imageUrl: true, imagePublicId: true, websiteUrl: true, linkedinUrl: true, xUrl: true, isActive: true } });
}

export async function getBlogCategories(locale: BlogLocale) {
  return db().blogCategory.findMany({ where: { locale }, select: { id: true, name: true, slug: true, description: true, locale: true, seoTitle: true, seoDescription: true, isActive: true, _count: { select: { posts: true } } }, orderBy: { name: "asc" } });
}

export async function getBlogAuthors() {
  return db().blogAuthor.findMany({ select: { id: true, displayName: true, slug: true, userId: true, isActive: true }, orderBy: { displayName: "asc" } });
}

export async function getBlogTags(locale: BlogLocale) {
  return db().blogTag.findMany({ where: { locale }, select: { id: true, name: true, slug: true, _count: { select: { posts: true } } }, orderBy: { name: "asc" } });
}

export async function getBlogMedia(limit = 60) {
  return db().blogMedia.findMany({ select: { id: true, publicId: true, url: true, format: true, mimeType: true, width: true, height: true, bytes: true, altText: true, createdAt: true, uploadedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: Math.min(100, Math.max(1, limit)) });
}

/**
 * Lineup editor for the homepage featured insights section: the current picks
 * in display order, plus every published article of the locale that an editor
 * can still add.
 */
export async function getHomepagePickOptions(locale: BlogLocale) {
  return db().blogPost.findMany({
    where: { locale, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    select: {
      id: true,
      title: true,
      slug: true,
      showOnHomepage: true,
      homepageOrder: true,
      publishedAt: true,
      readingTime: true,
      category: { select: { name: true } },
    },
    orderBy: [{ showOnHomepage: "desc" }, { homepageOrder: "asc" }, { publishedAt: "desc" }],
    take: 100,
  });
}

export async function getBlogRoles() {
  return db().adminRole.findMany({ where: { name: { in: ["writer", "editor", "content_manager", "admin"] } }, select: { id: true, name: true, label: true, level: true }, orderBy: { level: "desc" } });
}

export async function getBlogWriters() {
  return db().adminUser.findMany({ where: { roleRef: { name: "writer" } }, select: { id: true, name: true, email: true, status: true, lastLoginAt: true, createdAt: true, blogAuthor: { select: { id: true, displayName: true, slug: true, isActive: true } }, _count: { select: { blogPostsCreated: true } } }, orderBy: { createdAt: "desc" } });
}

export function canUseBlogPermission(user: BlogSessionUser, permission: AdminPermission) {
  return hasPermission(user.permissions, permission);
}

export type BlogAdminPrisma = PrismaClient;
