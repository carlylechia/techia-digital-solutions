import type { Locale } from "@/content/site";

export function persistLocalePreference(locale: Locale, source: string) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  document.cookie = `techia-locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  window.localStorage.setItem("techia-locale", locale);
  window.dispatchEvent(
    new CustomEvent("techia:analytics", {
      detail: {
        name: "language_selected",
        params: { locale, source },
      },
    }),
  );
}
