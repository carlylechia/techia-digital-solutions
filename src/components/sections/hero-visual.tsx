"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bot, CalendarCheck, Database, Globe2, LineChart, Mail, PanelsTopLeft, ShieldCheck, Sparkles } from "lucide-react";
import type { Locale } from "@/content/site";

const nodes = [
  { label: { en: "Website", fr: "Site web" }, icon: Globe2, className: "left-[8%] top-[14%]" },
  { label: { en: "Dashboard", fr: "Tableau de bord" }, icon: PanelsTopLeft, className: "right-[10%] top-[18%]" },
  { label: { en: "CRM", fr: "CRM" }, icon: ShieldCheck, className: "left-[4%] bottom-[28%]" },
  { label: { en: "AI Assistant", fr: "Assistant IA" }, icon: Bot, className: "right-[3%] bottom-[30%]" },
  { label: { en: "Analytics", fr: "Analytics" }, icon: LineChart, className: "left-[33%] bottom-[8%]" },
  { label: { en: "Automation", fr: "Automatisation" }, icon: Mail, className: "right-[30%] bottom-[8%]" },
  { label: { en: "Booking", fr: "Réservation" }, icon: CalendarCheck, className: "left-[35%] top-[3%]" },
  { label: { en: "Database", fr: "Base de données" }, icon: Database, className: "right-[36%] top-[4%]" }
];

export function HeroVisual({ locale }: { locale: Locale }) {
  const reducedMotion = useReducedMotion();
  return (
    <div className="relative mx-auto aspect-square max-w-[620px] overflow-hidden rounded-[2rem] border border-border bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,.18),transparent_35%),linear-gradient(145deg,var(--surface),rgba(255,255,255,.02))] p-4 shadow-2xl">
      <div className="absolute inset-8 rounded-full border border-accent/20" />
      <div className="absolute inset-16 rounded-full border border-violet-400/20" />
      <div className="absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_120deg,rgba(34,211,238,.4),rgba(139,92,246,.16),rgba(16,185,129,.22),rgba(34,211,238,.4))] opacity-40 blur-2xl" />
      <svg className="absolute inset-0 h-full w-full opacity-60" aria-hidden="true">
        <defs>
          <linearGradient id="line" x1="0" x2="1"><stop stopColor="var(--accent)" /><stop offset="1" stopColor="var(--violet)" /></linearGradient>
        </defs>
        {nodes.map((_, index) => (
          <line key={index} x1="50%" y1="50%" x2={`${16 + (index % 4) * 22}%`} y2={`${18 + Math.floor(index / 4) * 60}%`} stroke="url(#line)" strokeWidth="1" strokeDasharray="4 8" />
        ))}
      </svg>
      <motion.div
        initial={false}
        animate={reducedMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
        className="absolute left-1/2 top-1/2 grid h-36 w-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[2rem] border border-accent/35 bg-background/70 shadow-glow backdrop-blur-xl"
      >
        <div className="grid h-24 w-24 place-items-center rounded-3xl bg-accent/10 text-accent">
          <Sparkles className="size-10" />
        </div>
      </motion.div>
      {nodes.map((node, index) => {
        const Icon = node.icon;
        return (
          <motion.div
            key={node.label.en}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: reducedMotion ? 0 : [0, -8, 0] }}
            transition={{ duration: 3.2, delay: index * 0.08, repeat: reducedMotion ? 0 : Infinity, ease: "easeInOut" }}
            className={`absolute ${node.className} glass-card flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium text-primary`}
          >
            <Icon className="size-4 text-accent" /> {node.label[locale]}
          </motion.div>
        );
      })}
    </div>
  );
}
