import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDictionary, getLocalizedHref, type Locale } from "@/content/site";
import { HeroVisual } from "./hero-visual";

export function Hero({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.22),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(139,92,246,.18),transparent_26%)]" />
      <div className="container grid items-center gap-12 lg:grid-cols-[1.03fr_.97fr]">
        <div>
          <p className="eyebrow mb-5">{dict.hero.eyebrow}</p>
          <h1 className="max-w-4xl text-balance font-display text-5xl font-semibold tracking-tight text-primary md:text-7xl">{dict.hero.title}</h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted md:text-xl">{dict.hero.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={getLocalizedHref(locale, "/start-project")} className="btn-primary" data-event="start_project_click">
              {dict.common.startProject} <ArrowRight className="size-4" />
            </Link>
            <Link href={getLocalizedHref(locale, "/solutions")} className="btn-secondary">{dict.common.exploreSolutions}</Link>
            <Link href={getLocalizedHref(locale, "/demo-lab")} className="btn-ghost">{dict.common.viewDemoLab}</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {dict.hero.trust.map((item) => <span key={item} className="trust-pill">{item}</span>)}
          </div>
        </div>
        <HeroVisual locale={locale} />
      </div>
    </section>
  );
}
