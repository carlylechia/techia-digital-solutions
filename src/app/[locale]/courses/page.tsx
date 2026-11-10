import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { BonusClaimButton } from "@/components/courses/BonusClaimButton";
import { BuyerBonusSection } from "@/components/courses/BuyerBonusSection";
import { CourseCard } from "@/components/courses/CourseCard";
import { CourseCatalogFilters } from "@/components/courses/CourseCatalogFilters";
import { CourseFaq } from "@/components/courses/CourseFaq";
import { CourseHero } from "@/components/courses/CourseHero";
import { CoursePackCard } from "@/components/courses/CoursePackCard";
import { CourseCheckoutButton } from "@/components/courses/CourseCheckoutButton";
import { FeaturedFullPack } from "@/components/courses/FeaturedFullPack";
import {
  CoursePageAnalytics,
  CourseTrackedAnchor,
} from "@/components/courses/course-analytics";
import { JsonLd } from "@/components/ui/json-ld";
import { SectionHeading } from "@/components/ui/section-heading";
import { isLocale, type Locale } from "@/content/site";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";
import {
  getCoursesBonusClaimDestination,
  getCoursesSupportEmail,
  getCoursesWhatsappUrl,
} from "@/lib/courses/chariowLinks";
import {
  filterCatalogCourses,
  getStorefrontPacks,
  listPublishedCategories,
  listPublishedCourses,
  type CatalogSort,
} from "@/lib/courses/catalog-service";
import {
  getCourseAcademyFaqs,
  getCourseAcademySteps,
  getCoursePackLevelLabel,
} from "@/lib/courses/coursePacks";
import { getPublicAppPath } from "@/lib/site-routes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";

  return createMetadata({
    locale,
    title:
      locale === "fr"
        ? "teChia Digital Academy | Cours et packs digitaux"
        : "teChia Digital Academy | Digital Skills Courses & Packs",
    description:
      locale === "fr"
        ? "Trouvez le bon cours ou pack digital, apprenez des compétences pratiques et achetez en toute confiance sur teChia Digital Academy."
        : "Find the right digital course or pack, learn practical skills, and buy with confidence on teChia Digital Academy.",
    path: "/courses",
  });
}

function buildViewHref(
  view: "courses" | "packs",
  searchParams: { q?: string; category?: string; sort?: string },
) {
  const params = new URLSearchParams();
  params.set("view", view);
  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.category) params.set("category", searchParams.category);
  if (searchParams.sort) params.set("sort", searchParams.sort);
  return `${getPublicAppPath("/courses")}?${params.toString()}#catalog`;
}

