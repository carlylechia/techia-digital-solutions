import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { BlogCard } from "./blog-card";
import { LegacyBlogCard } from "./legacy-blog-card";
import { getBlogHome, getPublishedPosts } from "@/lib/blog/queries";
import type { BlogLocale } from "@/lib/blog/slug";
import { getBlogCategoryPath, getBlogIndexPath } from "@/lib/blog/slug";
import { BLOG_PAGE_SIZE } from "@/lib/blog/constants";
import { getBlogUiCopy } from "@/lib/blog/copy";
import { getDictionary, siteConfig, type Locale } from "@/content/site";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import { JsonLd } from "@/components/ui/json-ld";

function withQuery(path: string, page: number, query: string, category: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (query) params.set("q", query);
  if (category) params.set("category", category);
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
  const ui = getBlogUiCopy(locale);
  const isFiltered = Boolean(query || category);
  const home = await getBlogHome(locale);
  const filtered = await getPublishedPosts({
    locale,
    page,
    query: query || undefined,
    categorySlug: category || undefined,
    // Hide only the article already rendered as the editor's pick. The rest of
    // the published blog must stay visible, including other featured articles.
    excludePostId: isFiltered ? undefined : home.featured?.id,
  });
  const hasCmsContent = Boolean(home.featured || home.latest.length);
  const posts = filtered.posts;
  const total = filtered.total;
  const pageCount = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE));
  // When the featured article is the only published one, the grid is redundant.
  const showLatestSection = isFiltered || !home.featured || posts.length > 0;
  // The rolling-migration fallback only ever lists articles that exist in this
  // language. French is never padded with the English starter set, because a
  // French visitor must not be offered an article that is not in French.
  const showLegacyFallback = !hasCmsContent && locale === "en";
  const otherLocale: BlogLocale = locale === "fr" ? "en" : "fr";

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
      <section className="container pb-8 pt-4" aria-label={ui.filtersLabel}>
        <div className="grid gap-4 rounded-[1.5rem] border border-border bg-surface-strong/60 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <form className="relative" method="get" action={getBlogIndexPath(locale)}>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <label htmlFor="blog-search" className="sr-only">{ui.searchLabel}</label>
            <input id="blog-search" name="q" defaultValue={query} className="form-input pl-10" placeholder={ui.searchPlaceholder} />
          </form>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted"><SlidersHorizontal className="size-4" /><span>{ui.exploreByTopic}</span></div>
          <nav className="flex flex-wrap gap-2 lg:col-span-2" aria-label={ui.categoriesNavLabel}>
            <Link href={getBlogIndexPath(locale)} className={`rounded-full border px-3 py-2 transition ${!category ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:border-accent hover:text-primary"}`}>{ui.allTopics}</Link>
            {home.categories.map((categoryItem) => <Link key={categoryItem.id} href={getBlogCategoryPath(locale, categoryItem.slug)} className="rounded-full border border-border px-3 py-2 text-muted transition hover:border-accent hover:text-primary">{categoryItem.name}</Link>)}
          </nav>
        </div>
      </section>

      {hasCmsContent ? (
        <>
          {home.featured && !isFiltered ? (
            <section className="container pb-12" aria-labelledby="featured-article">
              <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{ui.featuredEyebrow}</p><h2 id="featured-article" className="mt-2 text-3xl font-semibold tracking-tight text-primary">{ui.featuredTitle}</h2></div></div>
              <BlogCard post={home.featured} featured />
            </section>
          ) : null}
          {showLatestSection && (
            <section className="container pb-12" aria-labelledby="latest-articles">
              <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{isFiltered ? ui.filteredEyebrow : ui.latestEyebrow}</p><h2 id="latest-articles" className="mt-2 text-3xl font-semibold tracking-tight text-primary">{query ? ui.resultsFor(query) : ui.latestTitle}</h2></div><span className="text-sm text-muted">{ui.articleCount(total)}</span></div>
              {posts.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <BlogCard key={post.id} post={post} />)}</div> : <div className="rounded-[1.5rem] border border-dashed border-border p-10 text-center"><p className="text-lg font-semibold text-primary">{ui.noMatchTitle}</p><p className="mt-2 text-sm text-muted">{ui.noMatchBody}</p><Link href={getBlogIndexPath(locale)} className="mt-4 inline-flex text-sm font-semibold text-accent hover:underline">{ui.exploreAll}</Link></div>}
              {pageCount > 1 ? <nav className="mt-8 flex justify-center gap-2" aria-label={ui.paginationLabel}>{Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <Link key={number} href={withQuery(getBlogIndexPath(locale), number, query, category)} className={`grid size-10 place-items-center rounded-full border text-sm font-semibold ${number === page ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:border-accent"}`} aria-current={number === page ? "page" : undefined}>{number}</Link>)}</nav> : null}
            </section>
          )}
        </>
      ) : showLegacyFallback ? (
        <section className="container pb-12" aria-labelledby="legacy-articles">
          <div className="mb-6 rounded-[1.5rem] border border-dashed border-border p-6"><p className="text-lg font-semibold text-primary">{ui.emptyLocaleTitle}</p><p className="mt-2 text-sm text-muted">{ui.emptyLocaleBody}</p></div>
          <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{ui.cardEyebrow}</p><h2 id="legacy-articles" className="mt-2 text-3xl font-semibold tracking-tight text-primary">{ui.latestTitle}</h2></div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{dict.blog.map((item) => <LegacyBlogCard key={item.slug} item={item} locale={siteLocale} />)}</div>
        </section>
      ) : (
        <section className="container pb-12" aria-labelledby="empty-locale-articles">
          <div className="rounded-[1.5rem] border border-dashed border-border p-10 text-center">
            <p className="text-lg font-semibold text-primary">{locale === "fr" ? ui.emptyLocaleBlockedTitle : ui.emptyLocaleTitle}</p>
            <p className="mt-2 text-sm text-muted">{locale === "fr" ? ui.emptyLocaleBlockedBody : ui.emptyLocaleBody}</p>
            <Link href={getBlogIndexPath(otherLocale)} className="mt-5 inline-flex items-center justify-center rounded-full border border-accent bg-accent/10 px-5 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/20">{locale === "fr" ? ui.emptyLocaleBlockedLink : ui.emptyLocaleLink}</Link>
          </div>
        </section>
      )}
      <PremiumPageCta locale={siteLocale} title={dict.home.finalCtaTitle} description={dict.home.finalCtaBody} primaryAction={{ href: "/start-project", label: dict.common.startProject }} secondaryAction={{ href: "/contact", label: dict.nav.contact }} />
    </main>
  );
}
