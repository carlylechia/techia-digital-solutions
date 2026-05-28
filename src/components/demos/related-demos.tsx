import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DemoDefinition } from "@/content/demo-lab";
import { demoLabUi } from "@/content/demo-lab";

type Locale = "en" | "fr";

const demoIcons: Record<string, string> = {
  "logistics-quote-generator": "🚚",
  "travel-consultancy-dashboard": "✈️",
  "business-management-dashboard": "📊",
  "booking-system": "📅",
  "ai-digital-advisor": "🤖"
};

interface RelatedDemosProps {
  demos: DemoDefinition[];
  locale: Locale;
  currentSlug: string;
}

export function RelatedDemos({ demos, locale, currentSlug }: RelatedDemosProps) {
  const ui = demoLabUi[locale];
  const related = demos.filter((d) => d.slug !== currentSlug).slice(0, 3);

  if (!related.length) return null;

  return (
    <section className="grid gap-6">
      <h2 className="text-2xl font-bold text-primary">{ui.relatedSection}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((demo) => (
          <Link
            key={demo.slug}
            href={`/${locale}/demo-lab/${demo.slug}`}
            className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-4 transition hover:border-accent/40 hover:bg-surface/80"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent/10 text-xl">
              {demoIcons[demo.slug] ?? "⚙️"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">{demo.eyebrow[locale]}</p>
              <p className="mt-0.5 font-semibold text-primary group-hover:text-accent transition leading-tight">
                {demo.title[locale]}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-muted leading-relaxed">{demo.problem[locale]}</p>
            </div>
            <ArrowRight className="mt-1 size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
          </Link>
        ))}
      </div>
    </section>
  );
}
