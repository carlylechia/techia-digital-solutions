import { notFound } from "next/navigation";
import { JsonLd } from "@/components/ui/json-ld";
import { LocaleChrome } from "@/components/layout/locale-chrome";
import { isLocale, locales, type Locale } from "@/content/site";
import { loadPublicNavItems } from "@/lib/public-showcase";
import { websiteJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;

  let navItems: Array<{ id: string; labelEn: string; labelFr: string; href: string; visible: boolean; position: number; openNewTab: boolean }> = [];
  try {
    navItems = await loadPublicNavItems();
  } catch {
    // graceful fallback to hardcoded nav
  }

  return (
    <>
      <JsonLd data={websiteJsonLd(locale)} />
      <LocaleChrome locale={locale} navItems={navItems}>
        {children}
      </LocaleChrome>
    </>
  );
}
