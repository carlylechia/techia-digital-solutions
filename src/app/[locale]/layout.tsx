import { notFound } from "next/navigation";
import { LocaleChrome } from "@/components/layout/locale-chrome";
import { isLocale, locales, type Locale } from "@/content/site";
import { getPrisma } from "@/lib/prisma";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;

  const prisma = getPrisma();
  let navItems: Array<{ id: string; labelEn: string; labelFr: string; href: string; visible: boolean; position: number; openNewTab: boolean }> = [];
  if (prisma) {
    try {
      navItems = await prisma.navMenuItem.findMany({
        where: { visible: true },
        orderBy: { position: "asc" },
        select: { id: true, labelEn: true, labelFr: true, href: true, visible: true, position: true, openNewTab: true }
      });
    } catch {
      // graceful fallback to hardcoded nav
    }
  }

  return (
    <LocaleChrome locale={locale} navItems={navItems}>
      {children}
    </LocaleChrome>
  );
}
