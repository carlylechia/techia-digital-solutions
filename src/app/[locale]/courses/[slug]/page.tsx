import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { BonusClaimButton } from "@/components/courses/BonusClaimButton";
import { BuyerBonusSection } from "@/components/courses/BuyerBonusSection";
import { CourseFaq } from "@/components/courses/CourseFaq";
import { CourseHero } from "@/components/courses/CourseHero";
import { CourseCheckoutButton } from "@/components/courses/CourseCheckoutButton";
import { FullPackBonusUpsell } from "@/components/courses/FullPackBonusUpsell";
import { RelatedCoursePacks } from "@/components/courses/RelatedCoursePacks";
import {
  CoursePageAnalytics,
  CourseTrackedAnchor,
  CourseTrackedLink,
} from "@/components/courses/course-analytics";
import { JsonLd } from "@/components/ui/json-ld";
import { SectionHeading } from "@/components/ui/section-heading";
import { isLocale, type Locale } from "@/content/site";
import {
  getCoursesBonusClaimDestination,
  getCoursesSupportEmail,
  getCoursesWhatsappUrl,
} from "@/lib/courses/chariowLinks";
import {
  getCourseAcademyFaqs,
  getCourseAcademySteps,
  getCoursePackBySlug,
  getCoursePackLevelLabel,
  getFullCoursePack,
  getRelatedCoursePacks,
} from "@/lib/courses/coursePacks";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { getLocalizedAppPath } from "@/lib/site-routes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const pack = getCoursePackBySlug(locale, slug);

  if (!pack) {
    return createMetadata({
      locale,
      title: locale === "fr" ? "Pack introuvable" : "Pack not found",
      description:
        locale === "fr"
          ? "Ce pack teChia Digital Academy est introuvable."
          : "This teChia Digital Academy pack could not be found.",
      path: `/courses/${slug}`,
    });
  }

  return createMetadata({
    locale,
    title: pack.seoTitle,
    description: pack.seoDescription,
    path: `/courses/${slug}`,
  });
}

