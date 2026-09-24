import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasPermission } from "@/lib/admin/permissions";
import { BlogPreview } from "@/components/blog/blog-preview";
import { getBlogPostForEditor } from "@/lib/blog/admin-data";
import { getBlogSessionUser } from "@/lib/blog/auth";
import type { BlogLocale } from "@/lib/blog/constants";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true } };

export default async function AdminBlogPreviewPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: rawLocale, id } = await params;
  if (rawLocale !== "en" && rawLocale !== "fr") notFound();
  const locale = rawLocale as BlogLocale;
  const user = await getBlogSessionUser();
  if (!user || !hasPermission(user.permissions, "blog.posts.manage")) notFound();
  const result = await getBlogPostForEditor(user, id);
  if (!result) notFound();
  const post = result.post;
  return <BlogPreview locale={locale} backHref={`/${locale}/admin/blog/posts/${post.id}`} post={{ title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content, locale: post.locale as BlogLocale, status: post.status, featuredImageUrl: post.featuredImageUrl, featuredImageAlt: post.featuredImageAlt, readingTime: post.readingTime, category: post.category ? { name: post.category.name, slug: post.category.slug } : null, author: post.author ? { displayName: post.author.displayName, slug: post.author.slug, jobTitle: post.author.jobTitle, imageUrl: post.author.imageUrl } : null, ctaTitle: post.ctaTitle, ctaDescription: post.ctaDescription, ctaHref: post.ctaHref, ctaLabel: post.ctaLabel }} />;
}
