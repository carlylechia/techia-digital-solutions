import { notFound } from "next/navigation";
import { hasPermission } from "@/lib/admin/permissions";
import { BlogWorkspaceShell } from "@/components/blog/blog-workspace-shell";
import { WriterManager } from "@/components/blog/writer-manager";
import { getBlogRoles, getBlogWriters } from "@/lib/blog/admin-data";
import { getBlogSessionUser } from "@/lib/blog/auth";
import type { BlogLocale } from "@/lib/blog/constants";

export const dynamic = "force-dynamic";

export default async function AdminBlogWritersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "fr") notFound();
  const locale = rawLocale as BlogLocale;
  const user = await getBlogSessionUser();
  if (!user || !hasPermission(user.permissions, "blog.writers.manage")) notFound();
  const [writers, roles] = await Promise.all([getBlogWriters(), getBlogRoles()]);
  return <BlogWorkspaceShell locale={locale} user={user} mode="admin" title="Writers" description="Invite external writers with the minimum access they need, and revoke or change access without touching client or business data."><WriterManager writers={writers.map((writer) => ({ id: writer.id, name: writer.name, email: writer.email, status: writer.status, lastLoginAt: writer.lastLoginAt?.toISOString() || null, author: writer.blogAuthor ? { displayName: writer.blogAuthor.displayName, slug: writer.blogAuthor.slug, isActive: writer.blogAuthor.isActive } : null, articles: writer._count.blogPostsCreated }))} roles={roles.map((role) => ({ id: role.id, name: role.name, label: role.label, level: role.level }))} /></BlogWorkspaceShell>;
}
