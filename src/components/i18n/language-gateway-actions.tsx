"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/site/button";
import type { Locale } from "@/content/site";
import { persistLocalePreference } from "@/lib/locale-preference";
import { cn } from "@/lib/utils";

const languageActions: Array<{
  href: "/";
  hrefLang: Locale;
  label: string;
  helper: string;
}> = [
  {
    href: "/",
    hrefLang: "en",
    label: "Continue in English",
    helper: "English homepage and navigation",
  },
  {
    href: "/",
    hrefLang: "fr",
    label: "Continuer en Français",
    helper: "Accueil et navigation en français",
  },
];

export function LanguageGatewayActions({
  source = "gateway",
  className,
}: {
  source?: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {languageActions.map((action) => (
        <Link
          key={action.hrefLang}
          href={action.href}
          hrefLang={action.hrefLang}
          onClick={(event) => {
            event.preventDefault();
            persistLocalePreference(action.hrefLang, source);
            router.refresh();
          }}
          className={cn(
            buttonVariants({
              variant: action.hrefLang === "en" ? "primary" : "secondary",
              size: "lg",
            }),
            "group min-h-[4.5rem] justify-between gap-4 px-5 text-left",
          )}
        >
          <span className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold sm:text-base">
              {action.label}
            </span>
            <span className="text-xs font-medium opacity-70">
              {action.helper}
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ))}
    </div>
  );
}
