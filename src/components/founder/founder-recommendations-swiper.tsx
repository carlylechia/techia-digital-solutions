"use client";

import type { FounderRecommendation } from "@/content/founder-recommendations";
import { SwipeDotsCarousel } from "@/components/ui/swipe-dots-carousel";
import { FounderRecommendationCard } from "./founder-recommendation-card";

export function FounderRecommendationsSwiper({
  locale,
  recommendations,
  displayDates,
  sourceLabel,
  readMoreLabel,
  showLessLabel,
  recommendedByLabel,
  originalEnglishLabel
}: {
  locale: "en" | "fr";
  recommendations: FounderRecommendation[];
  displayDates: Record<string, string>;
  sourceLabel: string;
  readMoreLabel: string;
  showLessLabel: string;
  recommendedByLabel: string;
  originalEnglishLabel: string;
}) {
  const dotLabels = recommendations.map((_, index) =>
    locale === "fr" ? `Voir la recommandation ${index + 1}` : `View recommendation ${index + 1}`
  );

  return (
    <SwipeDotsCarousel
      className="founder-recommendations-carousel"
      viewportClassName="founder-recommendations-viewport"
      trackClassName="founder-recommendations-track"
      slideClassName="founder-recommendations-slide"
      dotsClassName="founder-recommendations-dots"
      ariaLabel={locale === "fr" ? "Carrousel de recommandations LinkedIn" : "LinkedIn recommendations carousel"}
      autoplayMs={5200}
      pauseOnHover
      dotLabels={dotLabels}
    >
      {recommendations.map((recommendation) => (
        <FounderRecommendationCard
          key={recommendation.id}
          locale={locale}
          recommendation={recommendation}
          displayDate={displayDates[recommendation.id] ?? recommendation.displayDate}
          sourceLabel={sourceLabel}
          readMoreLabel={readMoreLabel}
          showLessLabel={showLessLabel}
          recommendedByLabel={recommendedByLabel}
          originalEnglishLabel={originalEnglishLabel}
        />
      ))}
    </SwipeDotsCarousel>
  );
}
