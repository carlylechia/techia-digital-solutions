import type { Locale } from "@/content/site";
import type { CoursePack } from "@/lib/courses/coursePacks";
import { CourseTrackedLink } from "@/components/courses/course-analytics";

export function FullPackBonusUpsell({
  locale,
  fullPack,
  sourcePage,
}: {
  locale: Locale;
  fullPack: CoursePack;
  sourcePage: string;
}) {
  const copy =
    locale === "fr"
      ? {
          eyebrow: "Bundle bonus complet",
          title: "Vous voulez le bundle bonus complet ?",
          body: "Le Full teChia Digital Skills Pack vous donne acces aux 16 cours et debloque le bundle bonus complet, y compris le Business Digital Checkup Template et le 30-Day Digital Skills Action Plan.",
          cta: "Voir le pack complet",
          highlights: [
            "16 cours",
            "Bundle bonus complet",
            "Meilleure valeur",
          ],
        }
      : {
          eyebrow: "Complete bonus bundle",
          title: "Want the complete bonus bundle?",
          body: "The Full teChia Digital Skills Pack gives you access to all 16 courses and unlocks the full bonus bundle, including the Business Digital Checkup Template and 30-Day Digital Skills Action Plan.",
          cta: "View Full Pack",
          highlights: [
            "16 courses",
            "Complete bonus bundle",
            "Best value",
          ],
        };

  return (
    <section className="container py-4 sm:py-6">
      <div className="gradient-border rounded-[1.9rem]">
        <div className="elevated-panel p-6 sm:p-7 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <p className="eyebrow">{copy.eyebrow}</p>
              <h2 className="mt-4 max-w-4xl text-3xl font-semibold text-primary sm:text-4xl">
                {copy.title}
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
                {copy.body}
              </p>
              <div className="mt-6">
                <CourseTrackedLink
                  href={fullPack.path}
                  eventName="full_pack_bonus_upsell_click"
                  eventParams={{
                    pack_id: fullPack.id,
                    pack_slug: fullPack.slug,
                    pack_title: fullPack.title,
                    source_page: sourcePage,
                    eligibility: "full-pack",
                  }}
                  className="btn-primary justify-center px-5 py-3"
                >
                  {copy.cta}
                </CourseTrackedLink>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {copy.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-[1.3rem] border border-amber-400/18 bg-amber-400/[0.08] px-4 py-4 text-sm font-medium text-primary"
                >
                  {highlight}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
