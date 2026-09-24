import { notFound } from "next/navigation";
import { BlogPostEditor } from "@/components/blog/blog-post-editor";
import { BlogWorkspaceShell } from "@/components/blog/blog-workspace-shell";
import { getBlogCategories, getBlogPostForEditor, getBlogTags } from "@/lib/blog/admin-data";
import { getBlogSessionUser } from "@/lib/blog/auth";
import type { BlogLocale, BlogPostStatusValue } from "@/lib/blog/constants";

export const dynamic = "force-dynamic";

export default async function WriterPostPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: rawLocale, id } = await params;
  if (rawLocale !== "en" && rawLocale !== "fr") notFound();
  const locale = rawLocale as BlogLocale;
  const user = await getBlogSessionUser();
  if (!user) notFound();
  const result = await getBlogPostForEditor(user, id);
  if (!result) notFound();
  const { post } = result;
  const [categories, tags] = await Promise.all([getBlogCategories(locale), getBlogTags(locale)]);
  const editorPost = { id: post.id, title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content, locale: post.locale as BlogLocale, status: post.status as BlogPostStatusValue, version: post.version, categoryId: post.categoryId, authorId: post.authorId, translationGroupId: post.translationGroupId || "", tagIds: post.tags.map(({ tag }) => tag.id), relatedPostIds: post.relatedFrom.map(({ toPostId }) => toPostId), seoTitle: post.seoTitle || "", seoDescription: post.seoDescription || "", focusKeyword: post.focusKeyword || "", canonicalUrl: post.canonicalUrl || "", featuredImageUrl: post.featuredImageUrl || "", featuredImagePublicId: post.featuredImagePublicId || "", featuredImageAlt: post.featuredImageAlt || "", ogImageUrl: post.ogImageUrl || "", ogImagePublicId: post.ogImagePublicId || "", ctaTitle: post.ctaTitle || "", ctaDescription: post.ctaDescription || "", ctaHref: post.ctaHref || "", ctaLabel: post.ctaLabel || "", featured: post.featured, allowIndex: post.allowIndex, nofollow: post.nofollow, scheduledAt: post.scheduledAt?.toISOString() || "", publishedAt: post.publishedAt?.toISOString() || "", authorName: post.author?.displayName || user.name, reviewNotes: post.reviewNotes.map((note) => ({ id: note.id, body: note.body, createdAt: note.createdAt.toISOString(), authorName: note.author?.name || "Editorial team" })), revisions: post.revisions.map((revision) => ({ id: revision.id, version: revision.version, title: revision.title, createdAt: revision.createdAt.toISOString(), authorName: revision.createdBy?.name || "Editorial team" })) };
  return <BlogWorkspaceShell locale={locale} user={user} mode="writer" title="Edit article" description="Make focused improvements, save reliably, and submit the article when it is ready for an administrator."><BlogPostEditor locale={locale} post={editorPost} categories={categories.map((item) => ({ id: item.id, name: item.name }))} tags={tags.map((item) => ({ id: item.id, name: item.name }))} authors={[]} canManage={false} canPublish={false} previewBase={`/${locale}/writer/preview`} /></BlogWorkspaceShell>;
}
