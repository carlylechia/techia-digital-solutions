"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { PublicHomepageMetric } from "@/lib/public-showcase";
import { cn } from "@/lib/utils";

const COUNT_DURATION_MS = 1650;

function formatMetricValue(locale: string, value: number) {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function useCountUp(target: number, active: boolean, delay: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;

    let animationFrame = 0;
    let timeoutId = 0;
    let startedAt = 0;

    const tick = (now: number) => {
      if (!startedAt) startedAt = now;
      const progress = Math.min((now - startedAt) / COUNT_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(tick);
      }
    };

    timeoutId = window.setTimeout(() => {
      animationFrame = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrame);
    };
  }, [active, delay, target]);

  return value;
}

function MetricCard({
  metric,
  index,
  active,
  locale,
  reduceMotion,
}: {
  metric: PublicHomepageMetric;
  index: number;
  active: boolean;
  locale: string;
  reduceMotion: boolean;
}) {
  const animatedValue = useCountUp(
    metric.value,
    active && !reduceMotion,
    index * 130,
  );
  const value = reduceMotion ? metric.value : animatedValue;
  const formattedValue = formatMetricValue(locale, value);
  const finalValue = `${metric.prefix}${formatMetricValue(locale, metric.value)}${metric.suffix}`;

  return (
    <article
      data-ready={active}
      className="homepage-stat-card relative min-w-0 overflow-hidden rounded-[1.4rem] border border-border bg-background/55 px-4 py-5 text-center backdrop-blur-xl transition duration-500 data-[ready=true]:bg-background/75 dark:bg-white/[0.025] dark:data-[ready=true]:bg-white/[0.045] sm:px-5 sm:py-6"
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/60 to-transparent"
      />

      <div className="homepage-stat-value flex min-h-[1em] items-baseline justify-center gap-0.5 font-display text-[clamp(2.35rem,7vw,3.6rem)] font-semibold leading-none tracking-[-0.05em] text-foreground">
        {active ? (
          <span aria-hidden="true">
            {metric.prefix}
            {formattedValue}
            {metric.suffix}
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="homepage-stat-skeleton inline-block h-[0.68em] w-20 rounded-full align-middle"
          />
        )}
        <span className="sr-only">{finalValue}</span>
      </div>

      <div
        aria-hidden="true"
        className={cn(
          "homepage-stat-loader mx-auto mt-4 h-1 w-16 overflow-hidden rounded-full bg-border transition-opacity duration-500",
          active ? "opacity-0" : "opacity-100",
        )}
      />

      <p
        className={cn(
          "mx-auto mt-4 max-w-[15rem] text-balance text-sm font-medium leading-6 text-muted transition-opacity duration-500",
          active ? "opacity-100" : "opacity-70",
        )}
      >
        {metric.label}
      </p>

      <span
        aria-hidden="true"
        className={cn(
          "mt-4 inline-flex items-center gap-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-accent-2 transition-opacity duration-500",
          active ? "opacity-100" : "opacity-0",
        )}
      >
        <ArrowUpRight className="size-3" />
        {locale === "fr" ? "En mouvement" : "In motion"}
      </span>
    </article>
  );
}

export function HomepageStatsSection({
  metrics,
  locale,
}: {
  metrics: PublicHomepageMetric[];
  locale: string;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      const frame = requestAnimationFrame(() => setActive(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!metrics.length) return null;

  return (
    <section
      aria-labelledby="homepage-stats-heading"
      className="container py-12 sm:py-16 lg:py-18"
    >
      <div className="gradient-border rounded-[2rem]">
        <div className="elevated-panel relative overflow-hidden px-5 py-9 sm:px-7 md:px-10 md:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(34,211,238,0.13),transparent_34%),radial-gradient(circle_at_88%_82%,rgba(251,113,133,0.1),transparent_24%),radial-gradient(circle_at_8%_88%,rgba(245,185,66,0.1),transparent_22%)]"
          />
          <div className="relative z-10">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto max-w-3xl text-center"
            >
              <p className="eyebrow justify-center">
                {locale === "fr" ? "Impact mesuré" : "Impact, measured"}
              </p>
              <h2
                id="homepage-stats-heading"
                className="mx-auto mt-4 max-w-2xl text-balance text-3xl font-semibold leading-[1.05] text-foreground sm:text-4xl md:text-5xl"
              >
                {locale === "fr"
                  ? "Une croissance que l’on peut voir dans les chiffres."
                  : "Growth you can see in the numbers."}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-7 text-muted md:text-base">
                {locale === "fr"
                  ? "Des repères concrets sur la façon dont teChia combine stratégie, exécution et systèmes pour faire avancer les entreprises."
                  : "Clear signals of how teChia combines strategy, execution, and systems to move businesses forward."}
              </p>
            </motion.div>

            <div
              ref={sectionRef}
              className="mt-9 grid grid-cols-2 gap-3 xl:grid-cols-4"
            >
              {metrics.map((metric, index) => (
                <MetricCard
                  key={metric.id}
                  metric={metric}
                  index={index}
                  active={active}
                  locale={locale}
                  reduceMotion={Boolean(reduceMotion)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
