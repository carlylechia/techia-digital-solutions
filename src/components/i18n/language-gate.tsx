"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type Locale } from "@/content/site";
import { persistLocalePreference } from "@/lib/locale-preference";

export function LanguageGate({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = window.localStorage.getItem("techia-locale") || document.cookie.match(/techia-locale=(en|fr)/)?.[1];
    if (!stored) queueMicrotask(() => setOpen(true));
  }, []);

  function choose(nextLocale: Locale) {
    persistLocalePreference(nextLocale, "gate");
    setOpen(false);
    if (nextLocale !== locale) router.push(`/${nextLocale}`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-xl" role="dialog" aria-modal="true" aria-labelledby="language-title">
      <div className="premium-card max-w-lg p-6 text-center shadow-2xl">
        <p className="eyebrow mx-auto mb-3 justify-center">Welcome / Bienvenue</p>
        <h2 id="language-title" className="text-2xl font-semibold text-primary">{locale === "fr" ? "Choisissez votre langue préférée" : "Choose your preferred language"}</h2>
        <p className="mt-3 text-sm leading-6 text-muted">{locale === "fr" ? "Sélectionnez l’anglais ou le français. Vous pourrez changer de langue à tout moment depuis la barre de navigation." : "Select English or French. You can change this anytime from the navigation bar."}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button className="btn-primary" type="button" onClick={() => choose("en")}>{locale === "fr" ? "Anglais" : "English"}</button>
          <button className="btn-secondary" type="button" onClick={() => choose("fr")}>Français</button>
        </div>
      </div>
    </div>
  );
}
