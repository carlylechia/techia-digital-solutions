"use client";

import Link from "next/link";
import { ArrowRight, MessageCircleMore } from "lucide-react";
import { buttonVariants } from "@/components/site/button";
import { getLocalizedHref, type Locale } from "@/content/site";
import { openAIChatWidget } from "@/lib/ai/open-chat";
import { cn } from "@/lib/utils";

type SecondaryAction = {
  href: string;
  label: string;
};

function resolveHref(locale: Locale, href: string) {
  if (!href.startsWith("/")) return href;
  if (href === `/${locale}` || href.startsWith(`/${locale}/`)) return href;
  return getLocalizedHref(locale, href);
}

export function AIConsultantActionGroup({
  locale,
  secondaryAction,
  stacked = false,
  centered = false,
  className,
}: {
  locale: Locale;
  secondaryAction?: SecondaryAction;
  stacked?: boolean;
  centered?: boolean;
  className?: string;
}) {
  const fallbackHref = getLocalizedHref(locale, "/ai-consultant");
  const secondaryHref = secondaryAction
    ? resolveHref(locale, secondaryAction.href)
    : null;

  return (
    <div
      className={cn(
        "flex gap-3",
        stacked ? "flex-col" : "flex-col sm:flex-row sm:flex-wrap",
        centered ? "justify-center" : "justify-start",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => openAIChatWidget(fallbackHref)}
        className={cn(
          buttonVariants({ variant: "primary", size: "lg" }),
          "justify-center",
          stacked ? "w-full" : "w-full sm:w-auto",
        )}
      >
        <MessageCircleMore className="size-4" />
        {locale === "fr" ? "Parler à l’agent IA" : "Talk to the AI consultant"}
        <ArrowRight className="size-4" />
      </button>

      {secondaryAction && secondaryHref ? (
        <Link
          href={secondaryHref}
          className={cn(
            buttonVariants({ variant: "secondary", size: "lg" }),
            "justify-center",
            stacked ? "w-full" : "w-full sm:w-auto",
          )}
        >
          {secondaryAction.label}
        </Link>
      ) : null}
    </div>
  );
}
