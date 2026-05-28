"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import type { DemoDefinition } from "@/content/demo-lab";
import { complexityColors, demoLabUi } from "@/content/demo-lab";
import { DemoRequestModal } from "./demo-request-modal";

type Locale = "en" | "fr";

const demoIcons: Record<string, string> = {
  "logistics-quote-generator": "🚚",
  "travel-consultancy-dashboard": "✈️",
  "business-management-dashboard": "📊",
  "booking-system": "📅",
  "ai-digital-advisor": "🤖"
};

interface DemoCardProps {
  demo: DemoDefinition;
  locale: Locale;
  priority?: boolean;
}

export function DemoCard({ demo, locale }: DemoCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const ui = demoLabUi[locale];

  function handleCardClick() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("techia:analytics", {
          detail: { name: "demo_card_click", params: { demo: demo.slug, locale } }
        })
      );
    }
  }

  function handleRequestOpen() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("techia:analytics", {
          detail: { name: "demo_request_opened", params: { demo: demo.slug, locale, source: "card" } }
        })
      );
    }
    setModalOpen(true);
  }

  return (
    <>
      <article className="premium-card group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:border-accent/40">
        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-2xl">
                {demoIcons[demo.slug] ?? "⚙️"}
              </div>
              <div className="min-w-0">
                <p className="eyebrow text-xs">{demo.eyebrow[locale]}</p>
                <h3 className="text-base font-bold text-primary leading-tight">{demo.title[locale]}</h3>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${complexityColors[demo.complexity]}`}
            >
              {ui.complexity}: {demo.complexity}
            </span>
          </div>

          {/* Problem */}
          <p className="text-sm leading-relaxed text-muted line-clamp-2">{demo.problem[locale]}</p>

          {/* Business types */}
          <div className="flex flex-wrap gap-1.5">
            {demo.businessTypes[locale].slice(0, 3).map((bt) => (
              <span key={bt} className="trust-pill text-xs">{bt}</span>
            ))}
            {demo.businessTypes[locale].length > 3 && (
              <span className="trust-pill text-xs">+{demo.businessTypes[locale].length - 3}</span>
            )}
          </div>

          {/* Modules preview */}
          <div className="rounded-lg bg-background/60 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted/70">
              {locale === "fr" ? "Fonctionnalités clés" : "Key features"}
            </p>
            <ul className="grid gap-1.5">
              {demo.modules[locale].slice(0, 4).map((mod) => (
                <li key={mod} className="flex items-start gap-2 text-xs text-muted">
                  <Zap className="mt-0.5 size-3 shrink-0 text-accent/70" />
                  {mod}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="flex flex-col gap-2 border-t border-border/50 p-4 sm:flex-row sm:items-center sm:gap-3">
          <Link
            href={`/${locale}/demo-lab/${demo.slug}`}
            onClick={handleCardClick}
            className="btn-primary flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
          >
            {ui.tryDemo}
            <ArrowRight className="size-4" />
          </Link>
          <button
            type="button"
            onClick={handleRequestOpen}
            className="btn-secondary flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
          >
            {ui.requestSystem}
          </button>
        </div>
      </article>

      <DemoRequestModal
        demo={demo}
        locale={locale}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
