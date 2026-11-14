import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import type { AcademyRecommendation } from "@/lib/ai/recommendation";

export function RecommendationCard({
  recommendation,
}: {
  recommendation: AcademyRecommendation;
}) {
  const href = recommendation.checkoutPath ?? recommendation.productPath;

  return (
    <div className="my-3 rounded-2xl border border-accent/25 bg-accent/[0.05] p-4">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
        <GraduationCap className="size-3.5" aria-hidden="true" />
        Recommended {recommendation.type}
      </p>
      <p className="mt-1.5 text-[13px] font-semibold leading-5 text-primary">
        {recommendation.title}
      </p>
      {recommendation.priceLabel ? (
        <p className="mt-0.5 text-[12px] text-muted">
          {recommendation.priceLabel}
        </p>
      ) : null}
      <div className="mt-3 grid gap-2">
        <Link
          href={href}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-accent/90"
        >
          {recommendation.checkoutPath
            ? "Continue to secure checkout"
            : "View course details"}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
        {recommendation.checkoutPath ? (
          <Link
            href={recommendation.productPath}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-[12px] font-semibold text-muted transition hover:border-accent/40 hover:text-accent"
          >
            View full course details
          </Link>
        ) : null}
      </div>
    </div>
  );
}
