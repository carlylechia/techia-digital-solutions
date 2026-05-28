"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";
import { getDictionary, getLocalizedHref, type Locale } from "@/content/site";

export function DigitalizationSimulator({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [business, setBusiness] = useState(dict.simulator.businessTypes[0]);
  const [problem, setProblem] = useState(dict.simulator.problems[0]);
  const [outcome, setOutcome] = useState(dict.simulator.outcomes[0]);
  const recommendation = useMemo(() => {
    const problemKey = problem.toLowerCase();
    const outcomeKey = outcome.toLowerCase();
    const needsDashboard = problemKey.includes("manual") || problemKey.includes("manuellement") || problemKey.includes("dashboard") || problemKey.includes("tableau") || outcomeKey.includes("dashboard") || outcomeKey.includes("tableau");
    const needsPortal = problemKey.includes("portal") || problemKey.includes("portail") || outcomeKey.includes("portal") || outcomeKey.includes("portail");
    const packageName = needsDashboard ? dict.simulator.packages.businessOs : needsPortal ? dict.simulator.packages.portal : dict.simulator.packages.website;
    const modules = [dict.simulator.modules.website, dict.simulator.modules.leadCapture, outcome, needsDashboard ? dict.simulator.modules.adminDashboard : dict.simulator.modules.conversionLandingPage, needsPortal ? dict.simulator.modules.clientPortal : dict.simulator.modules.analyticsTracking];
    return { packageName, modules };
  }, [dict, problem, outcome]);

  return (
    <section className="container py-16">
      <div className="premium-card grid gap-8 p-6 md:p-8 lg:grid-cols-[.95fr_1.05fr]">
        <div>
          <p className="eyebrow mb-3"><Layers3 className="size-4" /> {dict.simulator.title}</p>
          <h2 className="text-3xl font-semibold tracking-tight text-primary md:text-5xl">{dict.simulator.description}</h2>
          <p className="mt-4 text-muted">{dict.simulator.helperText}</p>
        </div>
        <div className="grid gap-4">
          {[{ label: dict.simulator.labels.business, value: business, setter: setBusiness, options: dict.simulator.businessTypes }, { label: dict.simulator.labels.problem, value: problem, setter: setProblem, options: dict.simulator.problems }, { label: dict.simulator.labels.outcome, value: outcome, setter: setOutcome, options: dict.simulator.outcomes }].map((field) => (
            <label key={field.label} className="grid gap-2 text-sm font-medium text-primary">
              {field.label}
              <select className="form-input" value={field.value} onChange={(event) => field.setter(event.target.value)}>
                {field.options.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          ))}
          <div className="rounded-3xl border border-accent/30 bg-accent/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">{dict.simulator.recommendationLabel}</p>
            <h3 className="mt-2 text-2xl font-semibold text-primary">{recommendation.packageName}</h3>
            <p className="mt-2 text-sm text-muted">{dict.simulator.recommendationSentence.replace("{business}", business.toLowerCase()).replace("{problem}", problem).replace("{outcome}", outcome)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {recommendation.modules.map((module) => <span key={module} className="trust-pill">{module}</span>)}
            </div>
            <Link href={getLocalizedHref(locale, "/start-project")} className="btn-primary mt-5 w-full justify-center">{dict.simulator.requestCta} <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
