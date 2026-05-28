import { BadgeCheck, Building2, CalendarDays, Quote } from "lucide-react";
import type { FounderRecommendation } from "@/content/founder-recommendations";
import { ExpandableRecommendationText } from "./expandable-recommendation-text";

export function FounderRecommendationCard({
  locale,
  recommendation,
  displayDate,
  sourceLabel,
  readMoreLabel,
  showLessLabel,
  recommendedByLabel,
  originalEnglishLabel
}: {
  locale: "en" | "fr";
  recommendation: FounderRecommendation;
  displayDate: string;
  sourceLabel: string;
  readMoreLabel: string;
  showLessLabel: string;
  recommendedByLabel: string;
  originalEnglishLabel: string;
}) {
  return (
    <article className="premium-card founder-hover-card founder-recommendation-card h-full p-6 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="founder-recommendation-badge">
            <BadgeCheck className="size-4" />
            {sourceLabel}
          </div>
          {locale === "fr" ? <p className="founder-recommendation-note">{originalEnglishLabel}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start sm:justify-end">
          <Quote className="size-5 shrink-0 text-accent-2" />
          <div className="founder-recommendation-date">
            <CalendarDays className="size-4" />
            <span>{displayDate}</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ExpandableRecommendationText
          recommendationId={recommendation.id}
          locale={locale}
          quote={recommendation.quote}
          readMoreLabel={readMoreLabel}
          showLessLabel={showLessLabel}
        />
      </div>

      <div className="founder-recommendation-footer mt-6">
        <p className="founder-recommendation-meta-label">{recommendedByLabel}</p>
        <h3 className="mt-3 text-lg font-semibold text-primary">{recommendation.name}</h3>
        <p className="mt-1 text-sm font-medium text-accent">{recommendation.role}</p>
        <div className="mt-3 inline-flex items-center gap-2 text-sm text-muted">
          <Building2 className="size-4 text-accent-2" />
          <span>{recommendation.company}</span>
        </div>
      </div>
    </article>
  );
}
