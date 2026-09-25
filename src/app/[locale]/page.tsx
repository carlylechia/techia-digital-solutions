import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HeroSection } from "@/components/sections/HeroSection";
import { HomepageConversionFlow } from "@/components/sections/homepage-conversion-flow";
import { JsonLd } from "@/components/ui/json-ld";
import { getDictionary, isLocale, type Locale } from "@/content/site";
import {
  loadHomepageFaqs,
  loadHomepageFeedback,
} from "@/lib/public-showcase";
import { createMetadata, organizationJsonLd } from "@/lib/seo";
import { getHomepageBlogPosts } from "@/lib/blog/queries";
import type { BlogLocale } from "@/lib/blog/slug";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const dict = getDictionary(locale);
  const metadata = createMetadata({
    locale,
    title: dict.meta.title,
    description: dict.meta.description,
  });

  return metadata;
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const [feedbackItems, faqItems, featuredPosts] = await Promise.all([
    loadHomepageFeedback(locale),
    loadHomepageFaqs(locale),
    getHomepageBlogPosts(locale as BlogLocale).catch(() => null),
  ]);
  const latestBlogCards = (featuredPosts || []).map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.excerpt,
    eyebrow: post.category?.name || undefined,
    imageUrl: post.featuredImageUrl,
    imageAlt: post.featuredImageAlt || post.title,
    readingTime: post.readingTime,
  }));

  return (
    <main id="main-content">
      <JsonLd data={organizationJsonLd(locale)} />
      <HeroSection locale={locale} />
      <HomepageConversionFlow
        locale={locale}
        blogPosts={latestBlogCards.length ? latestBlogCards : dict.blog.slice(0, 3)}
        faqItems={faqItems}
        feedbackItems={feedbackItems}
      />
    </main>
  );
}
