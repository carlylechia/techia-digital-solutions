import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { PublicBlogListPost } from "@/lib/blog/queries";
import { getBlogAuthorPath, getBlogPostPath, type BlogLocale } from "@/lib/blog/slug";

function formatDate(value: Date | string | null | undefined, locale: BlogLocale) {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function BlogCard({ post, featured = false }: { post: PublicBlogListPost; featured?: boolean }) {
  const locale = post.locale as BlogLocale;
  const href = getBlogPostPath(locale, post.slug);

  return (
    <article className={`group premium-card overflow-hidden ${featured ? "md:grid md:grid-cols-[1.08fr_0.92fr]" : "flex h-full flex-col"}`}>
      <Link href={href} className={`relative block overflow-hidden bg-surface-strong ${featured ? "min-h-72 md:min-h-full" : "aspect-[16/9]"}`} aria-label={post.title}>
        {post.featuredImageUrl ? (
          <Image
            src={post.featuredImageUrl}
            alt={post.featuredImageAlt || post.title}
            fill
            sizes={featured ? "(min-width: 768px) 52vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.22),transparent_45%),linear-gradient(135deg,rgba(6,182,212,0.14),rgba(59,130,246,0.08))]" />
        )}
        <span className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
      </Link>
      <div className={`flex flex-1 flex-col ${featured ? "justify-center p-6 sm:p-8 lg:p-10" : "p-5 sm:p-6"}`}>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          {post.category ? <span>{post.category.name}</span> : null}
          <span className="text-muted/50">•</span>
          <span className="inline-flex items-center gap-1.5 normal-case tracking-normal text-muted"><Clock3 className="size-3.5" />{post.readingTime} min</span>
        </div>
        <h2 className={`mt-3 font-semibold tracking-tight text-primary ${featured ? "text-3xl sm:text-4xl" : "text-xl"}`}>
          <Link href={href} className="transition hover:text-accent">{post.title}</Link>
        </h2>
        <p className="mt-3 line-clamp-4 text-sm leading-7 text-muted sm:text-base">{post.excerpt}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6 text-xs text-muted">
          <span>{formatDate(post.publishedAt, locale)}</span>
          {post.author ? (
            <Link href={getBlogAuthorPath(locale, post.author.slug)} className="inline-flex items-center gap-1 font-semibold text-primary hover:text-accent">
              {post.author.displayName}<ArrowUpRight className="size-3.5" />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function BlogCardSkeleton() {
  return <div className="premium-card h-96 animate-pulse bg-surface-strong" aria-hidden="true" />;
}
