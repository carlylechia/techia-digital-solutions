import type { Locale } from "@/content/site";
import type { BonusEligibility } from "@/lib/courses/bonusPacks";
import { cn } from "@/lib/utils";

export function BonusEligibilityBadge({
  locale,
  eligibility,
  className,
}: {
  locale: Locale;
  eligibility: BonusEligibility;
  className?: string;
}) {
  const label =
    eligibility === "full-pack"
      ? locale === "fr"
        ? "Exclusif pack complet"
        : "Full Pack Exclusive"
      : locale === "fr"
        ? "Inclus"
        : "Included";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        eligibility === "full-pack"
          ? "border border-amber-400/30 bg-amber-400/10 text-amber-200"
          : "border border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
        className,
      )}
    >
      {label}
    </span>
  );
}
