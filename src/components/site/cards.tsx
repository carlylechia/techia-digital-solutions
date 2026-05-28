"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { createElement } from "react";
import type {
  CaseStudyItem,
  PricingPlan,
  ResourceItem,
  ServiceItem,
  SolutionItem,
  TestimonialItem
} from "@/content/nexus-site";
import { cn } from "@/lib/utils";
import { iconMap, type IconKey } from "./icon-map";

function iconFromKey(key: string) {
  return iconMap[key as IconKey];
}

function IconGlyph({ icon, className = "size-5" }: { icon?: string; className?: string }) {
  const Icon = icon ? iconFromKey(icon) : undefined;
  return Icon ? createElement(Icon, { className }) : null;
}

const hoverTransition = { type: "spring", stiffness: 320, damping: 22, mass: 0.7 } as const;

export function NexusIconCard({
  icon,
  title,
  description,
  className
}: {
  icon: string;
  title: string;
  description: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={reduceMotion ? undefined : hoverTransition}
      className={cn("gradient-border elevated-panel p-6", className)}
    >
      <div className="icon-chip mb-5 inline-flex rounded-2xl p-3"><IconGlyph icon={icon} /></div>
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
    </motion.article>
  );
}

export function ServiceCard({ service }: { service: ServiceItem }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article whileHover={reduceMotion ? undefined : { y: -6 }} transition={reduceMotion ? undefined : hoverTransition} className="gradient-border h-full rounded-[1.5rem]">
      <div className="elevated-panel flex h-full flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="icon-chip inline-flex rounded-2xl p-3"><IconGlyph icon={service.icon} /></span>
          <span className="status-pill rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.22em]">
            Service
          </span>
        </div>
        <h3 className="mt-6 text-2xl font-semibold text-foreground">{service.title}</h3>
        <p className="mt-3 text-sm leading-7 text-muted">{service.description}</p>
        <p className="mt-5 text-sm leading-7 text-muted-foreground">{service.detail}</p>
        <Link href={service.href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent-2">
          Learn more
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </motion.article>
  );
}

export function SolutionCard({ solution }: { solution: SolutionItem }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article whileHover={reduceMotion ? undefined : { y: -6 }} transition={reduceMotion ? undefined : hoverTransition} className="gradient-border h-full rounded-[1.5rem]">
      <div className="elevated-panel flex h-full flex-col p-6">
        <div className="flex items-center gap-3">
          <span className="icon-chip inline-flex rounded-2xl p-3"><IconGlyph icon={solution.icon} /></span>
          <h3 className="text-xl font-semibold text-foreground">{solution.title}</h3>
        </div>
        <dl className="mt-6 grid gap-4 text-sm">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-2">Problem</dt>
            <dd className="mt-2 leading-7 text-muted">{solution.problem}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-2">Digital solution</dt>
            <dd className="mt-2 leading-7 text-muted">{solution.solution}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-2">Business benefit</dt>
            <dd className="mt-2 leading-7 text-muted">{solution.benefit}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          {solution.features.map((feature) => (
            <span key={feature} className="trust-pill">
              {feature}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

export function CaseStudyCard({ study, href }: { study: CaseStudyItem; href: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article whileHover={reduceMotion ? undefined : { y: -6 }} transition={reduceMotion ? undefined : hoverTransition} className="gradient-border h-full rounded-[1.5rem]">
      <div className="elevated-panel flex h-full flex-col p-6">
        <span className="eyebrow">{study.industry}</span>
        <h3 className="mt-5 text-2xl font-semibold text-foreground">{study.title}</h3>
        <p className="mt-3 text-sm leading-7 text-muted">{study.summary}</p>
        <div className="mt-5 grid gap-3 text-sm text-muted">
          <p>
            <span className="font-semibold text-foreground">Services delivered:</span> {study.services.join(", ")}
          </p>
          <p>
            <span className="font-semibold text-foreground">Project type:</span> {study.projectType}
          </p>
          <p>
            <span className="font-semibold text-foreground">Result:</span> {study.outcome}
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {study.metrics.map((metric) => (
            <span key={metric} className="trust-pill">
              {metric}
            </span>
          ))}
        </div>
        <Link href={href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent-2">
          View Case Study
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </motion.article>
  );
}

export function PricingCard({ plan }: { plan: PricingPlan }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : { y: -6, scale: plan.featured ? 1.01 : 1 }}
      transition={reduceMotion ? undefined : hoverTransition}
      className={cn("gradient-border rounded-[1.5rem]", plan.featured && "shadow-[0_0_0_1px_rgba(34,211,238,0.16),0_24px_80px_rgba(34,211,238,0.18)]")}
    >
      <div className={cn("elevated-panel flex h-full flex-col p-6", plan.featured && "bg-[linear-gradient(180deg,rgba(7,17,31,0.95),rgba(12,25,45,0.96))] text-white")}>
        <span className={cn("text-[11px] font-semibold uppercase tracking-[0.24em]", plan.featured ? "text-cyan-300" : "text-accent-2")}>{plan.label}</span>
        <h3 className="mt-4 text-2xl font-semibold">{plan.title}</h3>
        <p className={cn("mt-3 text-sm leading-7", plan.featured ? "text-slate-200" : "text-muted")}>{plan.description}</p>
        <div className="mt-6 grid gap-3">
          {plan.features.map((feature) => (
            <div key={feature} className={cn("flex items-start gap-3 rounded-2xl p-3 text-sm", plan.featured ? "border border-white/12 bg-white/5 text-slate-100" : "subtle-tile text-muted")}>
              <CheckCircle2 className={cn("mt-0.5 size-4 shrink-0", plan.featured ? "text-cyan-300" : "text-accent-2")} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
        <Link
          href={plan.href}
          className={cn(
            "mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold",
            plan.featured ? "bg-white text-[#07111F]" : "btn-primary"
          )}
        >
          {plan.cta}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </motion.article>
  );
}

export function TestimonialCard({ item }: { item: TestimonialItem }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.blockquote whileHover={reduceMotion ? undefined : { y: -4 }} transition={reduceMotion ? undefined : hoverTransition} className="gradient-border rounded-[1.5rem]">
      <div className="surface-panel h-full p-6">
        <p className="text-lg leading-8 text-foreground">“{item.quote}”</p>
        <footer className="mt-6">
          <p className="font-semibold text-foreground">{item.name}</p>
          <p className="text-sm text-muted">
            {item.role} · {item.company}
          </p>
        </footer>
      </div>
    </motion.blockquote>
  );
}

export function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="gradient-border rounded-[1.5rem]">
      <div className="surface-panel h-full p-5">
        <p className="font-display text-3xl font-semibold text-foreground">{value}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{label}</p>
      </div>
    </div>
  );
}

export function ResourceCard({ item }: { item: ResourceItem }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article whileHover={reduceMotion ? undefined : { y: -6 }} transition={reduceMotion ? undefined : hoverTransition} className="gradient-border rounded-[1.5rem]">
      <div className="surface-panel h-full p-6">
        <div className="icon-chip inline-flex rounded-2xl p-3"><IconGlyph icon={item.icon} /></div>
        <h3 className="mt-5 text-xl font-semibold text-foreground">{item.title}</h3>
        <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
        <Link href={item.href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent-2">
          Explore
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </motion.article>
  );
}
