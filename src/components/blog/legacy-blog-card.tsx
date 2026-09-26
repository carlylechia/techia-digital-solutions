import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CardItem, Locale } from "@/content/site";
import { getBlogPostPath, type BlogLocale } from "@/lib/blog/slug";
import { getBlogUiCopy } from "@/lib/blog/copy";

export function LegacyBlogCard({ item, locale }: { item: CardItem; locale: Locale }) {
  const ui = getBlogUiCopy(locale as BlogLocale);
  return (
    <article className="premium-card group flex h-full flex-col p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{ui.cardEyebrow}</p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-primary"><Link href={getBlogPostPath(locale, item.slug)} className="transition hover:text-accent">{item.title}</Link></h2>
      <p className="mt-3 flex-1 text-sm leading-7 text-muted">{item.description}</p>
      <Link href={getBlogPostPath(locale, item.slug)} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-accent">{ui.readArticle} <ArrowUpRight className="size-4" /></Link>
    </article>
  );
}
