import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogBreadcrumbs } from "@/components/blog/blog-breadcrumbs";
import { BlogCard } from "@/components/blog/blog-card";
import { JsonLd } from "@/components/ui/json-ld";
import { getDictionary, isLocale, siteConfig, type Locale } from "@/content/site";
import { getPublishedAuthor, getPublishedPosts } from "@/lib/blog/queries";
import { getBlogAuthorPath, getBlogIndexPath, type BlogLocale } from "@/lib/blog/slug";
import { authorProfileJsonLd } from "@/lib/blog/seo";
import { createMetadata } from "@/lib/seo";

export const revalidate = 300;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const author = await getPublishedAuthor(locale, slug);
  if (!author) return { ...createMetadata({ locale, title: "Author not found — teChia", description: "The requested author profile could not be found.", canonicalPath: getBlogIndexPath(locale) }), robots: { index: false, follow: false } };
  return createMetadata({ locale, title: `${author.displayName} — teChia Insights`, description: author.bio.slice(0, 160), canonicalPath: getBlogAuthorPath(locale, author.slug) });
}

export default async function BlogAuthorPage({ params, searchParams }: { params: Promise<{ locale: string; slug: string }>; searchParams: SearchParams }) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as BlogLocale;
  const author = await getPublishedAuthor(locale, slug);
  if (!author) notFound();
  const queryParams = await searchParams;
  const parsedPage = Number.parseInt(firstValue(queryParams.page), 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const { posts, total } = await getPublishedPosts({ locale, page, authorSlug: author.slug });
  const dict = getDictionary(rawLocale as Locale);
  const pageCount = Math.max(1, Math.ceil(total / 9));

  return (
    <main>
      <JsonLd data={authorProfileJsonLd(locale, author)} />
      <div className="container pt-6 sm:pt-10">
        <BlogBreadcrumbs locale={locale} items={[{ label: "Home", href: "/" }, { label: dict.nav.blog, href: getBlogIndexPath(locale) }, { label: author.displayName }]} />
        <header className="mx-auto max-w-3xl py-8 text-center sm:py-12">
          {author.imageUrl ? <Image src={author.imageUrl} alt="" width={112} height={112} className="mx-auto size-28 rounded-full border border-border object-cover" /> : <div className="mx-auto grid size-28 place-items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-4xl font-semibold text-accent">{author.displayName.slice(0, 1).toUpperCase()}</div>}
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-accent">{locale === "fr" ? "Auteur teChia" : "teChia author"}</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-primary sm:text-5xl">{author.displayName}</h1>
          {author.jobTitle ? <p className="mt-3 text-sm font-semibold text-muted">{author.jobTitle}</p> : null}
          <p className="mt-5 text-left text-base leading-8 text-muted sm:text-center">{author.bio}</p>
          <div className="mt-5 flex justify-center gap-4 text-sm"><Link href={author.linkedinUrl || "#"} className={author.linkedinUrl ? "text-accent hover:underline" : "pointer-events-none text-muted/50"} aria-disabled={!author.linkedinUrl}>LinkedIn</Link><Link href={author.websiteUrl || "#"} className={author.websiteUrl ? "text-accent hover:underline" : "pointer-events-none text-muted/50"} aria-disabled={!author.websiteUrl}>Website</Link></div>
        </header>
        <section aria-labelledby="author-articles" className="pb-16"><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{locale === "fr" ? "Articles publiés" : "Published work"}</p><h2 id="author-articles" className="mt-2 text-3xl font-semibold tracking-tight text-primary">{total} {locale === "fr" ? "articles" : "articles"}</h2></div></div>{posts.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <BlogCard key={post.id} post={post} />)}</div> : <p className="rounded-[1.5rem] border border-dashed border-border p-10 text-center text-muted">No published articles yet.</p>}</section>
        {pageCount > 1 ? <nav className="flex justify-center gap-2 pb-16" aria-label="Author pagination">{Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <Link key={number} href={`${getBlogAuthorPath(locale, author.slug)}?page=${number}`} className={`grid size-10 place-items-center rounded-full border text-sm font-semibold ${number === page ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:border-accent"}`} aria-current={number === page ? "page" : undefined}>{number}</Link>)}</nav> : null}
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url }, { "@type": "ListItem", position: 2, name: dict.nav.blog, item: `${siteConfig.url}${getBlogIndexPath(locale)}` }, { "@type": "ListItem", position: 3, name: author.displayName, item: `${siteConfig.url}${getBlogAuthorPath(locale, author.slug)}` }] }} />
    </main>
  );
}
