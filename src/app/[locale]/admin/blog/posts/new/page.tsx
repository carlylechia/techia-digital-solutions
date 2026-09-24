import { notFound } from "next/navigation";
import { hasPermission } from "@/lib/admin/permissions";
import { BlogPostEditor } from "@/components/blog/blog-post-editor";
import { BlogWorkspaceShell } from "@/components/blog/blog-workspace-shell";
import { getBlogAuthors, getBlogCategories, getBlogTags } from "@/lib/blog/admin-data";
import { getBlogSessionUser } from "@/lib/blog/auth";
import type { BlogLocale, BlogPostStatusValue } from "@/lib/blog/constants";

export const dynamic = "force-dynamic";

export default async function NewAdminBlogPostPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "fr") notFound();
  const locale = rawLocale as BlogLocale;
  const user = await getBlogSessionUser();
  if (!user || !hasPermission(user.permissions, "blog.posts.manage") || !hasPermission(user.permissions, "blog.posts.create")) notFound();
  const canManage = hasPermission(user.permissions, "blog.posts.manage");
  const canPublish = hasPermission(user.permissions, "blog.posts.publish");
  const [categories, tags, authors] = await Promise.all([getBlogCategories(locale), getBlogTags(locale), getBlogAuthors()]);
  const defaultAuthor = authors.find((author) => author.isActive) || authors[0];
  const defaultPost = { id: "new", title: "", slug: "", excerpt: "", content: "<p></p>", locale, status: "DRAFT" as BlogPostStatusValue, version: 1, categoryId: null, authorId: defaultAuthor?.id || null, translationGroupId: "", tagIds: [], relatedPostIds: [], seoTitle: "", seoDescription: "", focusKeyword: "", canonicalUrl: "", featuredImageUrl: "", featuredImagePublicId: "", featuredImageAlt: "", ogImageUrl: "", ogImagePublicId: "", ctaTitle: "", ctaDescription: "", ctaHref: "", ctaLabel: "", featured: false, allowIndex: true, nofollow: false, scheduledAt: "", publishedAt: "", authorName: defaultAuthor?.displayName || user.name, reviewNotes: [], revisions: [] };
  return <BlogWorkspaceShell locale={locale} user={user} mode="admin" title="Create an article" description="Create a human, useful article and route it to the right author, category, and commercial journey."><BlogPostEditor locale={locale} post={defaultPost} categories={categories.map((item) => ({ id: item.id, name: item.name, isActive: item.isActive }))} tags={tags.map((item) => ({ id: item.id, name: item.name }))} authors={authors.map((item) => ({ id: item.id, name: item.displayName, displayName: item.displayName, isActive: item.isActive }))} canManage={canManage} canPublish={canPublish} isNew previewBase={`/${locale}/admin/blog/preview`} /></BlogWorkspaceShell>;
}
