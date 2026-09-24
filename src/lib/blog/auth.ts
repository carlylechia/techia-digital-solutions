import "server-only";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DEFAULT_ADMIN_ROLES, hasPermission, normalizePermissions, type AdminPermission } from "@/lib/admin/permissions";
import { getPrisma } from "@/lib/prisma";

export class BlogAuthorizationError extends Error {
  readonly status: 401 | 403;

  constructor(message: string, status: 401 | 403) {
    super(message);
    this.name = "BlogAuthorizationError";
    this.status = status;
  }
}

export type BlogSessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  roleLevel: number;
  permissions: AdminPermission[];
  authorId: string | null;
};

export async function getBlogSessionUser(): Promise<BlogSessionUser | null> {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) return null;

  const prisma = getPrisma();
  if (!prisma) return null;

  // Authorization is re-read from PostgreSQL on every sensitive operation. The
  // JWT improves UX, but a stale token can never preserve revoked permissions.
  const user = await prisma.adminUser.findUnique({
    where: { id: sessionUserId },
    include: { roleRef: true, blogAuthor: { select: { id: true } } },
  });
  if (!user || user.status !== "ACTIVE") return null;

  const permissions = normalizePermissions(
    user.roleRef?.permissions || (user.role === "super_admin" ? DEFAULT_ADMIN_ROLES[0].permissions : []),
  );

  return {
    id: user.id,
    email: user.email,
    name: user.name || user.email,
    role: user.roleRef?.name || user.role,
    roleLevel: user.roleRef?.level || (user.role === "super_admin" ? 100 : 0),
    permissions,
    authorId: user.blogAuthor?.id || null,
  };
}

export async function requireBlogUser(permission?: AdminPermission) {
  const user = await getBlogSessionUser();
  if (!user) throw new BlogAuthorizationError("Authentication is required.", 401);
  if (permission && !hasPermission(user.permissions, permission)) {
    throw new BlogAuthorizationError("You do not have permission to perform this action.", 403);
  }
  return user;
}

export async function requireBlogPostAccess(postId: string, permission?: AdminPermission) {
  const user = await requireBlogUser(permission);
  const prisma = getPrisma();
  if (!prisma) throw new BlogAuthorizationError("Editorial data is unavailable.", 401);

  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      author: { select: { userId: true } },
    },
  });
  if (!post) throw new BlogAuthorizationError("Article not found.", 403);

  const canManage = hasPermission(user.permissions, "blog.posts.manage");
  const ownsPost = post.author?.userId === user.id;
  if (!canManage && !ownsPost) {
    throw new BlogAuthorizationError("You can only access your own articles.", 403);
  }

  return { user, post, canManage, ownsPost };
}

export function isBlogEditor(user: BlogSessionUser) {
  return hasPermission(user.permissions, "blog.posts.manage");
}

export function isBlogPublisher(user: BlogSessionUser) {
  return hasPermission(user.permissions, "blog.posts.publish");
}

export function canUseGeneralAdmin(user: BlogSessionUser) {
  return hasPermission(user.permissions, "dashboard.view") && !hasPermission(user.permissions, "blog.profile.edit.own");
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("host");
  if (!host) throw new BlogAuthorizationError("Invalid request origin.", 403);
  try {
    if (new URL(origin).host !== host) throw new BlogAuthorizationError("Invalid request origin.", 403);
  } catch (error) {
    if (error instanceof BlogAuthorizationError) throw error;
    throw new BlogAuthorizationError("Invalid request origin.", 403);
  }
}
