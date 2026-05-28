"use client";

import { useId, useState } from "react";
import { emitFounderAnalytics } from "./founder-analytics";
import { cn } from "@/lib/utils";

export function ExpandableRecommendationText({
  recommendationId,
  locale,
  quote,
  readMoreLabel,
  showLessLabel
}: {
  recommendationId: string;
  locale: "en" | "fr";
  quote: string;
  readMoreLabel: string;
  showLessLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const isExpandable = quote.length > 320;

  const handleToggle = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);

    if (nextExpanded) {
      emitFounderAnalytics("founder_recommendation_expand", {
        recommendationId,
        locale
      });
    }
  };

  return (
    <div className="space-y-3">
      <p
        id={contentId}
        className={cn(
          "founder-recommendation-quote",
          isExpandable && !expanded && "founder-recommendation-quote-clamped"
        )}
      >
        {quote}
      </p>
      {isExpandable ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={handleToggle}
          data-carousel-no-drag="true"
          className="founder-recommendation-toggle"
        >
          {expanded ? showLessLabel : readMoreLabel}
        </button>
      ) : null}
    </div>
  );
}
