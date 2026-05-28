import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageShell } from "@/components/ui/legal-page-shell";
import { getDictionary, isLocale, type Locale } from "@/content/site";
import { createMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params; const locale = isLocale(rawLocale) ? rawLocale : "en";
  const dict = getDictionary(locale);
  return createMetadata({ locale, title: `${dict.legal.privacy} — teChia`, description: dict.legal.metaDescription, path: "/privacy" });
}

export default async function LegalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params; if (!isLocale(rawLocale)) notFound(); const locale = rawLocale as Locale; const dict = getDictionary(locale);
  return <LegalPageShell locale={locale} page="privacy" title={dict.legal.privacy} paragraphs={dict.legal.pages.privacy} />;
}
