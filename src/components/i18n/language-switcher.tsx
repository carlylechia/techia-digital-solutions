"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe2 } from "lucide-react";
import { getDictionary, type Locale, locales } from "@/content/site";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(nextLocale: Locale) {
    const segments = pathname.split("/");
    segments[1] = nextLocale;
    const nextPath = segments.join("/") || `/${nextLocale}`;
    document.cookie = `techia-locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    window.localStorage.setItem("techia-locale", nextLocale);
    window.dispatchEvent(new CustomEvent("techia:analytics", { detail: { name: "language_selected", params: { locale: nextLocale } } }));
    router.push(nextPath);
  }

  return (
    <label className="language-switcher" aria-label={dict.ui.languageSwitcher}>
      <Globe2 className="size-4" />
      <select value={locale} onChange={(event) => switchLocale(event.target.value as Locale)}>
        {locales.map((item) => (
          <option key={item} value={item}>{item.toUpperCase()}</option>
        ))}
      </select>
    </label>
  );
}