export default async function CoursePackDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;

  const pack = getCoursePackBySlug(locale, slug);
  if (!pack) notFound();

  const fullPack = getFullCoursePack(locale);
  const faqs = getCourseAcademyFaqs(locale);
  const steps = getCourseAcademySteps(locale);
  const supportEmail = getCoursesSupportEmail();
  const bonusClaimDestination = getCoursesBonusClaimDestination(locale);
  const whatsappUrl = getCoursesWhatsappUrl(
    locale === "fr"
      ? `Bonjour teChia, je veux des informations sur le pack ${pack.title}.`
      : `Hello teChia, I want more information about the ${pack.title} pack.`,
  );
  const relatedPacks = getRelatedCoursePacks(locale, pack.id).filter((item) =>
    pack.recommended ? true : !item.recommended,
  );

  const copy =
    locale === "fr"
      ? {
          heroDescription: pack.longDescription,
          viewAllPacks: "Voir tous les packs",
          buyNow: "Acheter ce pack",
          askWhatsapp: "Contacter sur WhatsApp",
          supportEmail: "Contacter par email",
          forTitle: "Pour qui ce pack est-il conçu ?",
          learningTitle: "Ce que vous allez apprendre",
          includedTitle: "Cours inclus",
          whyChooseTitle: "Pourquoi choisir ce pack",
          accessTitle: "Comment l’accès fonctionne",
          accessBody:
            "Le paiement se termine sur Chariow. Ensuite, teChia vous envoie les instructions d’accès liées au pack choisi. En cas de difficulté, contactez teChia avant de refaire plusieurs paiements.",
          faqEyebrow: "Questions fréquentes",
          faqTitle: "Réponses utiles avant votre achat.",
          finalTitle: "Prêt à choisir ce pack ?",
          finalBody:
            "Vous pouvez continuer avec ce pack précis ou revenir à la page principale pour comparer toutes les options disponibles.",
          backToCourses: "Retour aux packs",
          highlightsLabel: "Atouts du pack",
          courseSingular: "cours",
          coursePlural: "cours",
          packOverview: "Vue d’ensemble du pack",
          packLabel: "Pack teChia",
          buyerBonusTitle: pack.recommended
            ? "Bundle bonus exclusif du pack complet"
            : "Votre achat inclut le Official teChia Buyer Bonus",
          buyerBonusDescription: pack.recommended
            ? "Achetez le pack complet 16 cours via la page officielle teChia Digital Academy et debloquez le bundle bonus complet, avec feuilles de route, templates pratiques, plan d'action 30 jours et support prioritaire pour les questions d'acces."
            : "Quand vous achetez ce pack via la page officielle teChia Digital Academy, vous pouvez reclamer des ressources bonus comme la Digital Skills Learning Roadmap, le Skill Monetization Starter Guide et le Course Learning Tracker.",
          buyerBonusClaim: "Reclamer le bonus acheteur",
          buyerBonusBuyFullPack: "Acheter le pack complet + bonus",
        }
      : {
          heroDescription: pack.longDescription,
          viewAllPacks: "View all packs",
          buyNow: "Buy this pack",
          askWhatsapp: "Ask on WhatsApp",
          supportEmail: "Contact by email",
          forTitle: "Who this pack is for",
          learningTitle: "What you will learn",
          includedTitle: "Courses included",
          whyChooseTitle: "Why choose this pack",
          accessTitle: "How access works",
          accessBody:
            "Payment is completed through Chariow. After that, teChia sends the access instructions connected to the pack you selected. If you run into any difficulty, contact teChia before attempting multiple payments.",
          faqEyebrow: "FAQ",
          faqTitle: "Useful answers before you buy.",
          finalTitle: "Ready to choose this pack?",
          finalBody:
            "You can continue with this exact pack or return to the main courses page to compare the available options.",
          backToCourses: "Back to all packs",
          highlightsLabel: "Why it stands out",
          courseSingular: "course",
          coursePlural: "courses",
          packOverview: "Pack overview",
          packLabel: "teChia Pack",
          buyerBonusTitle: pack.recommended
            ? "Full Pack Exclusive Bonus Bundle"
            : "Your purchase includes the Official teChia Buyer Bonus",
          buyerBonusDescription: pack.recommended
            ? "Buy the complete 16-course pack through the official teChia Digital Academy page and unlock the complete bonus bundle, including learning roadmaps, practical templates, a 30-day action plan, and priority buyer support for access-related issues."
            : "When you buy this pack through the official teChia Digital Academy page, you can claim bonus resources such as the Digital Skills Learning Roadmap, Skill Monetization Starter Guide, and Course Learning Tracker.",
          buyerBonusClaim: "Claim Buyer Bonus",
          buyerBonusBuyFullPack: "Buy Full Pack + Claim Bonus",
        };

  return (
    <main>
      <CoursePageAnalytics
        name="course_pack_view"
        params={{
          pack_id: pack.id,
          pack_slug: pack.slug,
          pack_title: pack.title,
          source_page: "course_pack_detail",
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: locale === "fr" ? "Accueil" : "Home", path: "" },
          {
            name: locale === "fr" ? "Cours" : "Courses",
            path: "/courses",
          },
          { name: pack.title, path: `/courses/${slug}` },
        ])}
      />

      <CourseHero
        locale={locale}
        eyebrow={pack.category}
        title={pack.title}
        description={copy.heroDescription}
        badges={[
          pack.badge || copy.packLabel,
          `${pack.courseCount} ${
            pack.courseCount === 1 ? copy.courseSingular : copy.coursePlural
          }`,
          getCoursePackLevelLabel(locale, pack.level),
        ]}
        actions={[
          { href: "/courses", label: copy.viewAllPacks, variant: "secondary" },
        ]}
        aside={
          <div className="rounded-[1.55rem] bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(251,113,133,0.14),transparent_28%)] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                {copy.packOverview}
              </p>
              {pack.badge ? (
                <span className="trust-pill">{pack.badge}</span>
              ) : null}
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {pack.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="trust-pill">
                {pack.courseCount}{" "}
                {pack.courseCount === 1
                  ? copy.courseSingular
                  : copy.coursePlural}
              </span>
              <span className="trust-pill">
                {getCoursePackLevelLabel(locale, pack.level)}
              </span>
            </div>
            <div className="mt-6 grid gap-3">
              <CourseCheckoutButton
                pack={pack}
                label={copy.buyNow}
                sourcePage="course_pack_hero"
              />
              {whatsappUrl ? (
                <CourseTrackedAnchor
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  eventName="whatsapp_course_inquiry"
                  eventParams={{
                    pack_id: pack.id,
                    pack_slug: pack.slug,
                    pack_title: pack.title,
                    source_page: "course_pack_hero",
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                >
                  <MessageCircle className="size-4 text-cyan-300" />
                  {copy.askWhatsapp}
                </CourseTrackedAnchor>
              ) : null}
              {supportEmail ? (
                <a
                  href={`mailto:${supportEmail}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                >
                  <Mail className="size-4 text-cyan-300" />
                  {copy.supportEmail}
                </a>
              ) : null}
            </div>
          </div>
        }
      />

      <section className="container py-4 sm:py-6">
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="gradient-border rounded-[1.85rem]">
            <div className="elevated-panel h-full p-6 sm:p-7">
              <p className="eyebrow">{copy.forTitle}</p>
              <div className="mt-5 grid gap-3">
                {pack.bestFor.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.2rem] border border-border bg-background/75 px-4 py-3 text-sm leading-7 text-primary"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="gradient-border rounded-[1.85rem]">
            <div className="elevated-panel h-full p-6 sm:p-7">
              <p className="eyebrow">{copy.learningTitle}</p>
              <div className="mt-5 grid gap-3">
                {pack.learningOutcomes.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.2rem] border border-cyan-500/18 bg-cyan-500/[0.08] px-4 py-3 text-sm leading-7 text-primary"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {pack.includedCourses?.length ? (
        <section className="container py-4 sm:py-6">
          <div className="gradient-border rounded-[1.95rem]">
            <div className="elevated-panel p-6 sm:p-7 md:p-8">
              <SectionHeading
                eyebrow={pack.category}
                title={copy.includedTitle}
                description={pack.tagline}
                align="left"
                className="mb-0"
              />

              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pack.includedCourses.map((course) => (
                  <article
                    key={course.title}
                    className="rounded-[1.45rem] border border-border bg-surface p-5"
                  >
                    <h3 className="text-lg font-semibold text-primary">
                      {course.title}
                    </h3>
                    {course.description ? (
                      <p className="mt-3 text-sm leading-7 text-muted">
                        {course.description}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="container py-4 sm:py-6">
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="gradient-border rounded-[1.85rem]">
            <div className="elevated-panel h-full p-6 sm:p-7">
              <p className="eyebrow">{copy.whyChooseTitle}</p>
              <div className="mt-5 grid gap-3">
                {pack.whyChoose.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.25rem] border border-border bg-background/75 px-4 py-3 text-sm leading-7 text-primary"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="gradient-border rounded-[1.85rem]">
            <div className="elevated-panel h-full p-6 sm:p-7">
              <p className="eyebrow">{copy.accessTitle}</p>
              <p className="mt-4 text-sm leading-8 text-muted">
                {copy.accessBody}
              </p>
              <div className="mt-5 grid gap-3">
                {steps.map((step, index) => (
                  <div
                    key={step}
                    className="rounded-[1.2rem] border border-cyan-500/18 bg-cyan-500/[0.08] px-4 py-3 text-sm leading-7 text-primary"
                  >
                    <span className="mr-2 text-cyan-500">
                      {locale === "fr" ? "Étape" : "Step"} {index + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <BuyerBonusSection
        locale={locale}
        title={copy.buyerBonusTitle}
        description={copy.buyerBonusDescription}
        sourcePage="course_pack_bonus_section"
        pack={pack}
        claimHref={bonusClaimDestination?.href}
        claimChannel={bonusClaimDestination?.channel ?? null}
        actions={
          pack.recommended ? (
            <>
              <CourseCheckoutButton
                pack={pack}
                label={copy.buyerBonusBuyFullPack}
                sourcePage="course_pack_bonus_section"
              />
              <BonusClaimButton
                href={bonusClaimDestination?.href}
                channel={bonusClaimDestination?.channel ?? null}
                label={copy.buyerBonusClaim}
                sourcePage="course_pack_bonus_section"
                packId={pack.id}
                packSlug={pack.slug}
                packTitle={pack.title}
                eligibility="full-pack"
                className="w-full sm:w-auto"
                variant="secondary"
              />
            </>
          ) : (
            <BonusClaimButton
              href={bonusClaimDestination?.href}
              channel={bonusClaimDestination?.channel ?? null}
              label={copy.buyerBonusClaim}
              sourcePage="course_pack_bonus_section"
              packId={pack.id}
              packSlug={pack.slug}
              packTitle={pack.title}
              eligibility="all-buyers"
              className="w-full sm:w-auto"
              variant="secondary"
            />
          )
        }
      />

      <section className="container py-4 sm:py-6">
        <div className="gradient-border rounded-[1.95rem]">
          <div className="elevated-panel p-6 sm:p-7 md:p-8">
            <SectionHeading
              eyebrow={copy.faqEyebrow}
              title={copy.faqTitle}
              description={pack.summary}
              align="left"
              className="mb-0"
            />
            <div className="mt-8">
              <CourseFaq
                items={faqs}
                sourcePage="course_pack_faq"
                pack={pack}
              />
            </div>
          </div>
        </div>
      </section>

      {!pack.recommended && fullPack ? (
        <FullPackBonusUpsell
          locale={locale}
          fullPack={fullPack}
          sourcePage="course_pack_detail"
        />
      ) : null}

      <RelatedCoursePacks locale={locale} packs={relatedPacks} />

      <section className="container pb-20">
        <div className="gradient-border rounded-[2rem]">
          <div className="elevated-panel px-6 py-8 sm:px-7 md:px-10 md:py-12">
            <p className="eyebrow">{copy.highlightsLabel}</p>
            <h2 className="mt-4 max-w-4xl text-4xl font-semibold text-primary md:text-5xl">
              {copy.finalTitle}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-muted">
              {copy.finalBody}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <CourseCheckoutButton
                pack={pack}
                label={copy.buyNow}
                sourcePage="course_pack_final_cta"
              />
              <CourseTrackedLink
                href={getLocalizedAppPath(locale, "/courses")}
                eventName="course_pack_click"
                eventParams={{
                  pack_id: pack.id,
                  pack_slug: pack.slug,
                  pack_title: pack.title,
                  source_page: "course_pack_final_cta",
                }}
                className="btn-secondary justify-center px-5 py-3"
              >
                {copy.backToCourses}
              </CourseTrackedLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
