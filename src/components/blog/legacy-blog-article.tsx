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
  const isComparison = slug === "website-vs-business-management-system";
  const html = isComparison
    ? `<p>A website and a business management system solve different problems. A website helps people discover, trust, and contact your business, while a business management system helps your team organize leads, tasks, customers, and daily operations. Many growing companies eventually need both, connected into one coherent digital layer.</p>
<h2>Quick comparison</h2>
<table><thead><tr><th>Aspect</th><th>Website</th><th>Business management system</th></tr></thead><tbody>
<tr><td>Purpose</td><td>Visibility, credibility, lead capture</td><td>Operations, tracking, internal coordination</td></tr>
<tr><td>Capabilities</td><td>Service pages, SEO, forms, content</td><td>CRM, dashboards, tasks, requests, reporting</td></tr>
<tr><td>Overlap</td><td>Both improve customer experience and data quality</td><td>Both rely on structured information and workflows</td></tr>
<tr><td>When appropriate</td><td>When you need more customers and trust</td><td>When manual operations slow the team down</td></tr>
</tbody></table>
<h2>When to start with a website</h2><p>If customers cannot find you, understand your offer, or contact you easily, start with a professional website. It is the front door of your business and the foundation for SEO, campaigns, and trust. See <a href="/services/website-design-development">Website Design & Development</a> and <a href="/services/seo">SEO services</a>.</p>
<h2>When to add a business management system</h2><p>If leads arrive but get lost in WhatsApp threads and spreadsheets, add a business management system. It centralizes requests, tracks status, and gives managers real visibility. See <a href="/solutions">Solution modules</a> and <a href="/demo-lab/business-management-dashboard">Business Dashboard demo</a>.</p>
<h2>How teChia connects both</h2><p>teChia plans websites and business systems together so marketing, lead capture, and operations reinforce each other. Explore <a href="/services">all services</a>, <a href="/pricing">pricing</a>, and <a href="/start-project">start a project</a> to define the right mix for your company.</p>`
    : `<p>${dict.pages.blog.intro}</p><h2>${dict.pages.blog.keyIdeaTitle}</h2><p>${dict.pages.blog.keyIdeaBody}</p><h2>${dict.pages.blog.nextStepTitle}</h2><p>${dict.pages.blog.nextStepBody}</p>`;
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
