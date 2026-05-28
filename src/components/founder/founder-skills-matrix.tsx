"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bot,
  Boxes,
  ChartNoAxesCombined,
  Layers3,
  MonitorSmartphone,
  Wrench
} from "lucide-react";
import { startTransition, useState } from "react";
import type { FounderSkillCategory } from "@/content/founder";
import { cn } from "@/lib/utils";

const iconMap = {
  frontend: MonitorSmartphone,
  backend: Layers3,
  systems: Boxes,
  growth: ChartNoAxesCombined,
  ai: Bot,
  tools: Wrench
} as const;

export function FounderSkillsMatrix({
  categories,
  locale
}: {
  categories: FounderSkillCategory[];
  locale: "en" | "fr";
}) {
  const [activeId, setActiveId] = useState(categories[0]?.id ?? "");
  const reducedMotion = useReducedMotion();
  const activeCategory = categories.find((category) => category.id === activeId) ?? categories[0];

  if (!activeCategory) return null;

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="grid gap-3" role="tablist" aria-label={locale === "fr" ? "Catégories de compétences techniques" : "Technical skill categories"}>
        {categories.map((category) => {
          const Icon = iconMap[category.icon];
          const isActive = category.id === activeCategory.id;

          return (
            <button
              key={category.id}
              id={`founder-skill-tab-${category.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`founder-skill-panel-${category.id}`}
              className={cn(
                "premium-card flex items-start gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/45",
                isActive && "border-accent/45 bg-[linear-gradient(135deg,rgba(34,211,238,.12),transparent_35%),linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_92%,transparent),color-mix(in_srgb,var(--surface)_88%,transparent))]"
              )}
              onClick={() => startTransition(() => setActiveId(category.id))}
            >
              <span className="icon-chip rounded-2xl p-3">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-semibold text-primary">{category.title}</span>
                <span className="mt-1 block text-sm leading-6 text-muted">{category.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="gradient-border rounded-[1.75rem]">
        <div
          id={`founder-skill-panel-${activeCategory.id}`}
          role="tabpanel"
          aria-labelledby={`founder-skill-tab-${activeCategory.id}`}
          className="premium-card relative overflow-hidden rounded-[1.75rem] p-6 sm:p-8"
        >
          <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.2),transparent_60%)]" aria-hidden="true" />
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory.id}
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="eyebrow mb-3">{activeCategory.title}</p>
                  <h3 className="text-2xl font-semibold text-primary sm:text-3xl">{activeCategory.description}</h3>
                </div>
                <div className="status-pill rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {activeCategory.items.length} {locale === "fr" ? "axes" : "focus areas"}
                </div>
              </div>

              <p className="mt-5 max-w-2xl text-base leading-7 text-muted">{activeCategory.value}</p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {activeCategory.items.map((item) => (
                  <div key={item} className="subtle-tile rounded-[1.25rem] px-4 py-3 text-sm font-medium text-primary">
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
