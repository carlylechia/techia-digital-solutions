import { CourseTrackedLink } from "@/components/courses/course-analytics";
import { CourseCheckoutButton } from "@/components/courses/CourseCheckoutButton";
import type { CoursePack } from "@/lib/courses/coursePacks";
import type { Locale } from "@/content/site";

export function FeaturedFullPack({
  locale,
  pack,
}: {
  locale: Locale;
  pack: CoursePack;
}) {
  const copy =
    locale === "fr"
      ? {
          eyebrow: "Offre recommandée",
          title: "Le pack complet reste l’option la plus forte.",
          body: "Si vous voulez la bibliothèque d’apprentissage la plus complète, le pack complet vous donne accès aux 16 cours au même endroit. C’est le meilleur choix pour les étudiants, salariés, entrepreneurs, freelances, créateurs et dirigeants qui veulent une montée en compétence plus large.",
          viewLabel: "Voir le pack complet",
          buyLabel: "Acheter le pack complet",
          highlights: [
            "16 cours",
            "Meilleure valeur",
            "Bibliothèque complète",
            "Recommandé pour un parcours large",
          ],
        }
      : {
          eyebrow: "Recommended offer",
          title: "The full pack remains the strongest option.",
          body: "If you want the most complete learning library, the full pack gives you access to all 16 courses in one place. It is the best fit for students, workers, entrepreneurs, freelancers, creators, and business owners who want broader long-term skill growth.",
          viewLabel: "View Full Pack",
          buyLabel: "Buy Full Pack",
          highlights: [
            "16 courses",
            "Best value",
            "Complete learning library",
            "Recommended for broader growth",
          ],
        };

  return (
    <section className="container py-4 sm:py-6">
      <div className="gradient-border rounded-[1.95rem]">
        <div className="elevated-panel p-6 sm:p-7 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <p className="eyebrow">{copy.eyebrow}</p>
              <h2 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl">
                {copy.title}
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
                {copy.body}
              </p>
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
    </section>
  );
}
