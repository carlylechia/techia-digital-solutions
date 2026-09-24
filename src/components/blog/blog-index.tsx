import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { BlogCard } from "./blog-card";
import { LegacyBlogCard } from "./legacy-blog-card";
import { getBlogHome, getPublishedPosts } from "@/lib/blog/queries";
import type { BlogLocale } from "@/lib/blog/slug";
import { getBlogCategoryPath, getBlogIndexPath } from "@/lib/blog/slug";
import { getDictionary, siteConfig, type Locale } from "@/content/site";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import { JsonLd } from "@/components/ui/json-ld";

function withQuery(path: string, page: number, query: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (query) params.set("q", query);
  const suffix = params.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export async function BlogIndex({
  locale: siteLocale,
  page = 1,
  query = "",
  category = "",
}: {
  locale: Locale;
  page?: number;
  query?: string;
  category?: string;
}) {
  const locale = siteLocale as BlogLocale;
  const dict = getDictionary(siteLocale);
  const [home, filtered] = await Promise.all([
    getBlogHome(locale),
    getPublishedPosts({ locale, page, query: query || undefined, categorySlug: category || undefined, excludeFeatured: !query && !category }),
  ]);
  const hasCmsContent = Boolean(home.featured || home.latest.length);
  const posts = filtered.posts;
  const total = filtered.total;
  const pageCount = Math.max(1, Math.ceil(total / 9));

  const collectionItems = [
    ...(home.featured ? [home.featured] : []),
    ...home.latest,
  ].map((post, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${siteConfig.url}${getBlogIndexPath(locale)}/${post.slug}`,
    name: post.title,
  }));
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: dict.pages.blog.title,
    description: dict.pages.blog.metaDescription,
    url: `https://techiadigital.com${getBlogIndexPath(locale)}`,
    blogPost: collectionItems,
  };

  return (
    <main>
      <JsonLd data={collectionSchema} />
      <PremiumPageHero
        locale={siteLocale}
        eyebrow={dict.nav.blog}
        title={dict.pages.blog.title}
        description={dict.pages.blog.description}
        badges={home.categories.length ? home.categories.map((categoryItem) => categoryItem.name) : dict.blog.slice(0, 4).map((item) => item.title)}
        actions={[{ href: "/start-project", label: dict.common.startProject }]}
      />
      <section className="container pb-8 pt-4" aria-label="Blog search and filters">
        <div className="grid gap-4 rounded-[1.5rem] border border-border bg-surface-strong/60 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <form className="relative" method="get" action={getBlogIndexPath(locale)}>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <label htmlFor="blog-search" className="sr-only">Search articles</label>
            <input id="blog-search" name="q" defaultValue={query} className="form-input pl-10" placeholder={locale === "fr" ? "Rechercher un article" : "Search practical insights"} />
          </form>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted"><SlidersHorizontal className="size-4" /><span>{locale === "fr" ? "Explorer par thème" : "Explore by topic"}</span></div>
          <nav className="flex flex-wrap gap-2 lg:col-span-2" aria-label="Blog categories">
            <Link href={getBlogIndexPath(locale)} className={`rounded-full border px-3 py-2 transition ${!category ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:border-accent hover:text-primary"}`}>{locale === "fr" ? "Tous" : "All"}</Link>
            {home.categories.map((categoryItem) => <Link key={categoryItem.id} href={getBlogCategoryPath(locale, categoryItem.slug)} className="rounded-full border border-border px-3 py-2 text-muted transition hover:border-accent hover:text-primary">{categoryItem.name}</Link>)}
          </nav>
        </div>
      </section>

      {hasCmsContent ? (
        <>
          {home.featured && !query && !category ? (
            <section className="container pb-12" aria-labelledby="featured-article">
              <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Editor&apos;s pick</p><h2 id="featured-article" className="mt-2 text-3xl font-semibold tracking-tight text-primary">Featured insight</h2></div></div>
              <BlogCard post={home.featured} featured />
            </section>
          ) : null}
          <section className="container pb-12" aria-labelledby="latest-articles">
            <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{query || category ? "Filtered reading" : "Fresh thinking"}</p><h2 id="latest-articles" className="mt-2 text-3xl font-semibold tracking-tight text-primary">{query ? `Results for “${query}”` : "Latest articles"}</h2></div><span className="text-sm text-muted">{total} {locale === "fr" ? "articles" : "articles"}</span></div>
            {posts.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <BlogCard key={post.id} post={post} />)}</div> : <div className="rounded-[1.5rem] border border-dashed border-border p-10 text-center"><p className="text-lg font-semibold text-primary">No published articles match that search.</p><p className="mt-2 text-sm text-muted">Try a broader topic or explore all articles.</p></div>}
            {pageCount > 1 ? <nav className="mt-8 flex justify-center gap-2" aria-label="Blog pagination">{Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <Link key={number} href={withQuery(getBlogIndexPath(locale), number, query)} className={`grid size-10 place-items-center rounded-full border text-sm font-semibold ${number === page ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:border-accent"}`} aria-current={number === page ? "page" : undefined}>{number}</Link>)}</nav> : null}
          </section>
        </>
      ) : (
        <section className="container pb-12" aria-labelledby="legacy-articles">
          <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">teChia insights</p><h2 id="legacy-articles" className="mt-2 text-3xl font-semibold tracking-tight text-primary">Latest articles</h2></div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{dict.blog.map((item) => <LegacyBlogCard key={item.slug} item={item} locale={siteLocale} />)}</div>
        </section>
      )}
      <PremiumPageCta locale={siteLocale} title={dict.home.finalCtaTitle} description={dict.home.finalCtaBody} primaryAction={{ href: "/start-project", label: dict.common.startProject }} secondaryAction={{ href: "/contact", label: dict.nav.contact }} />
    </main>
  );
}
