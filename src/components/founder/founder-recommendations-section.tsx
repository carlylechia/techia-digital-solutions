import { ArrowUpRight, BadgeCheck } from "lucide-react";
import {
  formatFounderRecommendationDate,
  getFounderRecommendationsCopy,
  getVisibleFounderRecommendations
} from "@/content/founder-recommendations";
import type { Locale } from "@/content/site";
import { FounderReveal } from "./founder-reveal";
import { FounderRecommendationsSwiper } from "./founder-recommendations-swiper";
import { FounderTrackedLink } from "./founder-tracked-link";

export function FounderRecommendationsSection({
  locale,
  linkedinHref
}: {
  locale: Locale;
  linkedinHref: string;
}) {
  const copy = getFounderRecommendationsCopy(locale);
  const recommendations = getVisibleFounderRecommendations();
  const linkedinAriaLabel =
    locale === "fr"
      ? "Visiter le profil LinkedIn de Chia Carlyle"
      : "Visit Chia Carlyle's LinkedIn profile";
  const displayDates: Record<string, string> = Object.fromEntries(
    recommendations.map((recommendation) => [
      recommendation.id,
      formatFounderRecommendationDate(locale, recommendation.date)
    ])
  );

  return (
    <section aria-labelledby="founder-recommendations-heading" className="container py-10 md:py-14">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
        <FounderReveal variant="jump">
          <div className="max-w-3xl">
            <p className="eyebrow mb-3">{copy.curatedLabel}</p>
            <h2 id="founder-recommendations-heading" className="text-balance text-3xl font-semibold text-primary md:text-5xl">
              {copy.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted md:text-lg">{copy.intro}</p>
          </div>
        </FounderReveal>

        <FounderReveal variant="glide" delay={0.06}>
          <div className="subtle-tile founder-hover-card founder-recommendation-callout rounded-[1.6rem] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="icon-chip rounded-2xl p-3">
                <BadgeCheck className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent-2">{copy.sourceLabel}</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {locale === "fr"
                    ? "Références professionnelles visibles, issues du profil LinkedIn personnel de Chia Carlyle."
                    : "Visible professional references curated from Chia Carlyle’s personal LinkedIn profile."}
                </p>
              </div>
            </div>
          </div>
        </FounderReveal>
      </div>

      <FounderReveal variant="jump" delay={0.08}>
        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-muted">
              {locale === "fr"
                ? "Faites glisser, utilisez les points, ou laissez le carrousel avancer automatiquement. Le mouvement s’arrête au survol."
                : "Swipe, use the dots, or let the carousel advance automatically. Motion pauses on hover."}
            </p>
            <span className="trust-pill">
              {locale === "fr" ? "Carrousel LinkedIn" : "LinkedIn carousel"}
            </span>
          </div>

          <FounderRecommendationsSwiper
            locale={locale}
            recommendations={recommendations}
            displayDates={displayDates}
            sourceLabel={copy.sourceLabel}
            readMoreLabel={copy.readMore}
            showLessLabel={copy.showLess}
            recommendedByLabel={copy.recommendedBy}
            originalEnglishLabel={copy.originalEnglishLabel}
          />
        </div>
      </FounderReveal>

      <FounderReveal variant="jump" delay={0.1}>
        <div className="gradient-border mt-8 rounded-[2rem]">
          <div className="premium-card overflow-hidden rounded-[2rem] px-6 py-7 sm:px-8 sm:py-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-base font-medium text-muted md:text-lg">{copy.viewMorePrompt}</p>
              </div>
              <FounderTrackedLink
                href={linkedinHref}
                external
                className="btn-secondary justify-center self-start lg:self-auto"
                eventName="founder_recommendations_linkedin_click"
                eventParams={{ locale, location: "recommendations-section" }}
                ariaLabel={linkedinAriaLabel}
              >
                {copy.viewMoreCta}
                <ArrowUpRight className="size-4" />
              </FounderTrackedLink>
            </div>
          </div>
        </div>
      </FounderReveal>
    </section>
  );
}
