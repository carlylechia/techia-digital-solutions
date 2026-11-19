import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/blog/blog-index";
import { getDictionary, isLocale, siteConfig, type Locale } from "@/content/site";
import { getBlogIndexPath } from "@/lib/blog/slug";
import { createMetadata } from "@/lib/seo";

export const revalidate = 300;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SearchParams }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const dict = getDictionary(locale);
  const queryParams = await searchParams;
  const pageValue = Number.parseInt(firstValue(queryParams.page), 10);
  const page = Number.isFinite(pageValue) && pageValue > 1 ? pageValue : 1;
  const canonicalPath = `${getBlogIndexPath(locale)}${page > 1 ? `?page=${page}` : ""}`;
  const base = createMetadata({
    locale,
    title: dict.pages.blog.metaTitle,
    description: dict.pages.blog.metaDescription,
    canonicalPath,
  });
  return {
    ...base,
    alternates: {
      ...base.alternates,
      languages: {
        "en-US": `${siteConfig.url}${getBlogIndexPath("en")}`,
        "fr-FR": `${siteConfig.url}${getBlogIndexPath("fr")}`,
        "x-default": `${siteConfig.url}${getBlogIndexPath("en")}`,
      },
    },
  };
}

export default async function BlogPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SearchParams }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const queryParams = await searchParams;
  const pageValue = Number.parseInt(firstValue(queryParams.page), 10);
  const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;
  return <BlogIndex locale={rawLocale as Locale} page={page} query={firstValue(queryParams.q).slice(0, 100)} category={firstValue(queryParams.category).slice(0, 100)} />;
}
