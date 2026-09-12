"use client";

import { useRouter } from "next/navigation";
import { Globe2 } from "lucide-react";
import { useTransition } from "react";
import { getDictionary, type Locale, locales } from "@/content/site";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchLocale(nextLocale: Locale) {
    document.cookie = `techia-locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    window.localStorage.setItem("techia-locale", nextLocale);
    window.dispatchEvent(new CustomEvent("techia:analytics", { detail: { name: "language_selected", params: { locale: nextLocale } } }));
    // The URL stays stable; the proxy selects the locale from this cookie and
    // refreshes the current route with the newly chosen content.
    startTransition(() => router.refresh());
  }

  return (
    <label className="language-switcher" aria-label={dict.ui.languageSwitcher}>
      <Globe2 className="size-4" />
      <select
        value={locale}
        disabled={isPending}
        onChange={(event) => switchLocale(event.target.value as Locale)}
      >
        {locales.map((item) => (
          <option key={item} value={item}>{item.toUpperCase()}</option>
        ))}
      </select>
    </label>
  );
}
