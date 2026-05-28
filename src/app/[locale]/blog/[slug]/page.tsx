import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import { getDictionary, isLocale, locales, type Locale } from "@/content/site";
import { createMetadata } from "@/lib/seo";

export function generateStaticParams() { return locales.flatMap((locale) => getDictionary(locale).blog.map((item) => ({ locale, slug: item.slug }))); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> { const { locale: rawLocale, slug } = await params; const locale = isLocale(rawLocale) ? rawLocale : "en"; const dict = getDictionary(locale); const post = dict.blog.find((item) => item.slug === slug); return createMetadata({ locale, title: post ? `${post.title} — ${dict.nav.blog} teChia` : `${dict.nav.blog} — teChia`, description: post?.description || dict.pages.blog.metaDescription, path: `/blog/${slug}` }); }

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params; if (!isLocale(rawLocale)) notFound(); const locale = rawLocale as Locale; const dict = getDictionary(locale); const post = dict.blog.find((item) => item.slug === slug); if (!post) notFound();
  return (
    <main>
      <PremiumPageHero
        locale={locale}
        eyebrow={dict.pages.blog.articleEyebrow}
        title={post.title}
        description={post.description}
        badges={[dict.pages.blog.keyIdeaTitle, dict.pages.blog.nextStepTitle]}
        actions={[{ href: "/start-project", label: dict.common.startProject }]}
      />
      <section className="container max-w-4xl py-6">
        <article className="gradient-border rounded-[1.75rem]">
          <div className="elevated-panel p-8 md:p-12">
            <div className="prose mt-2 max-w-none text-muted">
              <p>{dict.pages.blog.intro}</p>
              <h2 className="mt-8 text-2xl font-semibold text-primary">{dict.pages.blog.keyIdeaTitle}</h2>
              <p>{dict.pages.blog.keyIdeaBody}</p>
              <h2 className="mt-8 text-2xl font-semibold text-primary">{dict.pages.blog.nextStepTitle}</h2>
              <p>{dict.pages.blog.nextStepBody}</p>
            </div>
          </div>
        </article>
      </section>
      <PremiumPageCta
        locale={locale}
        title={dict.home.finalCtaTitle}
        description={post.description}
        primaryAction={{ href: "/start-project", label: dict.common.startProject }}
        secondaryAction={{ href: "/blog", label: dict.nav.blog }}
      />
    </main>
  );
}
