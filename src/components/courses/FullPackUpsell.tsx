import { CourseTrackedLink } from "@/components/courses/course-analytics";
import type { Locale } from "@/content/site";
import type { CoursePack } from "@/lib/courses/coursePacks";

export function FullPackUpsell({
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
          eyebrow: "Passer au niveau complet",
          title:
            "Vous voulez tout au même endroit ? Le pack complet reste la meilleure valeur.",
          body: "Le Pack complet teChia Digital Skills vous donne accès aux 16 cours et reste la meilleure option si vous voulez la bibliothèque complète au lieu d’acheter plusieurs packs séparés.",
          cta: "Voir le pack complet",
        }
      : {
          eyebrow: "Upgrade to the full library",
          title:
            "Want everything in one place? The full pack remains the best value.",
          body: "The Full teChia Digital Skills Pack gives you access to all 16 courses and is the best option if you want the complete learning library instead of buying smaller packs separately.",
          cta: "View Full Pack",
        };

  return (
    <section className="container py-4 sm:py-6">
      <div className="gradient-border rounded-[1.9rem]">
        <div className="elevated-panel p-6 sm:p-7 md:p-8">
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
              eventName="full_pack_upsell_click"
              eventParams={{
                pack_id: fullPack.id,
                pack_slug: fullPack.slug,
                pack_title: fullPack.title,
                source_page: sourcePage,
              }}
              className="btn-primary justify-center px-5 py-3"
            >
              {copy.cta}
            </CourseTrackedLink>
          </div>
        </div>
      </div>
    </section>
  );
}
