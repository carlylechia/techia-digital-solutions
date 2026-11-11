import type { Metadata } from "next";
import { BookOpenText, Layers, Mail, MessageCircle, Route } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
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
  getPublishedCourse,
  getStorefrontPack,
  getStorefrontPacks,
} from "@/lib/courses/catalog-service";
import {
  getCourseAcademyFaqs,
  getCourseAcademySteps,
  getCoursePackLevelLabel,
} from "@/lib/courses/coursePacks";
import { formatMoney } from "@/lib/payments/money";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { getPublicAppPath } from "@/lib/site-routes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const pack = await getStorefrontPack(locale, slug);
  if (pack) {
    return createMetadata({
      locale,
      title: pack.seoTitle,
      description: pack.seoDescription,
      path: `/courses/${slug}`,
    });
  }
  const course = await getPublishedCourse(locale, slug);
  if (course) {
    return createMetadata({
      locale,
      title: course.seoTitle,
      description: course.seoDescription,
      path: `/courses/${slug}`,
    });
  }
  return createMetadata({
    locale,
    title: locale === "fr" ? "Cours introuvable" : "Course not found",
    description:
      locale === "fr"
        ? "Ce contenu teChia Digital Academy est introuvable."
        : "This teChia Digital Academy content could not be found.",
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

  const packs = await getStorefrontPacks(locale);
  const pack = packs.find((p) => p.id === slug) || null;
  const faqs = getCourseAcademyFaqs(locale);
  const steps = getCourseAcademySteps(locale);
  const supportEmail = getCoursesSupportEmail();
  const bonusClaimDestination = getCoursesBonusClaimDestination(locale);
  const fullPack = packs.find((p) => p.id === "complete-digital-skills-pack") || null;

  if (pack) {
    const whatsappUrl = getCoursesWhatsappUrl(
      locale === "fr"
        ? `Bonjour teChia, je veux des informations sur le pack ${pack.title}.`
        : `Hello teChia, I want more information about the ${pack.title} pack.`,
    );
    const relatedPacks = packs
      .filter((item) => item.id !== pack.id)
      .filter((item) => (pack.recommended ? true : !item.recommended))
      .slice(0, 3);

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
              "Le paiement sécurisé est vérifié côté serveur. Après confirmation, teChia vous guide pour les prochaines étapes d’accès. En cas de difficulté, contactez teChia avant de refaire plusieurs paiements.",
            faqEyebrow: "Questions fréquentes",
            faqTitle: "Réponses utiles avant votre achat.",
            finalTitle: "Prêt à choisir ce pack ?",
            finalBody:
              "Vous pouvez continuer avec ce pack précis ou revenir à la page principale pour comparer toutes les options disponibles.",
            backToCourses: "Retour aux cours",
            highlightsLabel: "Atouts du pack",
            courseSingular: "cours",
            coursePlural: "cours",
            packOverview: "Vue d’ensemble du pack",
            packLabel: "Pack teChia",
            buyerBonusTitle: pack.recommended
              ? "Bundle bonus exclusif du pack complet"
              : "Votre achat inclut le Official teChia Buyer Bonus",
            buyerBonusDescription: pack.recommended
              ? "Achetez le pack complet 16 cours via la page officielle teChia Digital Academy et débloquez le bundle bonus complet."
              : "Quand vous achetez ce pack via la page officielle teChia Digital Academy, vous pouvez réclamer les ressources bonus éligibles.",
            buyerBonusClaim: "Réclamer le bonus acheteur",
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
              "Secure payment is verified on the server. After confirmation, teChia guides you through the next access steps. If you run into difficulty, contact teChia before attempting multiple payments.",
            faqEyebrow: "FAQ",
            faqTitle: "Useful answers before you buy.",
            finalTitle: "Ready to choose this pack?",
            finalBody:
              "You can continue with this exact pack or return to the main courses page to compare the available options.",
            backToCourses: "Back to courses",
            highlightsLabel: "Why it stands out",
            courseSingular: "course",
            coursePlural: "courses",
            packOverview: "Pack overview",
            packLabel: "teChia Pack",
            buyerBonusTitle: pack.recommended
              ? "Full Pack Exclusive Bonus Bundle"
              : "Your purchase includes the Official teChia Buyer Bonus",
            buyerBonusDescription: pack.recommended
              ? "Buy the complete 16-course pack through the official teChia Digital Academy page and unlock the complete bonus bundle."
              : "When you buy this pack through the official teChia Digital Academy page, you can claim eligible bonus resources.",
            buyerBonusClaim: "Claim Buyer Bonus",
            buyerBonusBuyFullPack: "Buy Full Pack + Claim Bonus",
          };

    return (
      <main>
        <CoursePageAnalytics
          name="course_pack_view"
          params={{ pack_id: pack.id, pack_slug: pack.slug, pack_title: pack.title, source_page: "course_pack_detail" }}
        />
        <JsonLd
          data={breadcrumbJsonLd(locale, [
            { name: locale === "fr" ? "Accueil" : "Home", path: "" },
            { name: locale === "fr" ? "Cours" : "Courses", path: "/courses" },
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
            `${pack.courseCount} ${pack.courseCount === 1 ? copy.courseSingular : copy.coursePlural}`,
            getCoursePackLevelLabel(locale, pack.level),
          ]}
          actions={[{ href: "/courses", label: copy.viewAllPacks, variant: "secondary" }]}
          aside={
            <div className="rounded-[1.55rem] bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(251,113,133,0.14),transparent_28%)] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">{copy.packOverview}</p>
                {pack.badge ? <span className="trust-pill">{pack.badge}</span> : null}
              </div>
              <p className="mt-4 text-sm leading-7 text-muted dark:text-slate-300">{pack.summary}</p>
              {pack.priceMinor ? (
                <p className="mt-4 text-2xl font-semibold text-primary">{formatMoney(pack.priceMinor, pack.priceCurrency, locale)}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="trust-pill">{pack.courseCount} {pack.courseCount === 1 ? copy.courseSingular : copy.coursePlural}</span>
                <span className="trust-pill">{getCoursePackLevelLabel(locale, pack.level)}</span>
              </div>
              <div className="mt-6 grid gap-3">
                <CourseCheckoutButton pack={pack} label={copy.buyNow} sourcePage="course_pack_hero" />
                {whatsappUrl ? (
                  <CourseTrackedAnchor href={whatsappUrl} target="_blank" rel="noreferrer" eventName="whatsapp_course_inquiry" eventParams={{ pack_id: pack.id, pack_slug: pack.slug, pack_title: pack.title, source_page: "course_pack_hero" }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-5 py-3 text-sm font-medium text-primary transition hover:bg-background dark:border-white/12 dark:bg-white/[0.05] dark:text-white dark:hover:bg-white/[0.08]">
                    <MessageCircle className="size-4 text-cyan-600 dark:text-cyan-300" />{copy.askWhatsapp}
                  </CourseTrackedAnchor>
                ) : null}
                {supportEmail ? (
                  <a href={`mailto:${supportEmail}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-5 py-3 text-sm font-medium text-primary transition hover:bg-background dark:border-white/12 dark:bg-white/[0.05] dark:text-white dark:hover:bg-white/[0.08]">
                    <Mail className="size-4 text-cyan-600 dark:text-cyan-300" />{copy.supportEmail}
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
                    <div key={item} className="rounded-[1.2rem] border border-border bg-background/75 px-4 py-3 text-sm leading-7 text-primary">{item}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="gradient-border rounded-[1.85rem]">
              <div className="elevated-panel h-full p-6 sm:p-7">
                <p className="eyebrow">{copy.learningTitle}</p>
                <div className="mt-5 grid gap-3">
                  {pack.learningOutcomes.map((item) => (
                    <div key={item} className="rounded-[1.2rem] border border-cyan-500/18 bg-cyan-500/[0.08] px-4 py-3 text-sm leading-7 text-primary">{item}</div>
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
                <SectionHeading eyebrow={pack.category} title={copy.includedTitle} description={pack.tagline} align="left" className="mb-0" />
                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {pack.includedCourses.map((course) => (
                    <article key={course.slug || course.title} className="rounded-[1.45rem] border border-border bg-surface p-5">
                      <h3 className="text-lg font-semibold text-primary">
                        {course.slug ? (
                          <Link href={getPublicAppPath(`/courses/${course.slug}`)} className="hover:text-cyan-600 dark:hover:text-cyan-400">{course.title}</Link>
                        ) : course.title}
                      </h3>
                      {course.description ? <p className="mt-3 text-sm leading-7 text-muted">{course.description}</p> : null}
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
                    <div key={item} className="rounded-[1.25rem] border border-border bg-background/75 px-4 py-3 text-sm leading-7 text-primary">{item}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="gradient-border rounded-[1.85rem]">
              <div className="elevated-panel h-full p-6 sm:p-7">
                <p className="eyebrow">{copy.accessTitle}</p>
                <p className="mt-4 text-sm leading-8 text-muted">{copy.accessBody}</p>
                <div className="mt-5 grid gap-3">
                  {steps.map((step, index) => (
                    <div key={step} className="rounded-[1.2rem] border border-cyan-500/18 bg-cyan-500/[0.08] px-4 py-3 text-sm leading-7 text-primary">
                      <span className="mr-2 text-cyan-700 dark:text-cyan-500">{locale === "fr" ? "Étape" : "Step"} {index + 1}</span>
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
                <CourseCheckoutButton pack={pack} label={copy.buyerBonusBuyFullPack} sourcePage="course_pack_bonus_section" />
                <BonusClaimButton href={bonusClaimDestination?.href} channel={bonusClaimDestination?.channel ?? null} label={copy.buyerBonusClaim} sourcePage="course_pack_bonus_section" packId={pack.id} packSlug={pack.slug} packTitle={pack.title} eligibility="full-pack" className="w-full sm:w-auto" variant="secondary" />
              </>
            ) : (
              <BonusClaimButton href={bonusClaimDestination?.href} channel={bonusClaimDestination?.channel ?? null} label={copy.buyerBonusClaim} sourcePage="course_pack_bonus_section" packId={pack.id} packSlug={pack.slug} packTitle={pack.title} eligibility="all-buyers" className="w-full sm:w-auto" variant="secondary" />
            )
          }
        />

        <section className="container py-4 sm:py-6">
          <div className="gradient-border rounded-[1.95rem]">
            <div className="elevated-panel p-6 sm:p-7 md:p-8">
              <SectionHeading eyebrow={copy.faqEyebrow} title={copy.faqTitle} description={pack.summary} align="left" className="mb-0" />
              <div className="mt-8">
                <CourseFaq items={faqs} sourcePage="course_pack_faq" pack={pack} />
              </div>
            </div>
          </div>
        </section>

        {!pack.recommended && fullPack ? (
          <FullPackBonusUpsell locale={locale} fullPack={fullPack} sourcePage="course_pack_detail" />
        ) : null}

        <RelatedCoursePacks locale={locale} packs={relatedPacks} />

        <section className="container pb-20">
          <div className="gradient-border rounded-[2rem]">
            <div className="elevated-panel px-6 py-8 sm:px-7 md:px-10 md:py-12">
              <p className="eyebrow">{copy.highlightsLabel}</p>
              <h2 className="mt-4 max-w-4xl text-4xl font-semibold text-primary md:text-5xl">{copy.finalTitle}</h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-muted">{copy.finalBody}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <CourseCheckoutButton pack={pack} label={copy.buyNow} sourcePage="course_pack_final_cta" />
                <CourseTrackedLink href={getPublicAppPath("/courses")} eventName="course_pack_click" eventParams={{ pack_id: pack.id, pack_slug: pack.slug, pack_title: pack.title, source_page: "course_pack_final_cta" }} className="btn-secondary justify-center px-5 py-3">{copy.backToCourses}</CourseTrackedLink>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const course = await getPublishedCourse(locale, slug);
  if (!course) notFound();

  const containingPacks = packs.filter((p) =>
    p.includedCourses?.some((c) => c.slug === course.slug),
  );
  const whatsappUrl = getCoursesWhatsappUrl(
    locale === "fr"
      ? `Bonjour teChia, je veux des informations sur le cours ${course.title}.`
      : `Hello teChia, I want more information about the ${course.title} course.`,
  );
  const copy =
    locale === "fr"
      ? {
          viewAll: "Voir tous les cours",
          buy: "Acheter ce cours",
          askWhatsapp: "Contacter sur WhatsApp",
          supportEmail: "Contacter par email",
          overview: "Vue d’ensemble",
          skills: "Compétences développées",
          lessons: "Plan du cours",
          disclaimer: "Avertissement",
          inPacks: "Disponible dans ces packs",
          back: "Retour aux cours",
          priceSoon: "Prix et paiement bientôt disponibles",
          lesson: "Leçon",
          preview: "Aperçu",
        }
      : {
          viewAll: "View all courses",
          buy: "Buy this course",
          askWhatsapp: "Ask on WhatsApp",
          supportEmail: "Contact by email",
          overview: "Course overview",
          skills: "Skills you will build",
          lessons: "Course outline",
          disclaimer: "Disclaimer",
          inPacks: "Available in these packs",
          back: "Back to courses",
          priceSoon: "Price and checkout coming soon",
          lesson: "Lesson",
          preview: "Preview",
        };

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.shortDescription || course.description,
    url: `https://techiadigitalsolutions.com${course.path}`,
    provider: {
      "@type": "Organization",
      name: "teChia Digital Solutions",
      sameAs: "https://techiadigitalsolutions.com",
    },
    inLanguage: locale === "fr" ? "fr" : "en",
    ...(course.priceMinor
      ? {
          offers: {
            "@type": "Offer",
            price: String(course.priceMinor),
            priceCurrency: course.currency,
            availability: "https://schema.org/InStock",
            url: `https://techiadigitalsolutions.com${course.path}`,
          },
        }
      : {}),
  };

  // Structure chips only show values an administrator actually recorded in the
  // admin console — nothing is ever invented or defaulted here.
  const structureStats: { icon: typeof Layers; value: number; label: string }[] = [];
  if (course.moduleCount !== null) {
    structureStats.push({
      icon: Layers,
      value: course.moduleCount,
      label: course.moduleCount === 1 ? (locale === "fr" ? "module" : "module") : locale === "fr" ? "modules" : "modules",
    });
  }
  if (course.lessonCount !== null) {
    structureStats.push({
      icon: BookOpenText,
      value: course.lessonCount,
      label: course.lessonCount === 1 ? (locale === "fr" ? "leçon" : "lesson") : locale === "fr" ? "leçons" : "lessons",
    });
  }
  if (course.pathCount !== null) {
    structureStats.push({
      icon: Route,
      value: course.pathCount,
      label: course.pathCount === 1 ? (locale === "fr" ? "parcours" : "path") : locale === "fr" ? "parcours" : "paths",
    });
  }

  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: locale === "fr" ? "Accueil" : "Home", path: "" },
          { name: locale === "fr" ? "Cours" : "Courses", path: "/courses" },
          { name: course.title, path: `/courses/${slug}` },
        ])}
      />
      <JsonLd data={courseJsonLd} />

      <CourseHero
        locale={locale}
        eyebrow={course.category?.name || "teChia Digital Academy"}
        title={course.title}
        description={course.description}
        badges={[course.levelLabel, `${course.lessons.length} ${copy.lesson.toLowerCase()}s`]}
        actions={[{ href: "/courses", label: copy.viewAll, variant: "secondary" }]}
        aside={
          <div className="rounded-[1.55rem] bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(251,113,133,0.14),transparent_28%)] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">{copy.overview}</p>
            <p className="mt-4 text-sm leading-7 text-muted dark:text-slate-300">{course.shortDescription}</p>
            <div className="mt-4 text-2xl font-semibold text-primary">
              {course.priceMinor ? formatMoney(course.priceMinor, course.currency, locale) : <span className="text-sm font-medium text-muted">{copy.priceSoon}</span>}
            </div>
            <div className="mt-6 grid gap-3">
              <CourseCheckoutButton
                pack={{ id: course.id, slug: course.slug, title: course.title, checkoutUrl: null, priceMinor: course.priceMinor, priceCurrency: course.currency }}
                itemType="course"
                label={copy.buy}
                sourcePage="course_detail_hero"
              />
              {whatsappUrl ? (
                <CourseTrackedAnchor href={whatsappUrl} target="_blank" rel="noreferrer" eventName="whatsapp_course_inquiry" eventParams={{ pack_id: course.id, pack_slug: course.slug, pack_title: course.title, source_page: "course_detail_hero" }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-5 py-3 text-sm font-medium text-primary transition hover:bg-background dark:border-white/12 dark:bg-white/[0.05]">
                  <MessageCircle className="size-4 text-cyan-600 dark:text-cyan-300" />{copy.askWhatsapp}
                </CourseTrackedAnchor>
              ) : null}
              {supportEmail ? (
                <a href={`mailto:${supportEmail}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-5 py-3 text-sm font-medium text-primary transition hover:bg-background dark:border-white/12 dark:bg-white/[0.05]">
                  <Mail className="size-4 text-cyan-600 dark:text-cyan-300" />{copy.supportEmail}
                </a>
              ) : null}
            </div>
          </div>
        }
      />

      {course.financialDisclaimerRequired ? (
        <section className="container py-4">
          <div className="rounded-[1.5rem] border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-7 text-amber-900 dark:text-amber-100">
            <p className="font-semibold">{copy.disclaimer}</p>
            <p className="mt-2">
              {locale === "fr"
                ? "Ce cours est une ressource éducative. Il ne constitue pas un conseil financier, d’investissement ou de trading, et ne garantit aucun résultat."
                : "This course is an educational resource. It does not constitute financial, investment, or trading advice and does not guarantee results."}
            </p>
          </div>
        </section>
      ) : null}

      <section className="container py-4 sm:py-6">
        {structureStats.length ? (
          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            {structureStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <span
                  key={stat.label}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted"
                >
                  <Icon className="size-3.5 text-accent" />
                  <span className="text-primary">{stat.value}</span> {stat.label}
                </span>
              );
            })}
          </div>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="gradient-border rounded-[1.85rem]">
            <div className="elevated-panel h-full p-6 sm:p-7">
              <p className="eyebrow">{copy.skills}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {course.skills.map((skill) => (
                  <span key={skill} className="trust-pill">{skill}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="gradient-border rounded-[1.85rem]">
            <div className="elevated-panel h-full p-6 sm:p-7">
              <p className="eyebrow">{copy.lessons}</p>
              <div className="mt-5 grid gap-3">
                {course.lessons.map((lesson, index) => (
                  <div key={lesson.id} className="rounded-[1.2rem] border border-border bg-background/75 px-4 py-3">
                    <p className="text-sm font-medium text-primary">
                      {index + 1}. {lesson.title}
                      {lesson.isPreview ? <span className="ml-2 text-xs text-cyan-600 dark:text-cyan-400">({copy.preview})</span> : null}
                    </p>
                    {lesson.description ? <p className="mt-1 text-sm leading-7 text-muted">{lesson.description}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {containingPacks.length ? (
        <section className="container py-4 sm:py-6">
          <div className="gradient-border rounded-[1.95rem]">
            <div className="elevated-panel p-6 sm:p-7 md:p-8">
              <SectionHeading eyebrow={copy.inPacks} title={copy.inPacks} description={course.shortDescription} align="left" className="mb-0" />
              <div className="mt-8">
                <RelatedCoursePacks locale={locale} packs={containingPacks} />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="container pb-20">
        <div className="gradient-border rounded-[2rem]">
          <div className="elevated-panel px-6 py-8 sm:px-7 md:px-10 md:py-12">
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <CourseCheckoutButton
                pack={{ id: course.id, slug: course.slug, title: course.title, checkoutUrl: null, priceMinor: course.priceMinor, priceCurrency: course.currency }}
                itemType="course"
                label={copy.buy}
                sourcePage="course_detail_final_cta"
              />
              <CourseTrackedLink href={getPublicAppPath("/courses")} eventName="course_pack_click" eventParams={{ pack_id: course.id, pack_slug: course.slug, pack_title: course.title, source_page: "course_detail_final_cta" }} className="btn-secondary justify-center px-5 py-3">{copy.back}</CourseTrackedLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
