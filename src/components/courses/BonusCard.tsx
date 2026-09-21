"use client";

import type { ComponentType, SVGProps } from "react";
import {
  BellRing,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Compass,
  FileText,
  LifeBuoy,
} from "lucide-react";
import type { Locale } from "@/content/site";
import type { BuyerBonusItem } from "@/lib/courses/bonusPacks";
import { trackCourseEvent } from "@/lib/analytics/courseEvents";
import { cn } from "@/lib/utils";
import { BonusEligibilityBadge } from "./BonusEligibilityBadge";

type ClaimChannel = "form" | "whatsapp" | null;
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const iconMap: Record<BuyerBonusItem["iconKey"], IconComponent> = {
  roadmap: Compass,
  monetization: Briefcase,
  tracker: ClipboardList,
  checkup: FileText,
  "action-plan": CalendarDays,
  support: LifeBuoy,
  updates: BellRing,
};

function isExternalHref(href: string) {
  return /^(https?:\/\/|mailto:|tel:)/.test(href);
}

function getTypeLabel(locale: Locale, type: BuyerBonusItem["type"]) {
  if (locale === "fr") {
    if (type === "template") return "Modele";
    if (type === "support") return "Support";
    if (type === "update") return "Mise a jour";
    return "Guide";
  }

  if (type === "template") return "Template";
  if (type === "support") return "Support";
  if (type === "update") return "Update";
  return "Guide";
}

function getActionLabel({
  locale,
  item,
  publicDownloadsEnabled,
  hasClaimTarget,
}: {
  locale: Locale;
  item: BuyerBonusItem;
  publicDownloadsEnabled: boolean;
  hasClaimTarget: boolean;
}) {
  if (publicDownloadsEnabled && item.downloadPath) {
    if (locale === "fr") {
      return item.type === "template"
        ? "Telecharger le modele"
        : "Telecharger le guide";
    }

    return item.type === "template" ? "Download template" : "Download guide";
  }

  if (hasClaimTarget) {
    return locale === "fr" ? "Reclamer apres achat" : "Claim after purchase";
  }

  return locale === "fr"
    ? "Disponible apres verification"
    : "Available after verification";
}

export function BonusCard({
  locale,
  item,
  sourcePage,
  claimHref,
  claimChannel,
  publicDownloadsEnabled,
  packId,
  packSlug,
  packTitle,
}: {
  locale: Locale;
  item: BuyerBonusItem;
  sourcePage: string;
  claimHref?: string;
  claimChannel: ClaimChannel;
  publicDownloadsEnabled: boolean;
  packId?: string;
  packSlug?: string;
  packTitle?: string;
}) {
  const Icon = iconMap[item.iconKey];
  const isDownloadable = Boolean(publicDownloadsEnabled && item.downloadPath);
  const href = isDownloadable ? item.downloadPath : claimHref;
  const actionLabel = getActionLabel({
    locale,
    item,
    publicDownloadsEnabled,
    hasClaimTarget: Boolean(claimHref && claimChannel),
  });
  const payload = {
    source_page: sourcePage,
    pack_id: packId,
    pack_slug: packSlug,
    pack_title: packTitle,
    bonus_id: item.id,
    eligibility: item.eligibility,
  };

  return (
    <article
      className={cn(
        "rounded-[1.55rem] border p-5 sm:p-6",
        item.eligibility === "full-pack"
          ? "border-amber-400/40 bg-surface [background-image:radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_45%)] dark:border-amber-400/20 dark:bg-[rgba(15,23,42,0.9)] dark:[background-image:radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_40%)]"
          : "border-cyan-500/30 bg-surface [background-image:radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_40%)] dark:border-cyan-500/16 dark:bg-[rgba(15,23,42,0.9)] dark:[background-image:radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_36%)]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="icon-chip inline-flex size-12 items-center justify-center rounded-2xl">
          <Icon className="size-5" />
        </div>
        <BonusEligibilityBadge locale={locale} eligibility={item.eligibility} />
      </div>

      <div className="mt-5 flex items-center gap-2">
        <span className="trust-pill">{getTypeLabel(locale, item.type)}</span>
      </div>

      <h3 className="mt-4 text-xl font-semibold text-primary dark:text-white">
        {item.title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-muted dark:text-slate-300">
        {item.summary}
      </p>

      <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-muted dark:text-slate-400">
        {item.eligibility === "full-pack"
          ? locale === "fr"
            ? "Debloque avec le pack complet 16 cours"
            : "Unlocked with the full 16-course pack"
          : locale === "fr"
            ? "Inclus avec tout achat officiel de pack"
            : "Included with any official pack purchase"}
      </p>

      <div className="mt-6">
        {href ? (
          <a
            href={href}
            target={isExternalHref(href) ? "_blank" : undefined}
            rel={isExternalHref(href) ? "noreferrer" : undefined}
            onClick={() => {
              trackCourseEvent("bonus_card_click", payload);
              if (isDownloadable) {
                trackCourseEvent("bonus_download_click", payload);
                return;
              }

              trackCourseEvent("buyer_bonus_claim_click", payload);
              if (claimChannel === "whatsapp") {
                trackCourseEvent("whatsapp_bonus_claim_click", payload);
              }
            }}
            className={cn(
              "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition",
              item.eligibility === "full-pack"
                ? "bg-amber-300 text-slate-950 hover:bg-amber-200"
                : "border border-border bg-background/70 text-primary hover:bg-background dark:border-white/12 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]",
            )}
          >
            {actionLabel}
          </a>
        ) : (
          <span className="inline-flex rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-muted dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
            {actionLabel}
          </span>
        )}
      </div>
    </article>
  );
}
