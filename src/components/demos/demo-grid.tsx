"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Bot, BriefcaseBusiness, CalendarCheck, Gauge, Globe2, Sparkles, Truck, WandSparkles, Workflow } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { trackEvent } from "@/components/analytics/analytics";
import { complexityColors, demoLabUi, demosData, type DemoSlug } from "@/content/demo-lab";
import { getLocalizedHref, type Locale } from "@/content/site";

const demoIcons: Record<DemoSlug, LucideIcon> = {
  "logistics-quote-generator": Truck,
  "travel-consultancy-dashboard": Globe2,
  "business-management-dashboard": Gauge,
  "booking-system": CalendarCheck,
  "ai-digital-advisor": Bot
};

export function DemoGrid({ locale }: { locale: Locale }) {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const ui = demoLabUi[locale];
  const activeDemo = demosData[active];
  const ActiveIcon = demoIcons[activeDemo.slug] || Bot;
  const activeHref = getLocalizedHref(locale, `/demo-lab/${activeDemo.slug}`);
  const demoLabHref = getLocalizedHref(locale, "/demo-lab");
  const copy =
    locale === "fr"
      ? {
          previewLabel: "Extrait de démo",
          previewTitle: "Un aperçu guidé avant l'exploration complète.",
          previewDescription:
            "Choisissez une démo pour voir un extrait réel du type de système, de logique et de valeur que teChia peut construire, puis ouvrez la page complète pour l'essayer.",
          businessFit: "Pour qui",
          moduleCount: "Modules clés",
          valueCount: "Gains métier",
          buildType: "Type de build",
          systemFlow: "Extrait du parcours",
          valueHeadline: "Ce que ce système peut apporter",
          openDemo: "Ouvrir cette démo",
          exploreLab: "Explorer tout l'espace démo",
          moreDemos: "Plus de démos, de variantes et d'interactions sont disponibles dans l'espace complet."
        }
      : {
          previewLabel: "Demo snippet",
          previewTitle: "A guided preview before the full exploration.",
          previewDescription:
            "Choose a demo to preview the kind of system, logic, and business value teChia can build, then open the full page to try the interactive version.",
          businessFit: "Best fit",
          moduleCount: "Core modules",
          valueCount: "Business gains",
          buildType: "Build type",
          systemFlow: "Workflow snippet",
          valueHeadline: "What this can unlock",
          openDemo: "Open this demo",
          exploreLab: "Explore the full Demo Lab",
          moreDemos: "More demos, variants, and interactions are available inside the full lab."
        };

  function handleSelect(demoSlug: DemoSlug) {
    trackEvent("homepage_demo_preview_select", { demo: demoSlug, locale });
  }

  function handleOpen(target: "demo" | "lab") {
    trackEvent("homepage_demo_preview_open", {
      locale,
      demo: activeDemo.slug,
      target
    });
  }

  useEffect(() => {
    if (reduceMotion || isPaused || demosData.length < 2) return;

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % demosData.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [isPaused, reduceMotion]);

  return (
    <div
      className="grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]"
      onPointerEnter={() => setIsPaused(true)}
      onPointerLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;
        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          setIsPaused(false);
        }
      }}
    >
      <div className="grid gap-3">
        {demosData.map((demo, index) => {
          const Icon = demoIcons[demo.slug] || Bot;
          const isActive = active === index;

          return (
            <button
              key={demo.slug}
              type="button"
              onClick={() => {
                setActive(index);
                handleSelect(demo.slug);
              }}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              aria-pressed={isActive}
              className={`premium-card min-w-0 cursor-pointer flex items-start gap-3 p-4 text-left transition ${
                isActive ? "border-accent/60 bg-accent/10 shadow-[0_18px_40px_rgba(8,20,36,0.12)]" : "hover:border-accent/30"
              }`}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block break-words text-sm text-muted">{demo.eyebrow[locale]}</span>
                <span className="mt-1 block break-words font-semibold text-primary">{demo.shortTitle[locale]}</span>
                <span className="mt-1 block break-words text-sm leading-6 text-muted">{demo.category[locale]}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="premium-card min-w-0 overflow-hidden p-0">
        <div className="border-b border-border bg-surface px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <span className="min-w-0 flex-1 break-all text-xs text-muted">techia.digital{activeHref}</span>
            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${complexityColors[activeDemo.complexity]}`}>
              {ui.complexity}: {activeDemo.complexity}
            </span>
          </div>
        </div>

        <div className="grid gap-6 p-5 md:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="min-w-0 rounded-[1.75rem] border border-border bg-background p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
                  <ActiveIcon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="eyebrow">{copy.previewLabel}</p>
                  <h3 className="mt-2 break-words text-2xl font-semibold text-primary md:text-3xl">{activeDemo.title[locale]}</h3>
                </div>
              </div>

              <p className="mt-4 break-words text-sm leading-7 text-muted">{copy.previewDescription}</p>
              <p className="mt-4 break-words text-lg font-medium text-primary">{copy.previewTitle}</p>
              <p className="mt-4 break-words text-base leading-7 text-primary">{activeDemo.description[locale]}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-2xl border border-border bg-surface p-4">
                  <p className="break-words text-xs uppercase tracking-[0.12em] text-muted">{copy.buildType}</p>
                  <p className="mt-2 break-words text-sm leading-6 text-primary">{activeDemo.estimatedBuildType[locale]}</p>
                </div>
                <div className="min-w-0 rounded-2xl border border-border bg-surface p-4">
                  <p className="break-words text-xs uppercase tracking-[0.12em] text-muted">{ui.packageSection}</p>
                  <p className="mt-2 break-words text-sm leading-6 text-primary">{activeDemo.recommendedPackage[locale]}</p>
                </div>
              </div>
            </div>

            <div className="grid min-w-0 gap-3">
              <div className="min-w-0 rounded-[1.5rem] border border-border bg-background p-4">
                <p className="break-words text-xs uppercase tracking-[0.12em] text-muted">{copy.businessFit}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeDemo.businessTypes[locale].slice(0, 4).map((item) => (
                    <span key={item} className="trust-pill max-w-full whitespace-normal break-words text-left text-xs">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="min-w-0 overflow-hidden rounded-[1.5rem] border border-border bg-background p-4">
                  <div className="flex min-w-0 items-start gap-2 text-xs uppercase tracking-[0.12em] text-muted">
                    <Workflow className="size-3.5" />
                    <span className="min-w-0 break-words leading-4">{copy.moduleCount}</span>
                  </div>
                  <p className="mt-3 break-words text-2xl font-semibold text-primary sm:text-3xl">{activeDemo.modules[locale].length}</p>
                </div>
                <div className="min-w-0 overflow-hidden rounded-[1.5rem] border border-border bg-background p-4">
                  <div className="flex min-w-0 items-start gap-2 text-xs uppercase tracking-[0.12em] text-muted">
                    <Sparkles className="size-3.5" />
                    <span className="min-w-0 break-words leading-4">{copy.valueCount}</span>
                  </div>
                  <p className="mt-3 break-words text-2xl font-semibold text-primary sm:text-3xl">{activeDemo.businessValue[locale].length}</p>
                </div>
                <div className="min-w-0 overflow-hidden rounded-[1.5rem] border border-border bg-background p-4">
                  <div className="flex min-w-0 items-start gap-2 text-xs uppercase tracking-[0.12em] text-muted">
                    <BriefcaseBusiness className="size-3.5" />
                    <span className="min-w-0 break-words leading-4">{ui.businessTypes}</span>
                  </div>
                  <p className="mt-3 break-words text-2xl font-semibold text-primary sm:text-3xl">{activeDemo.businessTypes[locale].length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-w-0 rounded-[1.6rem] border border-border bg-background p-5">
              <p className="eyebrow">{copy.systemFlow}</p>
              <div className="mt-4 grid gap-3">
                {activeDemo.modules[locale].slice(0, 4).map((item, index) => (
                  <div key={item} className="flex min-w-0 items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-3">
                    <span className="min-w-0 flex-1 break-words text-sm text-primary">{item}</span>
                    <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
                      {locale === "fr" ? `Étape ${index + 1}` : `Step ${index + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0 rounded-[1.6rem] border border-border bg-background p-5">
              <p className="eyebrow">{copy.valueHeadline}</p>
              <p className="mt-4 break-words text-sm leading-7 text-muted">{activeDemo.solution[locale]}</p>
              <div className="mt-4 grid gap-2">
                {activeDemo.businessValue[locale].slice(0, 3).map((item) => (
                  <div key={item} className="flex min-w-0 items-start gap-2 rounded-2xl border border-border bg-surface p-3 text-sm text-primary">
                    <WandSparkles className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span className="min-w-0 break-words">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 break-words text-sm leading-6 text-muted">{copy.moreDemos}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              <Link
                href={activeHref}
                onClick={() => handleOpen("demo")}
                className="btn-primary flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-center text-sm font-semibold whitespace-normal"
              >
                {copy.openDemo}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href={demoLabHref}
                onClick={() => handleOpen("lab")}
                className="btn-secondary flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-center text-sm font-semibold whitespace-normal"
              >
                {copy.exploreLab}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