export default async function CoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string; sort?: string; view?: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const { q, category, sort, view } = await searchParams;
  const activeView: "courses" | "packs" = view === "courses" ? "courses" : "packs";

  const [packs, courses, categories] = await Promise.all([
    getStorefrontPacks(locale),
    listPublishedCourses(locale),
    listPublishedCategories(locale),
  ]);
  const fullPack = packs.find((pack) => pack.id === "complete-digital-skills-pack");
  if (!fullPack) notFound();
  const subpacks = packs.filter((pack) => pack.id !== fullPack.id);
  const allPacks = [fullPack, ...subpacks];

  const filteredCourses = filterCatalogCourses(courses, {
    query: q,
    category,
    sort: (sort as CatalogSort) || "recommended",
  });

  const query = (q || "").toLowerCase().trim();
  const filteredPacks = query
    ? allPacks.filter((pack) => {
        const haystack = [
          pack.title,
          pack.summary,
          pack.longDescription,
          pack.tagline,
          ...(pack.learningOutcomes || []),
          ...(pack.bestFor || []),
          ...(pack.includedCourses || []).flatMap((c) => [c.title, c.description || ""]),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
    : allPacks;

  const faqs = getCourseAcademyFaqs(locale);
  const steps = getCourseAcademySteps(locale);
  const supportEmail = getCoursesSupportEmail();
  const bonusClaimDestination = getCoursesBonusClaimDestination(locale);
  const whatsappUrl = getCoursesWhatsappUrl(
    locale === "fr"
      ? "Bonjour teChia, je veux de l'aide pour choisir le bon cours ou pack."
      : "Hello teChia, I want help choosing the right course or pack.",
  );

  const copy =
    locale === "fr"
      ? {
          heroEyebrow: "teChia Digital Academy",
          heroTitle: "Apprenez des compétences digitales utiles et passez à l’action.",
          heroDescription:
            "Choisissez un cours individuel pour un besoin précis, ou un pack pour progresser plus vite avec un parcours complet. Trouvez, comparez et achetez en quelques clics.",
          heroPrimary: "Voir les packs",
          heroSecondary: "Voir les cours individuels",
          heroBadges: ["Cours pratiques", "Packs à forte valeur", "Paiement sécurisé"],
          searchEyebrow: "Trouver rapidement",
          searchTitle: "Recherchez le bon cours ou le bon pack",
          searchDescription:
            "Utilisez la recherche et les filtres pour trouver exactement ce qu’il vous faut, puis choisissez la formule qui correspond à votre objectif.",
          toggleCourses: "Cours individuels",
          togglePacks: "Packs de cours",
          coursesTitle: "Cours individuels",
          coursesDescription:
            "Idéal si vous voulez maîtriser une compétence précise. Choisissez un cours, consultez le programme et achetez quand vous êtes prêt.",
          packsTitle: "Packs de cours",
          packsDescription:
            "Idéal si vous voulez un parcours complet et plus de valeur. Achetez un pack pour apprendre plusieurs compétences complémentaires.",
          featuredPackLabel: "Pack recommandé",
          noCoursesTitle: "Aucun cours trouvé",
          noCoursesBody: "Essayez un autre mot-clé, changez de catégorie ou effacez les filtres.",
          noPacksTitle: "Aucun pack trouvé",
          noPacksBody: "Essayez un autre mot-clé ou effacez les filtres pour voir tous les packs.",
          viewDetails: "Voir les détails",
          buyNow: "Acheter",
          audienceLabel: "Idéal pour",
          courseSingular: "cours",
          coursePlural: "cours",
          bonusTitle: "Bonus acheteur pour les packs",
          bonusDescription:
            "Les bonus teChia sont réservés aux clients qui achètent un pack. Achetez un pack officiel et réclamez vos ressources bonus après vérification de l’achat.",
          bonusPrimary: "Acheter le pack complet",
          bonusSecondary: "Comparer les packs",
          bonusClaim: "Réclamer mon bonus (achat de pack)",
          whyTitle: "Pourquoi choisir teChia Digital Academy",
          whyBody:
            "Des parcours clairs, des compétences pratiques et un achat simple pour vous aider à apprendre ce qui compte vraiment pour votre travail, votre business ou votre carrière.",
          faqEyebrow: "FAQ",
          faqTitle: "Questions fréquentes",
          finalTitle: "Prêt à commencer aujourd’hui ?",
          finalBody:
            "Choisissez un cours individuel pour aller droit au but, ou optez pour un pack pour économiser et progresser plus vite.",
          browseCourses: "Explorer les cours",
          browsePacks: "Explorer les packs",
          supportWhatsapp: "Demander conseil sur WhatsApp",
          supportEmail: "Contacter par email",
        }
      : {
          heroEyebrow: "teChia Digital Academy",
          heroTitle: "Learn practical digital skills and take action with confidence.",
          heroDescription:
            "Choose a single course for a specific goal, or pick a pack for a complete learning path and better value. Find, compare, and buy in just a few clicks.",
          heroPrimary: "Browse Course Packs",
          heroSecondary: "Browse Individual Courses",
          heroBadges: ["Practical courses", "High-value packs", "Secure checkout"],
          searchEyebrow: "Find it fast",
          searchTitle: "Search for the right course or pack",
          searchDescription:
            "Use search and filters to find what you need, then choose the option that fits your goal and budget.",
          toggleCourses: "Individual Courses",
          togglePacks: "Course Packs",
          coursesTitle: "Individual courses",
          coursesDescription:
            "Best if you want to master one specific skill. Pick a course, review the outline, and buy when you’re ready.",
          packsTitle: "Course packs",
          packsDescription:
            "Best if you want a complete path and more value. Buy a pack to learn multiple related skills together.",
          featuredPackLabel: "Recommended pack",
          noCoursesTitle: "No courses found",
          noCoursesBody: "Try a different keyword, change the category, or clear filters.",
          noPacksTitle: "No packs found",
          noPacksBody: "Try a different keyword or clear filters to see all packs.",
          viewDetails: "View details",
          buyNow: "Buy now",
          audienceLabel: "Best for",
          courseSingular: "course",
          coursePlural: "courses",
          bonusTitle: "Buyer bonuses for pack purchases",
          bonusDescription:
            "teChia buyer bonuses are available to clients who purchase a course pack. Buy an official pack and claim your bonus resources after purchase verification.",
          bonusPrimary: "Buy the Full Pack",
          bonusSecondary: "Compare packs",
          bonusClaim: "Claim pack bonus",
          whyTitle: "Why choose teChia Digital Academy",
          whyBody:
            "Clear learning paths, practical skills, and a simple buying experience to help you learn what matters for work, business, or career growth.",
          faqEyebrow: "FAQ",
          faqTitle: "Frequently asked questions",
          finalTitle: "Ready to start learning today?",
          finalBody:
            "Choose an individual course to focus on one skill, or pick a pack to save more and make faster progress.",
          browseCourses: "Explore courses",
          browsePacks: "Explore packs",
          supportWhatsapp: "Ask on WhatsApp",
          supportEmail: "Contact by email",
        };

  return (
    <main>
      <CoursePageAnalytics
        name="courses_page_view"
        params={{
          pack_id: fullPack.id,
          pack_slug: fullPack.slug,
          pack_title: fullPack.title,
          source_page: "courses_landing",
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: locale === "fr" ? "Accueil" : "Home", path: "" },
          { name: locale === "fr" ? "Cours" : "Courses", path: "/courses" },
        ])}
      />

      <CourseHero
        locale={locale}
        eyebrow={copy.heroEyebrow}
        title={copy.heroTitle}
        description={copy.heroDescription}
        badges={copy.heroBadges}
        actions={[
          { href: buildViewHref("packs", { q, category, sort }), label: copy.heroPrimary },
          {
            href: buildViewHref("courses", { q, category, sort }),
            label: copy.heroSecondary,
            variant: "secondary",
          },
        ]}
      />

      <section id="catalog" className="container scroll-mt-24 py-4 sm:py-6">
        <div className="gradient-border rounded-[1.95rem]">
          <div className="elevated-panel p-6 sm:p-7 md:p-8">
            <SectionHeading
              eyebrow={copy.searchEyebrow}
              title={copy.searchTitle}
              description={copy.searchDescription}
              align="left"
              className="mb-0"
            />

            <div className="mt-6 inline-flex rounded-full border border-border bg-background/70 p-1">
              <Link
                href={buildViewHref("packs", { q, category, sort })}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeView === "packs"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-primary"
                }`}
              >
                {copy.togglePacks}
              </Link>
              <Link
                href={buildViewHref("courses", { q, category, sort })}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeView === "courses"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-primary"
                }`}
              >
                {copy.toggleCourses}
              </Link>
            </div>

            <div className="mt-6">
              <CourseCatalogFilters
                locale={locale}
                categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
              />
            </div>

            {activeView === "packs" ? (
              <div className="mt-8">
                <SectionHeading
                  eyebrow={copy.togglePacks}
                  title={copy.packsTitle}
                  description={copy.packsDescription}
                  align="left"
                  className="mb-0"
                />

                {filteredPacks.length ? (
                  <>
                    {filteredPacks.some((p) => p.recommended) ? (
                      <div className="mt-8">
                        <FeaturedFullPack locale={locale} pack={fullPack} />
                      </div>
                    ) : null}
                    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {filteredPacks
                        .filter((p) => !p.recommended)
                        .map((pack) => (
                          <CoursePackCard
                            key={pack.id}
                            pack={pack}
                            sourcePage="courses_pack_grid"
                            audienceLabel={copy.audienceLabel}
                            levelLabel={getCoursePackLevelLabel(locale, pack.level)}
                            courseLabelSingular={copy.courseSingular}
                            courseLabelPlural={copy.coursePlural}
                            detailLabel={copy.viewDetails}
                            checkoutLabel={copy.buyNow}
                          />
                        ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-8 rounded-[1.45rem] border border-border bg-surface p-6">
                    <h3 className="text-xl font-semibold text-primary">{copy.noPacksTitle}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted">{copy.noPacksBody}</p>
                  </div>
                )}

                <div className="mt-10">
                  <BuyerBonusSection
                    locale={locale}
                    title={copy.bonusTitle}
                    description={copy.bonusDescription}
                    sourcePage="courses_bonus_section"
                    pack={fullPack}
                    claimHref={bonusClaimDestination?.href}
                    claimChannel={bonusClaimDestination?.channel ?? null}
                    actions={
                      <>
                        <CourseCheckoutButton
                          pack={fullPack}
                          label={copy.bonusPrimary}
                          sourcePage="courses_bonus_section"
                        />
                        <a href="#catalog" className="btn-secondary justify-center px-5 py-3">
                          {copy.bonusSecondary}
                        </a>
                        <BonusClaimButton
                          href={bonusClaimDestination?.href}
                          channel={bonusClaimDestination?.channel ?? null}
                          label={copy.bonusClaim}
                          sourcePage="courses_bonus_section"
                          eligibility="all-buyers"
                          className="w-full sm:w-auto"
                        />
                      </>
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="mt-8">
                <SectionHeading
                  eyebrow={copy.toggleCourses}
                  title={copy.coursesTitle}
                  description={copy.coursesDescription}
                  align="left"
                  className="mb-0"
                />
                {filteredCourses.length ? (
                  <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        locale={locale}
                        sourcePage="courses_catalog"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-8 rounded-[1.45rem] border border-border bg-surface p-6">
                    <h3 className="text-xl font-semibold text-primary">{copy.noCoursesTitle}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted">{copy.noCoursesBody}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container py-4 sm:py-6">
        <div className="gradient-border rounded-[1.95rem]">
          <div className="elevated-panel p-6 sm:p-7 md:p-8">
            <SectionHeading
              eyebrow={copy.heroEyebrow}
              title={copy.whyTitle}
              description={copy.whyBody}
              align="left"
              className="mb-0"
            />
            <div className="mt-8 grid gap-4 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div key={step} className="rounded-[1.45rem] border border-border bg-surface p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-500/90">
                    {locale === "fr" ? "Étape" : "Step"} {index + 1}
                  </p>
                  <p className="mt-3 text-sm font-medium leading-7 text-primary">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container py-4 sm:py-6">
        <div className="gradient-border rounded-[1.95rem]">
          <div className="elevated-panel p-6 sm:p-7 md:p-8">
            <SectionHeading
              eyebrow={copy.faqEyebrow}
              title={copy.faqTitle}
              description={locale === "fr" ? "Des réponses simples pour acheter en toute confiance." : "Simple answers to help you buy with confidence."}
              align="left"
              className="mb-0"
            />
            <div className="mt-8">
              <CourseFaq items={faqs} sourcePage="courses_faq" pack={fullPack} />
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-20">
        <div className="gradient-border rounded-[2.05rem]">
          <div className="elevated-panel px-6 py-8 sm:px-7 md:px-10 md:py-12">
            <h2 className="max-w-4xl text-4xl font-semibold text-primary md:text-5xl">{copy.finalTitle}</h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-muted">{copy.finalBody}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={buildViewHref("packs", { q, category, sort })} className="btn-primary justify-center px-5 py-3">
                {copy.browsePacks}
              </Link>
              <Link href={buildViewHref("courses", { q, category, sort })} className="btn-secondary justify-center px-5 py-3">
                {copy.browseCourses}
              </Link>
            </div>
            {whatsappUrl || supportEmail ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {whatsappUrl ? (
                  <CourseTrackedAnchor
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    eventName="whatsapp_course_inquiry"
                    eventParams={{
                      pack_id: fullPack.id,
                      pack_slug: fullPack.slug,
                      pack_title: fullPack.title,
                      source_page: "courses_final_cta",
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-5 py-3 text-sm font-medium text-primary transition hover:bg-background"
                  >
                    <MessageCircle className="size-4 text-cyan-600 dark:text-cyan-500" />
                    {copy.supportWhatsapp}
                  </CourseTrackedAnchor>
                ) : null}
                {supportEmail ? (
                  <a
                    href={`mailto:${supportEmail}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-5 py-3 text-sm font-medium text-primary transition hover:bg-background"
                  >
                    <Mail className="size-4 text-cyan-600 dark:text-cyan-500" />
                    {copy.supportEmail}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
