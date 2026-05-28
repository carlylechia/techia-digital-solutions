import { permanentRedirect } from "next/navigation";
import {
  getLocalizedSectionHref,
  isLocale,
  mergedPageAnchors,
} from "@/content/site";

export default async function PortfolioPageRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";

  permanentRedirect(
    getLocalizedSectionHref(
      locale,
      "/about",
      mergedPageAnchors.about.portfolio,
    ),
  );
}
