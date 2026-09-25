import { notFound } from "next/navigation";
import { hasPermission } from "@/lib/admin/permissions";
import { BlogWorkspaceShell } from "@/components/blog/blog-workspace-shell";
import { HomepagePicksManager } from "@/components/blog/homepage-picks-manager";
import { getHomepagePickOptions } from "@/lib/blog/admin-data";
import { getBlogSessionUser } from "@/lib/blog/auth";
import { BLOG_HOMEPAGE_PICKS_LIMIT, type BlogLocale } from "@/lib/blog/constants";

export const dynamic = "force-dynamic";

export default async function AdminBlogHomepagePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "fr") notFound();
  const locale = rawLocale as BlogLocale;
  const user = await getBlogSessionUser();
  if (!user || !hasPermission(user.permissions, "blog.posts.manage")) notFound();
  const articles = await getHomepagePickOptions(locale);
  const options = articles.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
    readingTime: post.readingTime,
    categoryName: post.category?.name || "",
  }));
  const initialPicks = articles
    .filter((post) => post.showOnHomepage)
    .sort((first, second) => first.homepageOrder - second.homepageOrder)
    .slice(0, BLOG_HOMEPAGE_PICKS_LIMIT)
    .map((post) => post.id);

  return (
    <BlogWorkspaceShell
      locale={locale}
      user={user}
      mode="admin"
      title="Homepage"
      description="Choose which published articles lead the reading section of your homepage, and the order visitors see them in."
    >
      <HomepagePicksManager locale={locale} options={options} limit={BLOG_HOMEPAGE_PICKS_LIMIT} initialPicks={initialPicks} />
    </BlogWorkspaceShell>
  );
}
