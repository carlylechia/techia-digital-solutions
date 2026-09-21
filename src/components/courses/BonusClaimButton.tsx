"use client";

import { Gift, MessageCircle } from "lucide-react";
import { trackCourseEvent } from "@/lib/analytics/courseEvents";
import { cn } from "@/lib/utils";

type ClaimChannel = "form" | "whatsapp" | null;

function isExternalHref(href: string) {
  return /^(https?:\/\/|mailto:|tel:)/.test(href);
}

export function BonusClaimButton({
  href,
  channel,
  label,
  sourcePage,
  packId,
  packSlug,
  packTitle,
  eligibility,
  className,
  variant = "primary",
}: {
  href?: string;
  channel: ClaimChannel;
  label: string;
  sourcePage: string;
  packId?: string;
  packSlug?: string;
  packTitle?: string;
  eligibility?: string;
  className?: string;
  variant?: "primary" | "secondary";
}) {
  const buttonClassName = cn(
    variant === "primary"
      ? "btn-primary justify-center px-5 py-3"
      : "btn-secondary justify-center px-5 py-3",
    className,
  );

  if (!href || !channel) {
    return (
      <span
        aria-disabled="true"
        className={cn(
          "inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-sm font-medium text-muted dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400",
          className,
        )}
      >
        <Gift className="size-4" />
        {label}
      </span>
    );
  }

  const payload = {
    source_page: sourcePage,
    pack_id: packId,
    pack_slug: packSlug,
    pack_title: packTitle,
    eligibility,
  };

  return (
    <a
      href={href}
      target={isExternalHref(href) ? "_blank" : undefined}
      rel={isExternalHref(href) ? "noreferrer" : undefined}
      onClick={() => {
        trackCourseEvent("buyer_bonus_claim_click", payload);
        if (channel === "whatsapp") {
          trackCourseEvent("whatsapp_bonus_claim_click", payload);
        }
      }}
      className={buttonClassName}
    >
      {channel === "whatsapp" ? (
        <MessageCircle className="size-4" />
      ) : (
        <Gift className="size-4" />
      )}
      {label}
    </a>
  );
}
