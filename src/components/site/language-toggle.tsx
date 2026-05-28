"use client";

import { Globe2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

type Locale = "en" | "fr";

export function LanguageToggle({
  className,
  tone = "default"
}: {
  className?: string;
  tone?: "default" | "inverted";
}) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    const stored = window.localStorage.getItem("techia-interface-locale");
    return stored === "fr" ? "fr" : "en";
  });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function handleChange(nextLocale: Locale) {
    startTransition(() => {
      setLocale(nextLocale);
      document.documentElement.lang = nextLocale;
      window.localStorage.setItem("techia-interface-locale", nextLocale);
      document.cookie = `techia-interface-locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    });
  }

  return (
    <div className={cn("language-switcher gap-2", className)} role="group" aria-label="Language selector">
      <Globe2 className="size-4" />
      <div className="flex items-center gap-1">
        {(["en", "fr"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]",
              locale === item
                ? tone === "inverted"
                  ? "bg-white/12 text-white"
                  : "bg-surface-strong text-foreground"
                : tone === "inverted"
                  ? "text-slate-300"
                  : "text-muted"
            )}
            aria-pressed={locale === item}
            aria-label={item === "en" ? "Switch interface language to English" : "Switch interface language to French"}
            disabled={isPending}
            onClick={() => handleChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
