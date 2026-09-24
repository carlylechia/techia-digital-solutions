import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getBlogCategoryPath, getBlogIndexPath, getBlogPostPath, type BlogLocale } from "@/lib/blog/slug";

export type BlogBreadcrumb = { label: string; href?: string };

export function BlogBreadcrumbs({ locale, items }: { locale: BlogLocale; items: BlogBreadcrumb[] }) {
  return (
    <nav aria-label={locale === "fr" ? "Fil d’Ariane" : "Breadcrumb"} className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
          {index > 0 ? <ChevronRight className="size-3.5 text-muted/60" aria-hidden="true" /> : null}
          {item.href ? <Link href={item.href} className="transition hover:text-accent">{item.label}</Link> : <span aria-current="page" className="text-primary">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function getArticleBreadcrumbs(locale: BlogLocale, post: { title: string; slug: string; category: { name: string; slug: string } | null; author: { slug: string; displayName: string } | null }): BlogBreadcrumb[] {
  return [
    { label: "Home", href: "/" },
    { label: "Blog", href: getBlogIndexPath(locale) },
    ...(post.category ? [{ label: post.category.name, href: getBlogCategoryPath(locale, post.category.slug) }] : []),
    { label: post.title, href: getBlogPostPath(locale, post.slug) },
  ];
}
