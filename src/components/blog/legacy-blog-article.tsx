import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { getDictionary, type Locale } from "@/content/site";
import { getBlogIndexPath, type BlogLocale } from "@/lib/blog/slug";
import { ArticleBody } from "./article-body";
import { BlogBreadcrumbs } from "./blog-breadcrumbs";

export function LegacyBlogArticle({ locale: siteLocale, slug }: { locale: Locale; slug: string }) {
  const locale = siteLocale as BlogLocale;
  const dict = getDictionary(siteLocale);
  const item = dict.blog.find((candidate) => candidate.slug === slug);
  if (!item) return null;
  const html = `<p>${dict.pages.blog.intro}</p><h2>${dict.pages.blog.keyIdeaTitle}</h2><p>${dict.pages.blog.keyIdeaBody}</p><h2>${dict.pages.blog.nextStepTitle}</h2><p>${dict.pages.blog.nextStepBody}</p>`;
  return (
    <main>
      <div className="container pt-6 sm:pt-10">
        <BlogBreadcrumbs locale={locale} items={[{ label: "Home", href: "/" }, { label: dict.nav.blog, href: getBlogIndexPath(locale) }, { label: item.title }]} />
        <article className="mx-auto max-w-4xl py-8 sm:py-12">
          <header className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{dict.pages.blog.articleEyebrow}</p>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-primary sm:text-6xl">{item.title}</h1>
            <p className="mt-5 text-lg leading-8 text-muted">{item.description}</p>
            <div className="mt-6 flex items-center gap-2 text-xs text-muted"><CalendarDays className="size-4" />{locale === "fr" ? "Article teChia" : "teChia insight"}</div>
          </header>
          <div className="gradient-border mt-10 rounded-[1.75rem]"><div className="elevated-panel p-6 sm:p-10"><ArticleBody html={html} /></div></div>
          <Link href={getBlogIndexPath(locale)} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"><ArrowLeft className="size-4" />{dict.nav.blog}</Link>
        </article>
      </div>
      <PremiumPageCta locale={siteLocale} title={dict.home.finalCtaTitle} description={dict.home.finalCtaBody} primaryAction={{ href: "/start-project", label: dict.common.startProject }} secondaryAction={{ href: "/contact", label: dict.nav.contact }} />
    </main>
  );
}
