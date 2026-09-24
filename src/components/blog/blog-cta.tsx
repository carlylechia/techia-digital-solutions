import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { BlogLocale } from "@/lib/blog/slug";
import { normalizeCtaHref } from "@/lib/blog/slug";

const copy = {
  en: {
    eyebrow: "A practical next step",
    title: "Ready to turn this idea into a digital advantage?",
    body: "Tell teChia where your business wants to grow. We will help you choose the right mix of strategy, marketing, websites, automation, AI, and business systems.",
    action: "Talk to teChia",
    secondary: "Explore digital solutions",
  },
  fr: {
    eyebrow: "Une prochaine étape concrète",
    title: "Prêt à transformer cette idée en avantage digital ?",
    body: "Dites-nous où votre entreprise veut grandir. Nous vous aiderons à choisir la bonne combinaison de stratégie, marketing, web, automatisation, IA et systèmes métier.",
    action: "Parler à teChia",
    secondary: "Découvrir nos solutions",
  },
} as const;

export function BlogCta({
  locale,
  title,
  description,
  href,
  label,
}: {
  locale: BlogLocale;
  title?: string | null;
  description?: string | null;
  href?: string | null;
  label?: string | null;
}) {
  const text = copy[locale];
  const safeHref = normalizeCtaHref(href || "/contact");
  return (
    <aside className="gradient-border my-12 overflow-hidden rounded-[1.75rem]">
      <div className="elevated-panel relative overflow-hidden p-6 sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-accent"><Sparkles className="size-4" />{text.eyebrow}</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-primary sm:text-3xl">{title || text.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base">{description || text.body}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={safeHref || "/contact"} className="btn-primary justify-center">
              {label || text.action}<ArrowRight className="size-4" />
            </Link>
            <Link href="/services" className="btn-secondary justify-center">{text.secondary}</Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
