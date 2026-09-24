import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogBreadcrumbs } from "@/components/blog/blog-breadcrumbs";
import { BlogCard } from "@/components/blog/blog-card";
import { JsonLd } from "@/components/ui/json-ld";
import { getDictionary, isLocale, siteConfig, type Locale } from "@/content/site";
import { getPublishedCategory, getPublishedPosts } from "@/lib/blog/queries";
import { getBlogCategoryPath, getBlogIndexPath, type BlogLocale } from "@/lib/blog/slug";
import { createMetadata } from "@/lib/seo";

export const revalidate = 300;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const category = await getPublishedCategory(locale, slug);
  if (!category) return createMetadata({ locale, title: "Category not found — teChia", description: "Explore teChia insights.", canonicalPath: getBlogIndexPath(locale) });
  return createMetadata({
    locale,
    title: category.seoTitle || `${category.name} — teChia Insights`,
    description: category.seoDescription || category.description || `Practical teChia insights about ${category.name.toLowerCase()}.`,
    canonicalPath: getBlogCategoryPath(locale, category.slug),
  });
}

export default async function BlogCategoryPage({ params, searchParams }: { params: Promise<{ locale: string; slug: string }>; searchParams: SearchParams }) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as BlogLocale;
  const category = await getPublishedCategory(locale, slug);
  if (!category) notFound();
  const queryParams = await searchParams;
  const parsedPage = Number.parseInt(firstValue(queryParams.page), 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const { posts, total } = await getPublishedPosts({ locale, page, categorySlug: category.slug });
  const dict = getDictionary(rawLocale as Locale);
  const pageCount = Math.max(1, Math.ceil(total / 9));
  const canonical = `${siteConfig.url}${getBlogCategoryPath(locale, category.slug)}`;

  return (
    <main>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: category.name, description: category.description || undefined, url: canonical, isPartOf: { "@type": "Blog", name: dict.pages.blog.title, url: `${siteConfig.url}${getBlogIndexPath(locale)}` } }} />
      <div className="container pt-6 sm:pt-10">
        <BlogBreadcrumbs locale={locale} items={[{ label: "Home", href: "/" }, { label: dict.nav.blog, href: getBlogIndexPath(locale) }, { label: category.name }]} />
        <header className="max-w-3xl py-8 sm:py-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{dict.nav.blog} · Topic</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-primary sm:text-6xl">{category.name}</h1>
          {category.description ? <p className="mt-5 text-lg leading-8 text-muted">{category.description}</p> : null}
        </header>
        {posts.length ? <div className="grid gap-5 pb-12 md:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <BlogCard key={post.id} post={post} />)}</div> : <div className="rounded-[1.5rem] border border-dashed border-border p-10 text-center"><p className="text-lg font-semibold text-primary">No published articles in this topic yet.</p><Link href={getBlogIndexPath(locale)} className="mt-4 inline-flex text-sm font-semibold text-accent hover:underline">Explore all insights</Link></div>}
        {pageCount > 1 ? <nav className="flex justify-center gap-2 pb-16" aria-label="Category pagination">{Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <Link key={number} href={`${getBlogCategoryPath(locale, category.slug)}?page=${number}`} className={`grid size-10 place-items-center rounded-full border text-sm font-semibold ${number === page ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:border-accent"}`} aria-current={number === page ? "page" : undefined}>{number}</Link>)}</nav> : null}
      </div>
    </main>
  );
}
