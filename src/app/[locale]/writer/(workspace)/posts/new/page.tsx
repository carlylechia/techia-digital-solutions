import { notFound } from "next/navigation";
import { BlogPostEditor } from "@/components/blog/blog-post-editor";
import { BlogWorkspaceShell } from "@/components/blog/blog-workspace-shell";
import { getBlogCategories, getBlogTags, getWriterProfile } from "@/lib/blog/admin-data";
import { getBlogSessionUser } from "@/lib/blog/auth";
import type { BlogLocale, BlogPostStatusValue } from "@/lib/blog/constants";

export const dynamic = "force-dynamic";

export default async function NewWriterPostPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "fr") notFound();
  const locale = rawLocale as BlogLocale;
  const user = await getBlogSessionUser();
  if (!user) notFound();
  const [categories, tags, profile] = await Promise.all([getBlogCategories(locale), getBlogTags(locale), getWriterProfile(user)]);
  const defaultPost = { id: "new", title: "", slug: "", excerpt: "", content: "<p></p>", locale, status: "DRAFT" as BlogPostStatusValue, version: 1, categoryId: null, authorId: profile?.id || user.authorId, translationGroupId: "", tagIds: [], relatedPostIds: [], seoTitle: "", seoDescription: "", focusKeyword: "", canonicalUrl: "", featuredImageUrl: "", featuredImagePublicId: "", featuredImageAlt: "", ogImageUrl: "", ogImagePublicId: "", ctaTitle: "", ctaDescription: "", ctaHref: "", ctaLabel: "", featured: false, allowIndex: true, nofollow: false, scheduledAt: "", publishedAt: "", authorName: profile?.displayName || user.name, reviewNotes: [], revisions: [] };
  return <BlogWorkspaceShell locale={locale} user={user} mode="writer" title="Create an article" description="Start with a clear reader problem, useful guidance, and a natural next step for the right teChia solution."><BlogPostEditor locale={locale} post={defaultPost} categories={categories.map((item) => ({ id: item.id, name: item.name }))} tags={tags.map((item) => ({ id: item.id, name: item.name }))} authors={profile ? [{ id: profile.id, name: profile.displayName, displayName: profile.displayName }] : []} canManage={false} canPublish={false} isNew /></BlogWorkspaceShell>;
}
