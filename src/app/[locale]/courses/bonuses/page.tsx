import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { BonusClaimButton } from "@/components/courses/BonusClaimButton";
import { BuyerBonusSection } from "@/components/courses/BuyerBonusSection";
import { CourseCheckoutButton } from "@/components/courses/CourseCheckoutButton";
import { CourseHero } from "@/components/courses/CourseHero";
import {
  CoursePageAnalytics,
  CourseTrackedLink,
} from "@/components/courses/course-analytics";
import { JsonLd } from "@/components/ui/json-ld";
import { isLocale, type Locale } from "@/content/site";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";
import {
  getCoursesBonusClaimDestination,
  getCoursesSupportEmail,
  getCoursesWhatsappUrl,
} from "@/lib/courses/chariowLinks";
import { getFullCoursePack } from "@/lib/courses/coursePacks";
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
    title: "Official teChia Buyer Bonus | teChia Digital Academy",
    description:
      "Buy through the official teChia Digital Academy page and claim practical bonus resources, including learning roadmaps, skill monetization guides, trackers, and digital growth templates.",
    path: "/courses/bonuses",
  });
}

export default async function CourseBonusesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;

  const fullPack = getFullCoursePack(locale);
  if (!fullPack) notFound();

  const bonusClaimDestination = getCoursesBonusClaimDestination(locale);
  const supportEmail = getCoursesSupportEmail();
  const whatsappUrl = getCoursesWhatsappUrl(
    locale === "fr"
      ? "Bonjour teChia, j'ai achete un pack de cours via la page officielle teChia Digital Academy et je veux reclamer mon Official Buyer Bonus. Voici ma confirmation de paiement Chariow."
      : "Hello teChia, I bought a course pack through the official teChia Digital Academy page and I want to claim my Official Buyer Bonus. Here is my Chariow payment confirmation.",
  );

  const copy =
    locale === "fr"
      ? {
          heroTitle: "Official teChia Buyer Bonus",
          heroDescription:
            "Achetez via la page officielle teChia Digital Academy et debloquez des ressources bonus premium concues pour vous aider a apprendre avec plus de direction, appliquer vos competences et passer a l'action.",
          heroEyebrow: "teChia Digital Academy",
          heroBadges: [
            "Achat officiel requis",
            "Verification via Chariow",
            "Le pack complet debloque plus",
          ],
          heroPrimary: "Obtenir le pack complet + bonus",
          heroSecondary: "Voir tous les packs",
          asideEyebrow: "Meilleure valeur",
          asideBody:
            "Le pack complet reste l'offre la plus forte: 16 cours, le bundle bonus complet, et un meilleur accompagnement pour les questions d'acces et de reclamation.",
          claimBonus: "Reclamer le bonus acheteur",
          supportWhatsapp: "Envoyer sur WhatsApp",
          supportEmail: "Contacter le support",
          sectionTitle: "Official teChia Buyer Bonus",
          sectionDescription:
            "Le bonus acheteur officiel recompense les achats verifies effectues via les pages officielles teChia Digital Academy, sans reduire la valeur percue avec des remises.",
          termsEyebrow: "Conditions et limites",
          termsTitle: "Un bonus premium, pas une promesse irreelle.",
          termsBody:
            "Ces ressources sont concues comme un appui pratique a l'apprentissage et a l'application. Elles n'incluent pas de coaching prive, de garantie de revenu, de certification, d'emploi ou de succes business.",
          verifiedTitle: "Qui peut reclamer",
          verifiedBody:
            "Le bonus est reserve aux achats verifies effectues via les pages officielles de packs teChia Digital Academy et completes sur Chariow.",
        }
      : {
          heroTitle: "Official teChia Buyer Bonus",
          heroDescription:
            "Buy through the official teChia Digital Academy page and unlock premium bonus resources designed to help you learn with direction, apply your skills, and move knowledge into practical action.",
          heroEyebrow: "teChia Digital Academy",
          heroBadges: [
            "Official purchase required",
            "Verified through Chariow",
            "Full pack unlocks more",
          ],
          heroPrimary: "Get the Full Pack + Bonus",
          heroSecondary: "View All Course Packs",
          asideEyebrow: "Best value",
          asideBody:
            "The full pack remains the strongest offer: 16 courses, the complete bonus bundle, and better support for access and claim-related issues.",
          claimBonus: "Claim Buyer Bonus",
          supportWhatsapp: "Send on WhatsApp",
          supportEmail: "Contact support",
          sectionTitle: "Official teChia Buyer Bonus",
          sectionDescription:
            "The official buyer bonus rewards verified purchases made through the official teChia Digital Academy pages without weakening the premium offer with discount messaging.",
          termsEyebrow: "Terms and limitations",
          termsTitle: "A premium bonus, not an unrealistic promise.",
          termsBody:
            "These resources are designed as practical learning support materials. They do not include private coaching, income guarantees, certification, job placement, or business success guarantees.",
          verifiedTitle: "Who can claim",
          verifiedBody:
            "The bonus is reserved for verified course-pack purchases made through the official teChia Digital Academy pages and completed through Chariow.",
        };

  return (
    <main>
      <CoursePageAnalytics
        name="buyer_bonus_page_view"
        params={{
          source_page: "buyer_bonus_page",
          pack_id: fullPack.id,
          pack_slug: fullPack.slug,
          pack_title: fullPack.title,
          eligibility: "mixed",
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: locale === "fr" ? "Accueil" : "Home", path: "" },
          {
            name: locale === "fr" ? "Cours" : "Courses",
            path: "/courses",
          },
          {
            name:
              locale === "fr"
                ? "Official teChia Buyer Bonus"
                : "Official teChia Buyer Bonus",
            path: "/courses/bonuses",
          },
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
          {
            href: getPublicAppPath("/courses"),
            label: copy.heroSecondary,
            variant: "secondary",
          },
        ]}
        aside={
          <div className="rounded-[1.55rem] bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.16),transparent_28%)] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                {copy.asideEyebrow}
              </p>
              <span className="trust-pill">{fullPack.badge || "Best Value"}</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {copy.asideBody}
            </p>
            <div className="mt-6 grid gap-3">
              <CourseCheckoutButton
                pack={fullPack}
                label={copy.heroPrimary}
                sourcePage="buyer_bonus_page_hero"
              />
              <BonusClaimButton
                href={bonusClaimDestination?.href}
                channel={bonusClaimDestination?.channel ?? null}
                label={copy.claimBonus}
                sourcePage="buyer_bonus_page_hero"
                packId={fullPack.id}
                packSlug={fullPack.slug}
                packTitle={fullPack.title}
                eligibility="all-buyers"
                variant="secondary"
              />
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                >
                  <MessageCircle className="size-4 text-cyan-300" />
                  {copy.supportWhatsapp}
                </a>
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

      <BuyerBonusSection
        locale={locale}
        title={copy.sectionTitle}
        description={copy.sectionDescription}
        sourcePage="buyer_bonus_page"
        pack={fullPack}
        claimHref={bonusClaimDestination?.href}
        claimChannel={bonusClaimDestination?.channel ?? null}
        includeFutureUpdates
        actions={
          <>
            <CourseCheckoutButton
              pack={fullPack}
              label={copy.heroPrimary}
              sourcePage="buyer_bonus_page"
            />
            <BonusClaimButton
              href={bonusClaimDestination?.href}
              channel={bonusClaimDestination?.channel ?? null}
              label={copy.claimBonus}
              sourcePage="buyer_bonus_page"
              packId={fullPack.id}
              packSlug={fullPack.slug}
              packTitle={fullPack.title}
              eligibility="all-buyers"
              className="w-full sm:w-auto"
              variant="secondary"
            />
            <CourseTrackedLink
              href={getPublicAppPath("/courses")}
              eventName="course_pack_click"
              eventParams={{
                source_page: "buyer_bonus_page",
                pack_id: fullPack.id,
                pack_slug: fullPack.slug,
                pack_title: fullPack.title,
              }}
              className="btn-secondary justify-center px-5 py-3"
            >
              {copy.heroSecondary}
            </CourseTrackedLink>
          </>
        }
      />

      <section className="container pb-20">
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="gradient-border rounded-[1.85rem]">
            <div className="elevated-panel h-full p-6 sm:p-7">
              <p className="eyebrow">{copy.verifiedTitle}</p>
              <p className="mt-4 text-base leading-8 text-muted">
                {copy.verifiedBody}
              </p>
            </div>
          </div>

          <div className="gradient-border rounded-[1.85rem]">
            <div className="elevated-panel h-full p-6 sm:p-7">
              <p className="eyebrow">{copy.termsEyebrow}</p>
              <h2 className="mt-4 text-3xl font-semibold text-primary">
                {copy.termsTitle}
              </h2>
              <p className="mt-4 text-base leading-8 text-muted">
                {copy.termsBody}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
