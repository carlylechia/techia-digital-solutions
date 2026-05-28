"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, BriefcaseBusiness, Globe2, Sparkles, Workflow } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { FOUNDER_NAME } from "@/content/founder";
import type { Locale } from "@/content/site";

const floatingCards = [
  {
    key: "founder-led",
    icon: BadgeCheck,
    label: { en: "Founder-led delivery", fr: "Livraison dirigée par le fondateur" },
    className: "left-3 top-5 sm:left-5 sm:top-6"
  },
  {
    key: "systems",
    icon: Workflow,
    label: { en: "Full-stack systems", fr: "Systèmes full-stack" },
    className: "right-3 top-16 sm:right-5 sm:top-18"
  },
  {
    key: "global",
    icon: Globe2,
    label: { en: "Local insight, global quality", fr: "Vision locale, qualité globale" },
    className: "right-4 bottom-28 sm:right-6 sm:bottom-30"
  }
] as const;

export function FounderHeroPortrait({ locale }: { locale: Locale }) {
  const reducedMotion = useReducedMotion();
  const altText =
    locale === "fr" ? "Portrait professionnel de Chia Carlyle" : "Professional portrait of Chia Carlyle";

  return (
    <div className="relative mx-auto w-full max-w-[760px] xl:max-w-none">
      <div className="absolute -inset-x-8 top-4 h-48 rounded-full bg-cyan-300/22 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-5 left-1/2 h-44 w-[82%] -translate-x-1/2 rounded-full bg-violet-400/22 blur-3xl" aria-hidden="true" />

      <motion.div
        whileHover={reducedMotion ? undefined : { y: -12, scale: 1.018, rotate: -0.45 }}
        transition={reducedMotion ? undefined : { type: "spring", stiffness: 180, damping: 18, mass: 0.82 }}
        className="group gradient-border rounded-[2rem]"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-border bg-slate-950 shadow-[0_32px_120px_rgba(8,14,25,0.28)] sm:aspect-[10/11]">
          <Image
            src="/images/carlyle.png"
            alt={altText}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 54vw"
            className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.045] sm:object-[center_18%]"
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,11,22,0.04)_0%,rgba(4,11,22,0.0)_28%,rgba(4,11,22,0.24)_68%,rgba(4,11,22,0.82)_100%)]"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_16%,rgba(34,211,238,0.22),transparent_24%),radial-gradient(circle_at_24%_84%,rgba(139,92,246,0.18),transparent_28%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100" aria-hidden="true" />

          <div className="absolute inset-x-4 top-4 flex flex-wrap items-center justify-between gap-3 sm:inset-x-5 sm:top-5">
            <div className="status-pill inline-flex items-center gap-2 rounded-full border-white/10 bg-black/14 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/84 backdrop-blur-md">
              <span className="inline-flex size-2 rounded-full bg-cyan-300" />
              {locale === "fr" ? "Portrait fondateur" : "Founder portrait"}
            </div>
            <div className="rounded-full border border-white/12 bg-black/12 px-3 py-2 backdrop-blur-md">
              <Logo variant="horizontal" size="sm" theme="dark" href={null} />
            </div>
          </div>

          <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5">
            <div className="rounded-[1.6rem] border border-white/12 bg-black/18 p-4 text-white shadow-2xl backdrop-blur-lg sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/85">
                    {locale === "fr" ? "Fondateur" : "Founder"}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{FOUNDER_NAME}</h2>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-3 text-cyan-300">
                  <Sparkles className="size-5" />
                </div>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/78 sm:text-base">
                {locale === "fr"
                  ? "Ingénierie premium, systèmes métier et réflexion produit réunis dans une seule exécution."
                  : "Premium engineering, business systems, and product thinking in one delivery layer."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[locale === "fr" ? "Builder" : "Builder", locale === "fr" ? "Produit + Tech" : "Product + Tech", locale === "fr" ? "SEO + Automatisation" : "SEO + Automation"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/12 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/82"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {floatingCards.map((card, index) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: reducedMotion ? 0 : [0, -8, 0]
            }}
            transition={{
              duration: 3.6,
              delay: 0.15 + index * 0.1,
              repeat: reducedMotion ? 0 : Infinity,
              ease: "easeInOut"
            }}
            className={`absolute ${card.className} founder-floating-card hidden items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold text-primary shadow-xl sm:inline-flex`}
          >
            <Icon className="size-4 text-accent" />
            {card.label[locale]}
          </motion.div>
        );
      })}

      <div className="pointer-events-none absolute -left-4 bottom-14 hidden rounded-[1.5rem] border border-white/8 bg-white/[0.025] px-4 py-3 text-sm text-white/82 shadow-2xl backdrop-blur-md lg:block">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-2 text-cyan-300">
            <BriefcaseBusiness className="size-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/85">
              {locale === "fr" ? "Positionnement" : "Positioning"}
            </p>
            <p className="mt-1 text-sm font-medium text-white/88">
              {locale === "fr" ? "Développeur, stratège produit, fondateur" : "Developer, product strategist, founder"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
