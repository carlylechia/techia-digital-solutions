import { permanentRedirect } from "next/navigation";
import {
  getDictionary,
  getLocalizedSectionHref,
  getLocalizedSolutionHref,
  isLocale,
  mergedPageAnchors,
} from "@/content/site";

export default async function SolutionDetailRedirect({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const hasMatchingSolution = getDictionary(locale).solutions.some(
    (item) => item.slug === slug,
  );

  permanentRedirect(
    hasMatchingSolution
      ? getLocalizedSolutionHref(locale, slug)
      : getLocalizedSectionHref(
          locale,
          "/services",
          mergedPageAnchors.services.solutions,
        ),
  );
}
