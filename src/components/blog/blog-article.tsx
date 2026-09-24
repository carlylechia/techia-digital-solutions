import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, RefreshCw } from "lucide-react";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { siteConfig } from "@/content/site";
import { JsonLd } from "@/components/ui/json-ld";
import type { Locale } from "@/content/site";
import type { PublicBlogListPost, PublicBlogPost } from "@/lib/blog/queries";
import { getBlogAuthorPath, getBlogCategoryPath, getBlogPostPath, type BlogLocale } from "@/lib/blog/slug";
import { articleJsonLd, blogBreadcrumbJsonLd } from "@/lib/blog/seo";
import { ArticleBody } from "./article-body";
import { BlogCta } from "./blog-cta";
import { BlogBreadcrumbs, getArticleBreadcrumbs } from "./blog-breadcrumbs";
import { BlogCard } from "./blog-card";
import { BlogArticleView } from "./blog-analytics";
import { ShareLinks } from "./share-links";

function formatDate(value: Date | string | null | undefined, locale: BlogLocale, withTime = false) {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

function AuthorByline({ post, locale }: { post: PublicBlogPost; locale: BlogLocale }) {
  if (!post.author) return null;
  return (
    <div className="flex items-center gap-3">
      {post.author.imageUrl ? (
        <Image src={post.author.imageUrl} alt="" width={44} height={44} className="size-11 rounded-full border border-border object-cover" />
      ) : (
        <span className="grid size-11 place-items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-sm font-bold text-accent" aria-hidden="true">
          {post.author.displayName.slice(0, 1).toUpperCase()}
        </span>
      )}
      <div className="text-sm">
        <Link href={getBlogAuthorPath(locale, post.author.slug)} className="font-semibold text-primary hover:text-accent">{post.author.displayName}</Link>
        {post.author.jobTitle ? <p className="text-xs text-muted">{post.author.jobTitle}</p> : null}
      </div>
    </div>
  );
}

export function BlogArticle({
  locale: siteLocale,
  post,
  related,
  adjacent,
}: {
  locale: Locale;
  post: PublicBlogPost;
  related: PublicBlogListPost[];
  adjacent: { previous: { slug: string; title: string; publishedAt: Date | null } | null; next: { slug: string; title: string; publishedAt: Date | null } | null };
}) {
  const locale = siteLocale as BlogLocale;
  const canonical = `${siteConfig.url}${getBlogPostPath(locale, post.slug)}`;
  const breadcrumbItems = getArticleBreadcrumbs(locale, post);
  const breadcrumbSchema = blogBreadcrumbJsonLd(locale, breadcrumbItems.filter((item) => item.href).map((item) => ({ name: item.label, path: item.href || "/" })));
  const updatedAt = new Date(post.updatedAt).getTime();
  const publishedAt = post.publishedAt ? new Date(post.publishedAt).getTime() : 0;
  const updated = Number.isFinite(updatedAt) && Number.isFinite(publishedAt) && updatedAt - publishedAt > 86_400_000;

  return (
    <>
      <JsonLd data={articleJsonLd(locale, post)} />
      <JsonLd data={breadcrumbSchema} />
      <BlogArticleView slug={post.slug} category={post.category?.name} />
      <main className="pb-20">
        <div className="container pt-6 sm:pt-10">
          <BlogBreadcrumbs locale={locale} items={breadcrumbItems} />
          <article className="mx-auto max-w-5xl">
            <header className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-accent">
                {post.category ? <Link href={getBlogCategoryPath(locale, post.category.slug)} className="hover:underline">{post.category.name}</Link> : <span>Insights</span>}
                <span className="text-muted/50">•</span>
                <span className="inline-flex items-center gap-1.5 normal-case tracking-normal text-muted"><Clock3 className="size-3.5" />{post.readingTime} min read</span>
              </div>
              <h1 className="mt-5 text-balance text-4xl font-semibold leading-tight tracking-tight text-primary sm:text-5xl lg:text-6xl">{post.title}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted sm:text-xl">{post.excerpt}</p>
              <div className="mt-7 flex flex-wrap items-center justify-between gap-5 border-y border-border py-5">
                <AuthorByline post={post} locale={locale} />
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />{formatDate(post.publishedAt, locale)}</span>
                  {updated ? <span className="inline-flex items-center gap-1.5"><RefreshCw className="size-3.5" />Updated {formatDate(post.updatedAt, locale)}</span> : null}
                </div>
              </div>
            </header>

            {post.featuredImageUrl ? (
              <figure className="mt-8 overflow-hidden rounded-[2rem] border border-border bg-surface-strong">
                <Image src={post.featuredImageUrl} alt={post.featuredImageAlt || post.title} width={1600} height={900} priority className="h-auto max-h-[42rem] w-full object-cover" />
                {post.featuredImageAlt ? <figcaption className="px-5 py-3 text-xs text-muted">{post.featuredImageAlt}</figcaption> : null}
              </figure>
            ) : null}

            <div className="mx-auto mt-10 max-w-3xl">
              <ArticleBody html={post.content} />
              <BlogCta locale={locale} title={post.ctaTitle} description={post.ctaDescription} href={post.ctaHref} label={post.ctaLabel} />
              <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-5">
                <ShareLinks url={canonical} title={post.title} locale={locale} />
                <Link href={getBlogAuthorPath(locale, post.author?.slug || "")} className="text-sm font-semibold text-primary hover:text-accent">About the author</Link>
              </div>
            </div>
          </article>
        </div>

        {related.length ? (
          <section className="container mt-16" aria-labelledby="related-articles">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Keep exploring</p><h2 id="related-articles" className="mt-2 text-3xl font-semibold tracking-tight text-primary">Related articles</h2></div>
              <Link href={`/${locale}/blog`} className="hidden items-center gap-2 text-sm font-semibold text-accent hover:underline sm:inline-flex">View all <ArrowRight className="size-4" /></Link>
            </div>
            <div className="grid gap-5 md:grid-cols-3">{related.map((item) => <BlogCard key={item.id} post={item} />)}</div>
          </section>
        ) : null}

        {adjacent.previous || adjacent.next ? (
          <nav className="container mt-10 grid gap-4 border-t border-border pt-8 sm:grid-cols-2" aria-label="More articles">
            {adjacent.previous ? <Link href={getBlogPostPath(locale, adjacent.previous.slug)} className="group rounded-2xl border border-border p-5 transition hover:border-accent"><span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted"><ArrowLeft className="size-4" />Previous</span><span className="mt-2 block font-semibold text-primary group-hover:text-accent">{adjacent.previous.title}</span></Link> : <span />}
            {adjacent.next ? <Link href={getBlogPostPath(locale, adjacent.next.slug)} className="group rounded-2xl border border-border p-5 text-right transition hover:border-accent"><span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Next<ArrowRight className="size-4" /></span><span className="mt-2 block font-semibold text-primary group-hover:text-accent">{adjacent.next.title}</span></Link> : null}
          </nav>
        ) : null}

        <section className="container mt-16 max-w-3xl rounded-[1.75rem] border border-border bg-surface-strong/60 p-6 sm:p-8" aria-labelledby="newsletter-title">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Stay curious</p>
          <h2 id="newsletter-title" className="mt-2 text-2xl font-semibold text-primary">Useful digital thinking, occasionally.</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Join the teChia newsletter for practical ideas on visibility, systems, automation, AI, and growth.</p>
          <div className="mt-5"><NewsletterForm locale={siteLocale} /></div>
        </section>
      </main>
    </>
  );
}
