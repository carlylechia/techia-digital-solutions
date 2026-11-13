import { CourseTrackedLink } from "@/components/courses/course-analytics";
import { CourseCheckoutButton } from "@/components/courses/CourseCheckoutButton";
import type { StorefrontPack } from "@/lib/courses/catalog-service";
import { formatMoney } from "@/lib/payments/money";
import { getCheckoutHints } from "@/lib/payments/providers";
import type { Locale } from "@/content/site";

export async function FeaturedFullPack({
  locale,
  pack,
  compareAtPriceMinor,
  savingsLabel,
}: {
  locale: Locale;
  pack: StorefrontPack;
  /** Sum of the current course prices when the pack is genuinely cheaper. */
  compareAtPriceMinor?: number | null;
  /** Pre-formatted, locale-aware value note derived from live prices. */
  savingsLabel?: string | null;
}) {
  const hints = await getCheckoutHints();
  const copy =
    locale === "fr"
      ? {
          eyebrow: "La formule la plus complète",
          title: "Tous les cours. Un seul pack complet.",
          body: "Le pack complet réunit les 16 cours dans une seule bibliothèque d’apprentissage, avec le bundle de bonus acheteur complet. Choisissez-le si vous voulez le parcours le plus large et l’achat le plus simple.",
          viewLabel: "Voir le pack complet",
          buyLabel: "Acheter le pack complet + bonus",
          separately: "Séparément",
          highlights: [
            "16 cours",
            "Une seule formule",
            "Bibliothèque complète",
            "Bundle bonus complet",
          ],
        }
      : {
          eyebrow: "The most complete package",
          title: "Every course. One complete pack.",
          body: "The Full Pack brings all 16 courses together in one learning library, with the complete buyer bonus bundle included. Choose it when you want the broadest learning path and the simplest way to buy.",
          viewLabel: "View Full Pack",
          buyLabel: "Buy Full Pack + Bonus",
          separately: "Separately",
          highlights: [
            "16 courses",
            "One bundle price",
            "Complete learning library",
            "Complete bonus bundle",
          ],
        };

  return (
    <div className="gradient-border rounded-[1.95rem]">
      <div className="elevated-panel p-6 sm:p-7 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h3 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl">
              {copy.title}
            </h3>
            <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
              {copy.body}
            </p>

            {compareAtPriceMinor || savingsLabel ? (
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                {savingsLabel ? (
                  <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {savingsLabel}
                  </span>
                ) : null}
                {compareAtPriceMinor ? (
                  <span className="text-xs font-medium text-muted">
                    {copy.separately}:{" "}
                    {formatMoney(
                      compareAtPriceMinor,
                      pack.priceCurrency,
                      locale,
                    )}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <CourseTrackedLink
                href={pack.path}
                eventName="course_pack_click"
                eventParams={{
                  pack_id: pack.id,
                  pack_slug: pack.slug,
                  pack_title: pack.title,
                  source_page: "featured_full_pack",
                }}
                className="btn-secondary justify-center px-5 py-3"
              >
                {copy.viewLabel}
              </CourseTrackedLink>
              <CourseCheckoutButton
                pack={pack}
                label={copy.buyLabel}
                sourcePage="featured_full_pack"
                hints={hints}
                chariowProductId={pack.chariowProductId}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {copy.highlights.map((highlight) => (
              <div
                key={highlight}
                className="rounded-[1.3rem] border border-cyan-500/18 bg-cyan-500/[0.08] px-4 py-4 text-sm font-medium text-primary"
              >
                {highlight}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
