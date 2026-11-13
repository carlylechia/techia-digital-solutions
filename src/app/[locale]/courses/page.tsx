import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { BonusClaimButton } from "@/components/courses/BonusClaimButton";
import { BuyerBonusSection } from "@/components/courses/BuyerBonusSection";
import { CourseCard } from "@/components/courses/CourseCard";
import { CourseCatalogFilters } from "@/components/courses/CourseCatalogFilters";
import { CourseFaq } from "@/components/courses/CourseFaq";
import { CoursePackCard } from "@/components/courses/CoursePackCard";
import { CourseCheckoutButton } from "@/components/courses/CourseCheckoutButton";
import { OpenAIChatButton } from "@/components/ai/OpenAIChatButton";
import { FeaturedFullPack } from "@/components/courses/FeaturedFullPack";
import {
  CoursePageAnalytics,
  CourseTrackedAnchor,
} from "@/components/courses/course-analytics";
import { JsonLd } from "@/components/ui/json-ld";
import { PageBreadcrumbs } from "@/components/ui/page-breadcrumbs";
import { SectionHeading } from "@/components/ui/section-heading";
import { isLocale, type Locale } from "@/content/site";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { formatMoney } from "@/lib/payments/money";
import { getCheckoutHints } from "@/lib/payments/providers";
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
import { calculatePackValue } from "@/lib/courses/pack-value";
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
  // Courses are the default storefront view, so keep that URL clean.
  if (view === "packs") params.set("view", "packs");
  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.category) params.set("category", searchParams.category);
  if (searchParams.sort) params.set("sort", searchParams.sort);
  const query = params.toString();
  return `${getPublicAppPath("/courses")}${query ? `?${query}` : ""}#catalog`;
}

