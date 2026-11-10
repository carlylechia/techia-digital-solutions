import type { Metadata } from "next";
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
  CourseTrackedLink,
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
  getCourseAcademyPositioning,
  getCourseAcademySteps,
  getCoursePackLevelLabel,
} from "@/lib/courses/coursePacks";

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
        ? "Explorez des cours individuels et des packs pratiques en marketing digital, IA, tech, business, bureautique, créativité, finance et compétences en ligne."
        : "Explore practical individual courses and curated packs across digital marketing, AI, tech, business, office, creative, finance, and online skills.",
    path: "/courses",
  });
}

export default async function CoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const { q, category, sort } = await searchParams;

  const [packs, courses, categories] = await Promise.all([
    getStorefrontPacks(locale),
    listPublishedCourses(locale),
    listPublishedCategories(locale),
  ]);
  const fullPack = packs.find((pack) => pack.id === "complete-digital-skills-pack");
  if (!fullPack) notFound();
  const subpacks = packs.filter((pack) => pack.id !== fullPack.id);

  const filteredCourses = filterCatalogCourses(courses, {
    query: q,
    category,
    sort: (sort as CatalogSort) || "recommended",
  });

  const faqs = getCourseAcademyFaqs(locale);
  const steps = getCourseAcademySteps(locale);
  const positioning = getCourseAcademyPositioning(locale);
  const supportEmail = getCoursesSupportEmail();
  const bonusClaimDestination = getCoursesBonusClaimDestination(locale);
  const whatsappUrl = getCoursesWhatsappUrl(
    locale === "fr"
      ? "Bonjour teChia, je veux des conseils pour choisir un cours ou un pack."
      : "Hello teChia, I want help choosing the right course or pack.",
  );

  const copy =
    locale === "fr"
      ? {
          heroTitle:
            "Des compétences digitales pratiques pour le travail, le business, le freelancing et la croissance en ligne.",
          heroDescription:
            "teChia Digital Academy vous donne accès à des cours individuels et des packs sélectionnés en marketing digital, design, IA, technologie, business, bureautique, finance et plus encore.",
          heroPrimary: "Obtenir le pack complet 16 cours",
          heroSecondary: "Explorer les cours",
          heroEyebrow: "teChia Digital Academy",
          heroBadges: [
            "Cours individuels et packs",
            "Paiement sécurisé",
            "Parcours pratiques",
          ],
          heroAsideEyebrow: "Offre principale",
          heroAsideBody:
            "Le pack complet est la recommandation principale si vous voulez la bibliothèque d’apprentissage la plus large et la meilleure valeur globale.",
          viewFullPack: "Voir le pack complet",
          buyFullPack: "Acheter le pack complet",
          supportWhatsapp: "Demander sur WhatsApp",
          supportEmail: "Contacter par email",
          positionTitle: "Pourquoi teChia Digital Academy existe",
          subpacksEyebrow: "Packs sélectionnés",
          subpacksTitle:
            "Choisissez un pack ciblé ou commencez par le parcours complet.",
          subpacksDescription:
            "Chaque pack est pensé pour un besoin concret. Le pack complet reste recommandé si vous voulez toute la bibliothèque.",
          audienceLabel: "Idéal pour",
          courseSingular: "cours",
          coursePlural: "cours",
          viewDetails: "Voir les détails",
          buyNow: "Acheter",
          catalogEyebrow: "Catalogue des cours",
          catalogTitle: "Explorez les cours individuels",
          catalogDescription:
            "Recherchez, filtrez et découvrez chaque cours disponible. Achetez un cours seul, ou choisissez un pack si vous voulez un parcours plus large.",
          noResultsTitle: "Aucun cours trouvé",
          noResultsBody:
            "Essayez un autre mot-clé, changez de catégorie ou effacez les filtres pour voir tous les cours publiés.",
          howItWorksEyebrow: "Comment ça marche",
          howItWorksTitle: "Un parcours simple, propre et fiable.",
          howItWorksDescription:
            "teChia vous aide à choisir le bon cours ou pack, puis vous guide vers un paiement sécurisé et les prochaines étapes d’accès.",
          faqEyebrow: "Questions fréquentes",
          faqTitle: "Réponses claires avant l’achat.",
          faqDescription:
            "Les questions les plus fréquentes pour aider les acheteurs à choisir avec confiance.",
          finalEyebrow: "Prêt à commencer",
          finalTitle:
            "Choisissez un cours individuel, un pack ciblé ou la collection complète.",
          finalDescription:
            "Le pack complet reste la meilleure option si vous voulez accéder aux 16 cours au même endroit. Sinon, commencez avec le cours ou le sous-pack le plus proche de votre besoin actuel.",
          browseSubpacks: "Parcourir les packs",
          buyerBonusTitle: "Official teChia Buyer Bonus",
          buyerBonusDescription:
            "Achetez via la page officielle teChia Digital Academy et débloquez des ressources bonus pratiques pour apprendre avec plus de direction et mieux appliquer vos compétences.",
          buyerBonusPrimary: "Obtenir le pack complet + bonus",
          buyerBonusSecondary: "Voir tous les packs",
          buyerBonusClaim: "Réclamer le bonus acheteur",
        }
      : {
          heroTitle:
            "Practical digital skills for work, business, freelancing, and online growth.",
          heroDescription:
            "teChia Digital Academy gives you access to individual courses and curated packs across digital marketing, design, AI, technology, business, office, finance, and more.",
          heroPrimary: "Get the Full 16-Course Pack",
          heroSecondary: "Explore Courses",
          heroEyebrow: "teChia Digital Academy",
          heroBadges: [
            "Individual courses and packs",
            "Secure checkout",
            "Practical learning paths",
          ],
          heroAsideEyebrow: "Primary offer",
          heroAsideBody:
            "The full pack is the main recommendation if you want the broadest learning library and the strongest overall value.",
          viewFullPack: "View Full Pack",
          buyFullPack: "Buy Full Pack",
          supportWhatsapp: "Ask on WhatsApp",
          supportEmail: "Contact by email",
          positionTitle: "Why teChia Digital Academy exists",
          subpacksEyebrow: "Curated packs",
          subpacksTitle:
            "Choose a focused pack or start with the complete learning library.",
          subpacksDescription:
            "Each pack is built around a practical goal. The full pack remains the recommended option if you want the entire library.",
          audienceLabel: "Best for",
          courseSingular: "course",
          coursePlural: "courses",
          viewDetails: "View Details",
          buyNow: "Buy Now",
          catalogEyebrow: "Course catalog",
          catalogTitle: "Explore individual courses",
          catalogDescription:
            "Search, filter, and discover every available course. Buy a single course on its own, or choose a pack when you want a broader learning path.",
          noResultsTitle: "No courses found",
          noResultsBody:
            "Try a different keyword, change the category, or clear filters to see all published courses.",
          howItWorksEyebrow: "How it works",
          howItWorksTitle: "A clean and trustworthy buying path.",
          howItWorksDescription:
            "teChia helps you choose the right course or pack, then guides you to secure payment and the next access steps.",
          faqEyebrow: "FAQ",
          faqTitle: "Clear answers before you buy.",
          faqDescription:
            "Practical buyer questions answered in a straightforward way.",
          finalEyebrow: "Ready to begin",
          finalTitle:
            "Choose an individual course, a focused pack, or the complete collection.",
          finalDescription:
            "The full pack remains the best option if you want access to all 16 courses in one place. If not, start with the individual course or pack that best matches your current learning need.",
          browseSubpacks: "Browse Packs",
          buyerBonusTitle: "Official teChia Buyer Bonus",
          buyerBonusDescription:
            "Buy through the official teChia Digital Academy page and unlock practical bonus resources to help you learn with direction and apply your skills better.",
          buyerBonusPrimary: "Get the Full Pack + Bonus",
          buyerBonusSecondary: "View All Packs",
          buyerBonusClaim: "Claim Buyer Bonus",
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
          { href: fullPack.path, label: copy.heroPrimary },
          { href: "#individual-courses", label: copy.heroSecondary, variant: "secondary" },
        ]}
        aside={
          <div className="rounded-[1.55rem] bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(251,113,133,0.14),transparent_28%)] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                {copy.heroAsideEyebrow}
              </p>
              {fullPack.badge ? <span className="trust-pill">{fullPack.badge}</span> : null}
            </div>
            <h2 className="mt-4 text-3xl font-semibold text-primary">{fullPack.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted dark:text-slate-300">{copy.heroAsideBody}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="trust-pill">{fullPack.courseCount} {copy.coursePlural}</span>
              <span className="trust-pill">{getCoursePackLevelLabel(locale, fullPack.level)}</span>
            </div>
            <div className="mt-6 grid gap-3">
              <CourseTrackedLink
                href={fullPack.path}
                eventName="course_pack_click"
                eventParams={{ pack_id: fullPack.id, pack_slug: fullPack.slug, pack_title: fullPack.title, source_page: "courses_hero" }}
                className="btn-secondary justify-center px-5 py-3"
              >
                {copy.viewFullPack}
              </CourseTrackedLink>
              <CourseCheckoutButton pack={fullPack} label={copy.buyFullPack} sourcePage="courses_hero" />
              {whatsappUrl ? (
                <CourseTrackedAnchor
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  eventName="whatsapp_course_inquiry"
                  eventParams={{ pack_id: fullPack.id, pack_slug: fullPack.slug, pack_title: fullPack.title, source_page: "courses_hero" }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-5 py-3 text-sm font-medium text-primary transition hover:bg-background dark:border-white/12 dark:bg-white/[0.05] dark:text-white dark:hover:bg-white/[0.08]"
                >
                  <MessageCircle className="size-4 text-cyan-600 dark:text-cyan-300" />
                  {copy.supportWhatsapp}
                </CourseTrackedAnchor>
              ) : null}
            </div>
          </div>
        }
      />

      <section className="container py-4 sm:py-6">
        <div className="gradient-border rounded-[1.95rem]">
          <div className="elevated-panel p-6 sm:p-7 md:p-8">
            <SectionHeading eyebrow={positioning.eyebrow} title={copy.positionTitle} description={positioning.title} align="left" className="mb-0" />
            <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.45rem] border border-border bg-background/75 p-5 text-base leading-8 text-muted">{positioning.body}</div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  fullPack.tagline,
                  locale === "fr" ? "Cours individuels et packs pensés pour des objectifs concrets." : "Individual courses and packs designed around practical goals.",
                  locale === "fr" ? "Des parcours sélectionnés par teChia pour une progression utile." : "teChia-curated learning paths for useful progress.",
                  locale === "fr" ? "Paiement sécurisé et vérification côté serveur." : "Secure checkout with server-side payment verification.",
                ].map((item) => (
                  <div key={item} className="rounded-[1.35rem] border border-cyan-500/18 bg-cyan-500/[0.08] p-4 text-sm leading-7 text-primary">{item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <FeaturedFullPack locale={locale} pack={fullPack} />

      <BuyerBonusSection
        locale={locale}
        title={copy.buyerBonusTitle}
        description={copy.buyerBonusDescription}
        sourcePage="courses_bonus_section"
        claimHref={bonusClaimDestination?.href}
        claimChannel={bonusClaimDestination?.channel ?? null}
        actions={
          <>
            <CourseCheckoutButton pack={fullPack} label={copy.buyerBonusPrimary} sourcePage="courses_bonus_section" />
            <a href="#course-packs" className="btn-secondary justify-center px-5 py-3">{copy.buyerBonusSecondary}</a>
            <BonusClaimButton href={bonusClaimDestination?.href} channel={bonusClaimDestination?.channel ?? null} label={copy.buyerBonusClaim} sourcePage="courses_bonus_section" eligibility="all-buyers" className="w-full sm:w-auto" />
          </>
        }
      />

      <section id="course-packs" className="container py-4 sm:py-6">
        <div className="gradient-border rounded-[1.95rem]">
          <div className="elevated-panel p-6 sm:p-7 md:p-8">
            <SectionHeading eyebrow={copy.subpacksEyebrow} title={copy.subpacksTitle} description={copy.subpacksDescription} align="left" className="mb-0" />
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {subpacks.map((pack) => (
                <CoursePackCard key={pack.id} pack={pack} sourcePage="courses_pack_grid" audienceLabel={copy.audienceLabel} levelLabel={getCoursePackLevelLabel(locale, pack.level)} courseLabelSingular={copy.courseSingular} courseLabelPlural={copy.coursePlural} detailLabel={copy.viewDetails} checkoutLabel={copy.buyNow} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="individual-courses" className="container py-4 sm:py-6">
        <div className="gradient-border rounded-[1.95rem]">
          <div className="elevated-panel p-6 sm:p-7 md:p-8">
            <SectionHeading eyebrow={copy.catalogEyebrow} title={copy.catalogTitle} description={copy.catalogDescription} align="left" className="mb-0" />
            <div className="mt-8">
              <CourseCatalogFilters locale={locale} categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
            </div>
            {filteredCourses.length ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} locale={locale} sourcePage="courses_catalog" />
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-[1.45rem] border border-border bg-surface p-6">
                <h3 className="text-xl font-semibold text-primary">{copy.noResultsTitle}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{copy.noResultsBody}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container py-4 sm:py-6">
        <div className="gradient-border rounded-[1.95rem]">
          <div className="elevated-panel p-6 sm:p-7 md:p-8">
            <SectionHeading eyebrow={copy.howItWorksEyebrow} title={copy.howItWorksTitle} description={copy.howItWorksDescription} align="left" className="mb-0" />
            <div className="mt-8 grid gap-4 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div key={step} className="rounded-[1.45rem] border border-border bg-surface p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-500/90">{locale === "fr" ? "Étape" : "Step"} {index + 1}</p>
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
            <SectionHeading eyebrow={copy.faqEyebrow} title={copy.faqTitle} description={copy.faqDescription} align="left" className="mb-0" />
            <div className="mt-8">
              <CourseFaq items={faqs} sourcePage="courses_faq" pack={fullPack} />
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-20">
        <div className="gradient-border rounded-[2.05rem]">
          <div className="elevated-panel px-6 py-8 sm:px-7 md:px-10 md:py-12">
            <p className="eyebrow">{copy.finalEyebrow}</p>
            <h2 className="mt-4 max-w-4xl text-4xl font-semibold text-primary md:text-5xl">{copy.finalTitle}</h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-muted">{copy.finalDescription}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <CourseTrackedLink href={fullPack.path} eventName="course_pack_click" eventParams={{ pack_id: fullPack.id, pack_slug: fullPack.slug, pack_title: fullPack.title, source_page: "courses_final_cta" }} className="btn-secondary justify-center px-5 py-3">{copy.viewFullPack}</CourseTrackedLink>
              <CourseCheckoutButton pack={fullPack} label={copy.buyFullPack} sourcePage="courses_final_cta" />
              <a href="#course-packs" className="btn-primary justify-center px-5 py-3">{copy.browseSubpacks}</a>
            </div>
            {whatsappUrl || supportEmail ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {whatsappUrl ? (
                  <CourseTrackedAnchor href={whatsappUrl} target="_blank" rel="noreferrer" eventName="whatsapp_course_inquiry" eventParams={{ pack_id: fullPack.id, pack_slug: fullPack.slug, pack_title: fullPack.title, source_page: "courses_final_cta" }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-5 py-3 text-sm font-medium text-primary transition hover:bg-background">
                    <MessageCircle className="size-4 text-cyan-600 dark:text-cyan-500" />{copy.supportWhatsapp}
                  </CourseTrackedAnchor>
                ) : null}
                {supportEmail ? (
                  <a href={`mailto:${supportEmail}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-5 py-3 text-sm font-medium text-primary transition hover:bg-background">
                    <Mail className="size-4 text-cyan-600 dark:text-cyan-500" />{copy.supportEmail}
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
