import type { ReactNode } from "react";
import type { Locale } from "@/content/site";
import {
  getBuyerBonusItems,
  type BuyerBonusItem,
} from "@/lib/courses/bonusPacks";
import {
  getCoursesBonusClaimMessage,
  getCoursesBonusClaimUrl,
  getCoursesSupportEmail,
  getCoursesWhatsappUrl,
  publicBonusDownloadsEnabled,
} from "@/lib/courses/chariowLinks";
import {
  CoursePageAnalytics,
  CourseTrackedAnchor,
} from "@/components/courses/course-analytics";
import { SectionHeading } from "@/components/ui/section-heading";
import { BonusCard } from "./BonusCard";

function shouldRenderBonusCard(
  item: BuyerBonusItem,
  includeFutureUpdates: boolean,
) {
  if (includeFutureUpdates) return true;
  return item.id !== "future-resource-updates";
}

export function BuyerBonusSection({
  locale,
  title,
  description,
  sourcePage,
  pack,
  claimHref,
  claimChannel,
  includeFutureUpdates = false,
  actions,
}: {
  locale: Locale;
  title: string;
  description: string;
  sourcePage: string;
  pack?: {
    id?: string;
    slug?: string;
    title?: string;
    recommended?: boolean;
  };
  claimHref?: string;
  claimChannel: "form" | "whatsapp" | null;
  includeFutureUpdates?: boolean;
  actions?: ReactNode;
}) {
  const bonuses = getBuyerBonusItems(locale).filter((item) =>
    shouldRenderBonusCard(item, includeFutureUpdates),
  );
  const claimFormUrl = getCoursesBonusClaimUrl();
  const bonusWhatsappUrl = getCoursesWhatsappUrl(
    getCoursesBonusClaimMessage(locale),
  );
  const supportEmail = getCoursesSupportEmail();
  const downloadsEnabled = publicBonusDownloadsEnabled();

  const copy =
    locale === "fr"
      ? {
          eyebrow: "Official teChia Buyer Bonus",
          includedBadge: "Achat officiel requis",
          premiumBadge: "Le pack complet debloque le bundle complet",
          claimTitle: "Comment reclamer le bonus",
          claimBodyWithForm:
            "Apres votre achat, vous pouvez envoyer votre confirmation Chariow via le formulaire bonus ou via WhatsApp pour faire verifier votre achat.",
          claimBodyWithWhatsapp:
            "Apres votre achat, envoyez votre confirmation ou recu Chariow via WhatsApp pour reclamer votre bonus officiel.",
          claimBodyFallback:
            "Les instructions de reclamation du bonus seront fournies apres l'achat. Vous pouvez contacter le support teChia si besoin.",
          claimFormLink: "Ouvrir le formulaire bonus",
          claimWhatsappLink: "Envoyer sur WhatsApp",
          supportEmailLink: "Contacter le support",
          disclaimerTitle: "Important",
          disclaimer:
            "Bonus resources are provided as practical learning support materials. They do not guarantee income, employment, certification, or business results. Results depend on personal effort, practice, context, and application.",
        }
      : {
          eyebrow: "Official teChia Buyer Bonus",
          includedBadge: "Official purchase required",
          premiumBadge: "Full pack unlocks the complete bundle",
          claimTitle: "How to claim the bonus",
          claimBodyWithForm:
            "After your purchase, you can send your Chariow confirmation through the bonus claim form or through WhatsApp so your purchase can be verified.",
          claimBodyWithWhatsapp:
            "After your purchase, send your Chariow confirmation or receipt through WhatsApp to claim your official buyer bonus.",
          claimBodyFallback:
            "Bonus claim instructions will be provided after purchase. You may contact teChia support for help.",
          claimFormLink: "Open bonus claim form",
          claimWhatsappLink: "Send on WhatsApp",
          supportEmailLink: "Contact support",
          disclaimerTitle: "Important",
          disclaimer:
            "Bonus resources are provided as practical learning support materials. They do not guarantee income, employment, certification, or business results. Results depend on personal effort, practice, context, and application.",
        };

  return (
    <section className="container py-4 sm:py-6">
      <CoursePageAnalytics
        name="buyer_bonus_section_view"
        params={{
          source_page: sourcePage,
          pack_id: pack?.id,
          pack_slug: pack?.slug,
          pack_title: pack?.title,
          eligibility: pack?.recommended
            ? "full-pack"
            : pack?.slug
              ? "all-buyers"
              : "mixed",
        }}
      />
      <div className="gradient-border rounded-[1.95rem]">
        <div className="elevated-panel p-6 sm:p-7 md:p-8">
          <SectionHeading
            eyebrow={copy.eyebrow}
            title={title}
            description={description}
            align="left"
            className="mb-0"
          />

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="trust-pill">{copy.includedBadge}</span>
            <span className="trust-pill">{copy.premiumBadge}</span>
            <span className="trust-pill">
              {downloadsEnabled
                ? locale === "fr"
                  ? "Telechargements publics actives"
                  : "Public downloads enabled"
                : locale === "fr"
                  ? "Reclamation apres achat verifie"
                  : "Claim after verified purchase"}
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {bonuses.map((item) => (
              <BonusCard
                key={item.id}
                locale={locale}
                item={item}
                sourcePage={sourcePage}
                claimHref={claimHref}
                claimChannel={claimChannel}
                publicDownloadsEnabled={downloadsEnabled}
                packId={pack?.id}
                packSlug={pack?.slug}
                packTitle={pack?.title}
              />
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.55rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
              <p className="eyebrow">{copy.claimTitle}</p>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {claimFormUrl
                  ? copy.claimBodyWithForm
                  : bonusWhatsappUrl
                    ? copy.claimBodyWithWhatsapp
                    : copy.claimBodyFallback}
              </p>

              {claimFormUrl || bonusWhatsappUrl || supportEmail ? (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {claimFormUrl ? (
                    <a
                      href={claimFormUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.1]"
                    >
                      {copy.claimFormLink}
                    </a>
                  ) : null}
                  {bonusWhatsappUrl ? (
                    <CourseTrackedAnchor
                      href={bonusWhatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      eventName="whatsapp_bonus_claim_click"
                      eventParams={{
                        source_page: sourcePage,
                        pack_id: pack?.id,
                        pack_slug: pack?.slug,
                        pack_title: pack?.title,
                        eligibility: pack?.recommended
                          ? "full-pack"
                          : pack?.slug
                            ? "all-buyers"
                            : "mixed",
                      }}
                      className="inline-flex items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/[0.08] px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/[0.14]"
                    >
                      {copy.claimWhatsappLink}
                    </CourseTrackedAnchor>
                  ) : null}
                  {supportEmail ? (
                    <a
                      href={`mailto:${supportEmail}`}
                      className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.1]"
                    >
                      {copy.supportEmailLink}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="rounded-[1.55rem] border border-amber-400/18 bg-amber-400/[0.08] p-5 sm:p-6">
              <p className="eyebrow">{copy.disclaimerTitle}</p>
              <p className="mt-4 text-sm leading-7 text-slate-100">
                {copy.disclaimer}
              </p>
            </div>
          </div>

          {actions ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
