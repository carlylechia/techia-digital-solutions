"use client";

import { Bot, Gauge, Globe, Sparkles, Workflow } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { heroBadges } from "@/content/nexus-site";
import { GradientBadge } from "./gradient-badge";

const floatingCards = [
  {
    title: "Premium websites",
    body: "High-trust interfaces for serious brands.",
    icon: Globe,
    className: "left-0 top-10 w-48 md:w-52"
  },
  {
    title: "Automation workflows",
    body: "Fewer manual steps, faster coordination.",
    icon: Workflow,
    className: "right-0 top-24 w-48 md:w-56"
  },
  {
    title: "AI tools",
    body: "Practical copilots for real business work.",
    icon: Bot,
    className: "left-8 bottom-12 w-48 md:w-52"
  },
  {
    title: "Dashboards",
    body: "Visibility across projects, sales, and ops.",
    icon: Gauge,
    className: "right-4 bottom-0 w-48 md:w-52"
  }
];

export function DashboardPreview() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-[36rem]">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={reduceMotion ? undefined : { duration: 0.55, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(9,16,31,0.96),rgba(9,16,31,0.84))] p-5 pt-16 shadow-[0_40px_120px_rgba(0,0,0,0.45)] md:pt-5"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:52px_52px]"
        />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">Nexus Interface</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-white">Digital command center</h3>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-slate-300">
            Live Preview
          </div>
        </div>

        <div className="relative z-10 mt-6 grid gap-4 md:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Business systems</p>
                <p className="mt-1 text-xs text-slate-400">Operations, clients, and delivery aligned in one flow.</p>
              </div>
              <Sparkles className="size-5 text-cyan-300" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Lead flow</p>
                <p className="mt-2 font-display text-2xl font-semibold text-white">92%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Automation</p>
                <p className="mt-2 font-display text-2xl font-semibold text-white">18</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">AI assists</p>
                <p className="mt-2 font-display text-2xl font-semibold text-white">06</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-cyan-400/12 via-blue-500/10 to-violet-500/12 p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">Solution pulse</p>
            <div className="mt-5 space-y-3">
              {["Website launch lane", "Automation trigger map", "Client portal module", "Executive dashboard"].map((item, index) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-[#07111F]/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white">{item}</p>
                    <span className="text-xs text-cyan-200">{index === 0 ? "Ready" : index === 1 ? "Active" : "In view"}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-emerald-300"
                      style={{ width: `${78 - index * 14}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {floatingCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={
              reduceMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 1, y: [0, -8, 0] }
            }
            transition={
              reduceMotion
                ? { duration: 0.2 }
                : { opacity: { duration: 0.4, delay: 0.2 + index * 0.08 }, y: { duration: 6 + index, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } }
            }
            className={`absolute hidden md:block ${card.className} rounded-[1.3rem] border border-white/12 bg-[#081120]/88 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl`}
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex rounded-2xl border border-white/10 bg-white/[0.08] p-2.5 text-cyan-300">
                <Icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{card.title}</p>
                <p className="mt-1 text-xs leading-6 text-slate-400">{card.body}</p>
              </div>
            </div>
          </motion.div>
        );
      })}

      <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex flex-wrap justify-start gap-2 md:inset-x-8 md:-top-5 md:justify-center">
        {heroBadges.map((badge, index) => (
          <motion.div
            key={badge}
            initial={reduceMotion ? false : { opacity: 0, y: -12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={reduceMotion ? undefined : { duration: 0.35, delay: 0.28 + index * 0.06 }}
          >
            <GradientBadge>{badge}</GradientBadge>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
