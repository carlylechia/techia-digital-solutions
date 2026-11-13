import { SectionHeading } from "@/components/ui/section-heading";
import type { Locale } from "@/content/site";
import { getCoursePackLevelLabel } from "@/lib/courses/coursePacks";
import type { StorefrontPack } from "@/lib/courses/catalog-service";
import { CoursePackCard } from "./CoursePackCard";

export function RelatedCoursePacks({
  locale,
  packs,
  embedded = false,
}: {
  locale: Locale;
  packs: StorefrontPack[];
  /** Render only the card grid when the caller already provides the shell. */
  embedded?: boolean;
}) {
  if (!packs.length) return null;

  const grid = (
    <div
      className={
        embedded
          ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          : "mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      }
    >
      {packs.slice(0, 3).map((pack) => (
        <CoursePackCard
          key={pack.id}
          pack={pack}
          locale={locale}
          sourcePage="related_packs"
          audienceLabel={locale === "fr" ? "Idéal pour" : "Best for"}
          levelLabel={getCoursePackLevelLabel(locale, pack.level)}
          courseLabelSingular={locale === "fr" ? "cours" : "course"}
          courseLabelPlural={locale === "fr" ? "cours" : "courses"}
          detailLabel={locale === "fr" ? "Voir les détails" : "View Details"}
          checkoutLabel={locale === "fr" ? "Acheter" : "Buy Now"}
        />
      ))}
    </div>
  );

  if (embedded) return grid;

  return (
    <section className="container py-4 sm:py-6">
      <div className="gradient-border rounded-[1.95rem]">
        <div className="elevated-panel p-6 sm:p-7 md:p-8">
          <SectionHeading
            eyebrow={locale === "fr" ? "Autres packs" : "Related packs"}
            title={
              locale === "fr"
                ? "Explorez d’autres parcours utiles."
                : "Explore other focused learning paths."
            }
            description={
              locale === "fr"
                ? "Si vous voulez élargir votre progression, ces packs peuvent compléter votre objectif actuel."
                : "If you want to broaden your progress, these packs can complement your current goal."
            }
            align="left"
            className="mb-0"
          />

          {grid}
        </div>
      </div>
    </section>
  );
}
