import { redirect } from "next/navigation";
import { isLocale } from "@/content/site";

// Legacy redirect: /[locale]/p/[slug] → /[locale]/[slug]
export default async function LegacyContentPageRedirect({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const resolvedLocale = isLocale(locale) ? locale : "en";
  redirect(`/${resolvedLocale}/${slug}`);
}
