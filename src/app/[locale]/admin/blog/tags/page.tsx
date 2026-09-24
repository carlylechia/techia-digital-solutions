import { notFound } from "next/navigation";
import { BlogWorkspaceShell } from "@/components/blog/blog-workspace-shell";
import { TagManager } from "@/components/blog/tag-manager";
import { getBlogTags } from "@/lib/blog/admin-data";
import { getBlogSessionUser } from "@/lib/blog/auth";
import type { BlogLocale } from "@/lib/blog/constants";

export const dynamic = "force-dynamic";

export default async function AdminBlogTagsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "fr") notFound();
  const locale = rawLocale as BlogLocale;
  const user = await getBlogSessionUser();
  if (!user) notFound();
  const tags = await getBlogTags(locale);
  return <BlogWorkspaceShell locale={locale} user={user} mode="admin" title="Tags" description="Use a small set of meaningful tags to help writers connect related ideas without creating thin indexable tag pages."><TagManager locale={locale} tags={tags.map((tag) => ({ id: tag.id, name: tag.name, slug: tag.slug, articles: tag._count.posts }))} /></BlogWorkspaceShell>;
}
