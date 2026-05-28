"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bot, BriefcaseBusiness, LayoutDashboard, Sparkles, WandSparkles, Workflow } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import type { Locale } from "@/content/site";

const systemCards = [
  { key: "websites", label: { en: "Websites", fr: "Sites web" }, icon: BriefcaseBusiness, className: "left-3 top-20 sm:left-6 sm:top-24" },
  { key: "dashboards", label: { en: "Dashboards", fr: "Tableaux de bord" }, icon: LayoutDashboard, className: "right-3 top-14 sm:right-7 sm:top-20" },
  { key: "automation", label: { en: "Automation", fr: "Automatisation" }, icon: Workflow, className: "left-5 bottom-24 sm:left-10 sm:bottom-24" },
  { key: "ai", label: { en: "AI Tools", fr: "Outils IA" }, icon: Bot, className: "right-4 bottom-[4.5rem] sm:right-8 sm:bottom-[5.5rem]" },
  { key: "business-os", label: { en: "Business OS", fr: "Business OS" }, icon: WandSparkles, className: "left-1/2 top-4 -translate-x-1/2" }
] as const;

const codeLines = {
  en: [
    "const system = build({",
    "  trust: 'premium-web-presence',",
    "  ops: ['dashboard', 'portal', 'quotes'],",
    "  automation: 'repeatable-workflows',",
    "  intelligence: 'practical-ai-assist',",
    "});"
  ],
  fr: [
    "const systeme = concevoir({",
    "  confiance: 'presence-web-premium',",
    "  operations: ['dashboard', 'portail', 'devis'],",
    "  automatisation: 'workflows-repetables',",
    "  intelligence: 'assistance-ia-pratique',",
    "});"
  ]
} as const;

export function FounderHeroVisual({ locale }: { locale: Locale }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={reducedMotion ? undefined : { y: -8, scale: 1.01 }}
      transition={reducedMotion ? undefined : { type: "spring", stiffness: 170, damping: 18, mass: 0.9 }}
      className="gradient-border mx-auto w-full max-w-[640px] rounded-[2rem]"
    >
      <div
        className="relative aspect-[0.98] overflow-hidden rounded-[2rem] border border-border bg-[radial-gradient(circle_at_top,rgba(34,211,238,.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,.18),transparent_28%),linear-gradient(145deg,color-mix(in_srgb,var(--surface-elevated)_92%,transparent),color-mix(in_srgb,var(--surface)_88%,transparent))] p-4 shadow-[var(--shadow-strong)] sm:p-6"
        role="img"
        aria-label={locale === "fr" ? "Visual fondateur illustrant sites web, dashboards, automatisation, IA et systèmes métier." : "Founder visual illustrating websites, dashboards, automation, AI, and business systems."}
      >
        <div
          className="absolute inset-0 opacity-60"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)",
            backgroundSize: "44px 44px"
          }}
        />
        <div className="absolute inset-5 rounded-[1.75rem] border border-white/10" aria-hidden="true" />
        <div className="absolute inset-x-10 top-10 h-24 rounded-full bg-cyan-300/10 blur-3xl" aria-hidden="true" />

        <svg className="absolute inset-0 h-full w-full opacity-45" aria-hidden="true">
          <defs>
            <linearGradient id="founder-grid-line" x1="0" x2="1">
              <stop stopColor="#22d3ee" />
              <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <line x1="50%" y1="20%" x2="15%" y2="30%" stroke="url(#founder-grid-line)" strokeWidth="1" strokeDasharray="6 8" />
          <line x1="50%" y1="20%" x2="85%" y2="24%" stroke="url(#founder-grid-line)" strokeWidth="1" strokeDasharray="6 8" />
          <line x1="50%" y1="20%" x2="24%" y2="76%" stroke="url(#founder-grid-line)" strokeWidth="1" strokeDasharray="6 8" />
          <line x1="50%" y1="20%" x2="82%" y2="72%" stroke="url(#founder-grid-line)" strokeWidth="1" strokeDasharray="6 8" />
          <line x1="50%" y1="20%" x2="50%" y2="7%" stroke="url(#founder-grid-line)" strokeWidth="1" strokeDasharray="6 8" />
        </svg>

        <motion.div
          initial={false}
          animate={reducedMotion ? undefined : { rotate: 360 }}
          transition={reducedMotion ? undefined : { duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-[44%] flex size-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[2rem] border border-cyan-300/30 bg-background/70 shadow-[var(--shadow-glow)] backdrop-blur-xl sm:size-32"
        >
          <div className="flex size-20 items-center justify-center rounded-[1.5rem] bg-cyan-300/10 text-cyan-300 sm:size-24">
            <Sparkles className="size-9 sm:size-10" />
          </div>
        </motion.div>

        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="status-pill inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              <span className="inline-flex size-2 rounded-full bg-cyan-300" />
              {locale === "fr" ? "Espace fondateur" : "Founder workspace"}
            </div>
            <div className="subtle-tile inline-flex items-center rounded-full px-3 py-2">
              <Logo variant="horizontal" size="sm" theme="auto" href={null} />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[28rem] rounded-[1.75rem] border border-white/10 bg-[#03111f]/90 p-4 shadow-2xl sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-cyan-300/80">
              <span className="inline-flex size-2 rounded-full bg-cyan-300" />
              {locale === "fr" ? "Système en cours de construction" : "System in build"}
            </div>
            <pre className="overflow-x-auto font-mono text-[11px] leading-6 text-slate-200 sm:text-xs">
              {codeLines[locale].map((line) => (
                <div key={line} className="whitespace-pre">
                  {line}
                </div>
              ))}
            </pre>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {[locale === "fr" ? "Crédibilité" : "Credibility", locale === "fr" ? "Opérations" : "Operations", locale === "fr" ? "Croissance" : "Growth"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[locale === "fr" ? "Sites premium" : "Premium websites", locale === "fr" ? "Workflows utiles" : "Useful workflows", locale === "fr" ? "Systèmes évolutifs" : "Scalable systems"].map((item) => (
              <div key={item} className="subtle-tile rounded-[1.25rem] px-4 py-3 text-sm font-medium text-primary">
                {item}
              </div>
            ))}
          </div>
        </div>

        {systemCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: reducedMotion ? 0 : [0, -6, 0]
              }}
              transition={{
                duration: 3.4,
                delay: index * 0.08,
                repeat: reducedMotion ? 0 : Infinity,
                ease: "easeInOut"
              }}
              className={`absolute ${card.className} subtle-tile-strong z-10 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold text-primary shadow-lg`}
            >
              <Icon className="size-4 text-accent" />
              {card.label[locale]}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
