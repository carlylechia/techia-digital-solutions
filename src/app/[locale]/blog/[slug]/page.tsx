import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { BlogArticle } from "@/components/blog/blog-article";
import { LegacyBlogArticle } from "@/components/blog/legacy-blog-article";
import { getDictionary, isLocale, type Locale } from "@/content/site";
import { getAdjacentPosts, getPublishedPost, getPublishedPostRedirect, getRelatedPosts } from "@/lib/blog/queries";
import { getBlogIndexPath, getBlogPostPath, isBlogLocale, type BlogLocale } from "@/lib/blog/slug";
import { buildArticleMetadata } from "@/lib/blog/seo";
import { createMetadata } from "@/lib/seo";

export const revalidate = 300;
export const dynamicParams = true;

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const post = await getPublishedPost(locale, slug);
  if (post) return buildArticleMetadata(locale, post);
  const redirectedSlug = await getPublishedPostRedirect(locale, slug);
  if (redirectedSlug) {
    return createMetadata({ locale, title: "Article moved — teChia", description: "This article has moved.", canonicalPath: getBlogPostPath(locale, redirectedSlug), robots: { index: false, follow: true } });
  }
  const legacy = getDictionary(locale).blog.find((item) => item.slug === slug);
  if (legacy) {
    return createMetadata({
      locale,
      title: `${legacy.title} — ${getDictionary(locale).nav.blog} | teChia`,
      description: legacy.description,
      canonicalPath: getBlogPostPath(locale, slug),
    });
  }
  return {
    ...createMetadata({ locale, title: "Article not found — teChia", description: "The requested teChia article could not be found.", canonicalPath: getBlogIndexPath(locale) }),
    robots: { index: false, follow: false },
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale) || !isBlogLocale(rawLocale)) notFound();
  const locale = rawLocale as BlogLocale;
  const post = await getPublishedPost(locale, slug);
  if (post) {
    const [related, adjacent] = await Promise.all([
      getRelatedPosts(post),
      post.publishedAt ? getAdjacentPosts(locale, post.publishedAt, post.id) : Promise.resolve({ previous: null, next: null }),
    ]);
    return <BlogArticle locale={locale as Locale} post={post} related={related} adjacent={adjacent} />;
  }
  const redirectedSlug = await getPublishedPostRedirect(locale, slug);
  if (redirectedSlug) permanentRedirect(getBlogPostPath(locale, redirectedSlug));

  const legacy = getDictionary(locale).blog.find((item) => item.slug === slug);
  if (!legacy) notFound();
  return <LegacyBlogArticle locale={locale as Locale} slug={slug} />;
}