function packValueLabel(
  locale: Locale,
  savingsMinor: number,
  savingsPercent: number,
  currency: string,
) {
  const amount = formatMoney(savingsMinor, currency, locale);
  return locale === "fr"
    ? `Économisez ${amount} (${savingsPercent} %)`
    : `Save ${amount} (${savingsPercent}%)`;
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
  const activeView: "courses" | "packs" = view === "packs" ? "packs" : "courses";

  const [packs, courses, categories] = await Promise.all([
    getStorefrontPacks(locale),
    listPublishedCourses(locale),
    listPublishedCategories(locale),
  ]);
  const checkoutHints = await getCheckoutHints();
  const fullPack = packs.find((pack) => pack.id === "complete-digital-skills-pack");
  if (!fullPack) notFound();
  const subpacks = packs.filter((pack) => pack.id !== fullPack.id);
  const allPacks = [fullPack, ...subpacks];
  const packValues = new Map(
    allPacks.map((pack) => {
      const value = calculatePackValue(pack, courses);
      return [
        pack.id,
        value
          ? {
              compareAtPriceMinor: value.separateTotalMinor,
              savingsLabel: packValueLabel(
                locale,
                value.savingsMinor,
                value.savingsPercent,
                pack.priceCurrency,
              ),
            }
          : null,
      ] as const;
    }),
  );

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
          heroTitle: "Des compétences utiles. Des cours achetés en toute confiance.",
          heroDescription:
            "Achetez des cours digitaux pratiques à votre rythme. Choisissez un cours pour un objectif précis, ou un pack qui réunit des cours complémentaires dans une formule complète.",
          heroPrimary: "Voir les cours",
          heroSecondary: "Explorer les packs",
          heroTrust: ["Paiement sécurisé", "Cours pratiques", "Valeur des packs"],
          trustLine: "Paiement sécurisé · Prix clairs · Aide avant achat",
          searchEyebrow: "Boutique de l’académie",
          searchTitle: "Trouvez le cours adapté à votre objectif",
          searchDescription:
            "Recherchez par compétence, filtrez par catégorie, comparez les prix et achetez le cours qui vous convient. Les packs sont disponibles pour un parcours plus large.",
          toggleCourses: "Cours",
          togglePacks: "Packs de cours",
          coursesTitle: "Tous les cours",
          coursesDescription:
            "Des cours pratiques et ciblés, achetables à l’unité. Choisissez une compétence, consultez le cours et payez en toute sécurité.",
          packsTitle: "Packs de cours",
          packsDescription:
            "Des formules spéciales qui réunissent des cours complémentaires dans un seul parcours — plus simple pour élargir vos compétences et obtenir plus de valeur.",
          bundleEyebrow: "Élargissez vos compétences",
          bundleTitle: "Vous voulez plusieurs compétences ? Réunissez-les dans un pack.",
          bundleBody:
            "Les packs réunissent des cours complémentaires dans une seule formule, pour suivre un parcours complet au lieu de choisir chaque cours séparément.",
          bundleCta: "Explorer les packs",
          packsIntroEyebrow: "Formules spéciales",
          packsIntroTitle: "Plus de compétences, une seule formule.",
          packsIntroBody:
            "Chaque pack réunit des cours complémentaires dans un parcours unique. Choisissez un pack pour élargir vos compétences, suivre une structure claire et payer une seule fois.",
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
          finalTitle: "Prêt à apprendre quelque chose d’utile ?",
          finalBody:
            "Achetez un cours pour une compétence ciblée, ou choisissez un pack qui réunit des cours complémentaires dans un parcours complet.",
          browseCourses: "Voir les cours",
          browsePacks: "Explorer les packs",
          supportWhatsapp: "Demander conseil sur WhatsApp",
          supportEmail: "Contacter par email",
          clearFilters: "Effacer les filtres",
          aiCtaEyebrow: "Besoin d'aide pour choisir ?",
          aiCtaTitle: "Parlez à l’agent IA teChia",
          aiCtaBody:
            "Si vous hésitez entre un cours et un pack, l’agent IA peut comparer les options selon votre objectif, votre niveau et votre budget.",
          aiCtaButton: "Demander conseil à l’IA",
        }
      : {
          heroEyebrow: "teChia Digital Academy",
          heroTitle: "Skills you can use. Courses you can buy with confidence.",
          heroDescription:
            "Shop practical digital courses at your own pace. Pick a course for one clear goal, or choose a course pack that combines related courses into one complete learning package.",
          heroPrimary: "Shop courses",
          heroSecondary: "Explore course packs",
          heroTrust: ["Secure checkout", "Practical lessons", "Bundle value"],
          trustLine: "Secure checkout · Clear pricing · Help before you buy",
          searchEyebrow: "Shop the academy",
          searchTitle: "Find the right course for your goal",
          searchDescription:
            "Search by skill, filter by category, compare prices, and buy the course that fits. Course packs are available when you want a broader learning path.",
          toggleCourses: "Courses",
          togglePacks: "Course packs",
          coursesTitle: "All courses",
          coursesDescription:
            "Focused, practical courses you can buy one at a time. Choose a skill, review the course, and check out securely.",
          packsTitle: "Course packs",
          packsDescription:
            "Special packages that combine related courses into one learning path — a simpler way to build broader skills and get more value.",
          bundleEyebrow: "Build a broader skill set",
          bundleTitle: "Want more than one skill? Combine courses in a pack.",
          bundleBody:
            "Course packs bundle related courses into one package, so you can follow a complete path instead of choosing every course separately.",
          bundleCta: "Explore course packs",
          packsIntroEyebrow: "Special packages",
          packsIntroTitle: "More skills, one complete package.",
          packsIntroBody:
            "Each pack combines related courses into a single learning path. Choose a pack when you want a broader skill set, a clear structure, and one simple checkout.",
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
          finalTitle: "Ready to learn something useful?",
          finalBody:
            "Shop a course for one focused skill, or choose a pack that combines related courses into a complete learning path.",
          browseCourses: "Shop courses",
          browsePacks: "Explore course packs",
          supportWhatsapp: "Ask on WhatsApp",
          supportEmail: "Contact by email",
          clearFilters: "Clear filters",
          aiCtaEyebrow: "Need help choosing?",
          aiCtaTitle: "Talk to the teChia AI agent",
          aiCtaBody:
            "If you are unsure which course or pack fits your goal, the AI agent can compare options using your objective, level, and budget.",
          aiCtaButton: "Ask the AI agent",
        };

  const resultLabel =
    activeView === "packs"
      ? `${filteredPacks.length} ${filteredPacks.length === 1 ? "pack" : "packs"}`
      : `${filteredCourses.length} ${
          filteredCourses.length === 1 ? copy.courseSingular : copy.coursePlural
        }`;

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

      <div className="container pt-4 sm:pt-6">
        <PageBreadcrumbs
          items={[
            {
              label: locale === "fr" ? "Accueil" : "Home",
              href: getPublicAppPath("/"),
            },
            { label: locale === "fr" ? "Cours" : "Courses" },
          ]}
        />
      </div>

      <section className="relative isolate overflow-hidden">
        <div className="relative min-h-[78svh] w-full sm:min-h-[84svh] lg:min-h-[90svh]">
          <Image
            src="/images/courses/hero-academy-tech.jpg"
            alt={
              locale === "fr"
                ? "Professionnelle noire travaillant sur tablette le long d'une baie de serveurs"
                : "Black professional working on a tablet beside a data-center corridor"
            }
            fill
            priority
            sizes="100vw"
            className="object-cover object-[68%_center] sm:object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

          <div className="relative z-10 flex h-full min-h-[78svh] items-end sm:min-h-[84svh] lg:min-h-[90svh]">
            <div className="container pb-10 pt-28 sm:pb-14 sm:pt-32 lg:pb-16">
              <div className="max-w-3xl">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-cyan-200/90">
                  {copy.heroEyebrow}
                </p>
                <h1 className="headline-gradient mt-4 text-balance text-[clamp(2.4rem,6vw,4.8rem)] font-semibold leading-[0.95]">
                  {copy.heroTitle}
                </h1>
                <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-white/85 sm:text-lg">
                  {copy.heroDescription}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href={buildViewHref("courses", { q, category, sort })}
                    className="btn-primary justify-center px-5 py-3"
                  >
                    {copy.heroPrimary}
                  </Link>
                  <Link
                    href={buildViewHref("packs", { q, category, sort })}
                    className="btn-secondary justify-center border-white/30 bg-white/10 px-5 py-3 text-white backdrop-blur-sm hover:bg-white/20"
                  >
                    {copy.heroSecondary}
                  </Link>
                </div>
                <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-white/75">
                  {copy.heroTrust.map((item) => (
                    <li key={item} className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5 text-cyan-300/90" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="container scroll-mt-24 py-4 sm:py-6">
        <div className="gradient-border rounded-[1.95rem]">
          <div className="elevated-panel p-6 sm:p-7 md:p-8">
            <div className="max-w-3xl">
              <p className="eyebrow">{copy.searchEyebrow}</p>
              <h2 className="mt-3 text-balance text-3xl font-semibold text-primary sm:text-4xl">
                {copy.searchTitle}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
                {copy.searchDescription}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div
                className="inline-flex w-fit rounded-full border border-border bg-background/70 p-1"
                role="group"
                aria-label={locale === "fr" ? "Choisir l’affichage" : "Choose view"}
              >
                <Link
                  href={buildViewHref("courses", { q, category, sort })}
                  aria-current={activeView === "courses" ? "page" : undefined}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    activeView === "courses"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  {copy.toggleCourses}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      activeView === "courses"
                        ? "bg-white/15 text-white"
                        : "bg-background text-muted"
                    }`}
                  >
                    {courses.length}
                  </span>
                </Link>
                <Link
                  href={buildViewHref("packs", { q, category, sort })}
                  aria-current={activeView === "packs" ? "page" : undefined}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    activeView === "packs"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  {copy.togglePacks}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      activeView === "packs"
                        ? "bg-white/15 text-white"
                        : "bg-background text-muted"
                    }`}
                  >
                    {allPacks.length}
                  </span>
                </Link>
              </div>

              <p className="hidden items-center gap-2 text-xs font-medium text-muted sm:inline-flex">
                <ShieldCheck className="size-4 text-cyan-700 dark:text-cyan-400" aria-hidden="true" />
                {copy.trustLine}
              </p>
            </div>

            <div className="mt-5">
              <CourseCatalogFilters
                locale={locale}
                categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
                mode={activeView}
              />
            </div>

            <p className="mt-4 text-sm font-medium text-primary" aria-live="polite">
              {resultLabel}
            </p>

            {activeView === "packs" ? (
              <div className="mt-6">
                <div className="rounded-[1.45rem] border border-cyan-500/20 bg-cyan-500/[0.06] p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-400">
                      <Sparkles className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-400">
                        {copy.packsIntroEyebrow}
                      </p>
                      <h3 className="mt-1.5 text-xl font-semibold text-primary sm:text-2xl">
                        {copy.packsIntroTitle}
                      </h3>
                      <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
                        {copy.packsIntroBody}
                      </p>
                    </div>
                  </div>
                </div>

                {filteredPacks.length ? (
                  <>
                    {filteredPacks.some((p) => p.recommended) ? (
                      <div className="mt-6">
                        <FeaturedFullPack
                          locale={locale}
                          pack={fullPack}
                          compareAtPriceMinor={packValues.get(fullPack.id)?.compareAtPriceMinor}
                          savingsLabel={packValues.get(fullPack.id)?.savingsLabel}
                        />
                      </div>
                    ) : null}
                    <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {filteredPacks
                        .filter((p) => !p.recommended)
                        .map((pack) => (
                          <CoursePackCard
                            key={pack.id}
                            pack={pack}
                            locale={locale}
                            sourcePage="courses_pack_grid"
                            audienceLabel={copy.audienceLabel}
                            levelLabel={getCoursePackLevelLabel(locale, pack.level)}
                            courseLabelSingular={copy.courseSingular}
                            courseLabelPlural={copy.coursePlural}
                            detailLabel={copy.viewDetails}
                            checkoutLabel={copy.buyNow}
                            compareAtPriceMinor={packValues.get(pack.id)?.compareAtPriceMinor}
                            savingsLabel={packValues.get(pack.id)?.savingsLabel}
                          />
                        ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-6 rounded-[1.45rem] border border-border bg-surface p-6">
                    <h3 className="text-xl font-semibold text-primary">{copy.noPacksTitle}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted">{copy.noPacksBody}</p>
                    <Link
                      href={`${getPublicAppPath("/courses")}?view=packs#catalog`}
                      className="btn-secondary mt-5 justify-center px-5 py-3"
                    >
                      {copy.clearFilters}
                    </Link>
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
                          hints={checkoutHints}
                          chariowProductId={fullPack.chariowProductId}
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
              <div className="mt-6">
                <div>
                  <h3 className="text-xl font-semibold text-primary sm:text-2xl">
                    {copy.coursesTitle}
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
                    {copy.coursesDescription}
                  </p>
                </div>

                {filteredCourses.length ? (
                  <>
                    <Link
                      href={buildViewHref("packs", { q, category, sort })}
                      className="group mt-5 flex flex-col gap-4 rounded-[1.35rem] border border-cyan-500/25 bg-cyan-500/[0.06] p-5 transition hover:border-cyan-500/45 hover:bg-cyan-500/[0.09] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-400">
                          <Sparkles className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-400">
                            {copy.bundleEyebrow}
                          </p>
                          <p className="mt-1 text-base font-semibold text-primary">
                            {copy.bundleTitle}
                          </p>
                          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
                            {copy.bundleBody}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-cyan-400">
                        {copy.bundleCta}
                        <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                    </Link>

                    <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {filteredCourses.map((course) => (
                        <CourseCard
                          key={course.id}
                          course={course}
                          locale={locale}
                          sourcePage="courses_catalog"
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-6 rounded-[1.45rem] border border-border bg-surface p-6">
                    <h3 className="text-xl font-semibold text-primary">{copy.noCoursesTitle}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted">{copy.noCoursesBody}</p>
                    <Link
                      href={`${getPublicAppPath("/courses")}#catalog`}
                      className="btn-secondary mt-5 justify-center px-5 py-3"
                    >
                      {copy.clearFilters}
                    </Link>
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

      <section className="container py-4 sm:py-6">
        <div className="gradient-border rounded-[1.95rem]">
          <div className="elevated-panel flex flex-col gap-4 p-6 sm:p-7 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="max-w-3xl">
              <p className="eyebrow">{copy.aiCtaEyebrow}</p>
              <h2 className="mt-3 text-2xl font-semibold text-primary sm:text-3xl">
                {copy.aiCtaTitle}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">{copy.aiCtaBody}</p>
            </div>
            <OpenAIChatButton
              label={copy.aiCtaButton}
              className="btn-secondary justify-center px-5 py-3"
            />
          </div>
        </div>
      </section>

      <section className="container pb-20">
        <div className="gradient-border rounded-[2.05rem]">
          <div className="elevated-panel px-6 py-8 sm:px-7 md:px-10 md:py-12">
            <h2 className="max-w-4xl text-4xl font-semibold text-primary md:text-5xl">{copy.finalTitle}</h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-muted">{copy.finalBody}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={buildViewHref("courses", { q, category, sort })}
                className="btn-primary justify-center px-5 py-3"
              >
                {copy.browseCourses}
              </Link>
              <Link
                href={buildViewHref("packs", { q, category, sort })}
                className="btn-secondary justify-center px-5 py-3"
              >
                {copy.browsePacks}
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
