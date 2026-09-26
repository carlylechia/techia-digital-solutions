import { notFound } from "next/navigation";
import { hasPermission } from "@/lib/admin/permissions";
import { BlogWorkspaceShell } from "@/components/blog/blog-workspace-shell";
import { CategoryManager } from "@/components/blog/category-manager";
import { getBlogCategories } from "@/lib/blog/admin-data";
import { getBlogSessionUser } from "@/lib/blog/auth";
import type { BlogLocale } from "@/lib/blog/constants";

export const dynamic = "force-dynamic";

export default async function AdminBlogCategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "fr") notFound();
  const locale = rawLocale as BlogLocale;
  const user = await getBlogSessionUser();
  if (!user || !hasPermission(user.permissions, "blog.categories.manage")) notFound();
  const categories = await getBlogCategories(locale);
  const isFrench = locale === "fr";
  return <BlogWorkspaceShell locale={locale} user={user} mode="admin" title={isFrench ? "Catégories" : "Categories"} description={isFrench ? "Utilisez une taxonomie courte et utile pour aider les lecteurs à trouver des conseils réellement proches." : "Use a small, meaningful taxonomy that helps readers discover genuinely related guidance."}><CategoryManager locale={locale} categories={categories.map((category) => ({ id: category.id, name: category.name, slug: category.slug, description: category.description || "", locale: category.locale as BlogLocale, seoTitle: category.seoTitle || "", seoDescription: category.seoDescription || "", isActive: category.isActive, posts: category._count.posts }))} /></BlogWorkspaceShell>;
}
