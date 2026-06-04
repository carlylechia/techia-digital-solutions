"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Gauge,
  Globe2,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/site/reveal";
import { buttonVariants } from "@/components/site/button";
import { getDictionary, getLocalizedHref, type Locale } from "@/content/site";
import { cn } from "@/lib/utils";

const cardPlacements = [
  "md:left-0 md:top-6 md:w-[46%]",
  "md:right-0 md:top-14 md:w-[42%]",
  "md:left-8 md:bottom-8 md:w-[41%]",
  "md:right-8 md:bottom-10 md:w-[39%]",
];

export function HomepageSystemShowcase({ locale }: { locale: Locale }) {
  const reduceMotion = useReducedMotion();
  const dict = getDictionary(locale);
  const orbitCards =
    locale === "fr"
      ? [
          {
            icon: Globe2,
            title: "Présence & confiance",
            description:
              "Un site public qui présente l’offre clairement et donne confiance dès les premières secondes.",
          },
          {
            icon: Workflow,
            title: "Capture & qualification",
            description:
              "Des demandes mieux structurées, des relances plus propres et moins d’allers-retours manuels.",
          },
          {
            icon: Gauge,
            title: "Visibilité opérationnelle",
            description:
              "Des tableaux de bord, statuts et signaux de suivi qui rendent l’équipe plus calme et plus rapide.",
          },
          {
            icon: Bot,
            title: "Automatisation & IA",
            description:
              "Des assistants et workflows qui enlèvent la répétition sans compliquer le métier.",
          },
        ]
      : [
          {
            icon: Globe2,
            title: "Presence and trust",
            description:
              "A public-facing website that explains the offer clearly and earns confidence from the first few seconds.",
          },
          {
            icon: Workflow,
            title: "Capture and qualification",
            description:
              "Structured inquiries, cleaner follow-up, and less manual back-and-forth before work even starts.",
          },
          {
            icon: Gauge,
            title: "Operational visibility",
            description:
              "Dashboards, status signals, and reporting that make the team calmer and faster to coordinate.",
          },
          {
            icon: Bot,
            title: "Automation and AI",
            description:
              "Assistants and workflows that remove repetition without adding unnecessary complexity.",
          },
        ];
  const copy =
    locale === "fr"
      ? {
          script: "du site web premium au système métier",
          eyebrow: "Offres connectées",
          title:
            "Commencez par le bon service maintenant, puis développez les outils dont l’entreprise aura vraiment besoin.",
          description:
            "teChia peut démarrer avec un site premium, une landing page ou un portail client, puis faire évoluer le projet vers des dashboards, des flux de devis, des automatisations et des outils IA sans repartir de zéro.",
          highlights: [
            "Sites web premium et pages de conversion",
            "Portails clients et dashboards d’administration",
            "Parcours de devis, réservation et capture de leads",
            "Automatisations, relances et outils IA",
          ],
          cta: "Voir les services",
          orbitLabel: "solutions connectées",
          footerLabel: "Conçu pour les ventes, le service et les opérations",
        }
      : {
          script: "from premium websites to business systems",
          eyebrow: "Connected offers",
          title:
            "Start with the right service now, then expand into the tools your business will actually use.",
          description:
            "teChia can begin with a premium website, landing page, or client portal and grow that foundation into dashboards, quote flows, booking journeys, automation, and AI support without forcing a full rebuild.",
          highlights: [
            "Premium websites and landing pages",
            "Client portals and admin dashboards",
            "Lead capture, quote, and booking workflows",
            "Automation, follow-up, and AI support tools",
          ],
          cta: "Explore services",
          orbitLabel: "connected solutions",
          footerLabel: "Built to support sales, service, and operations",
        };

  return (
    <section className="container py-16">
      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
        <Reveal>
          <div className="gradient-border rounded-[2rem]">
            <div className="elevated-panel h-full p-7 md:p-8">
              <p className="font-script text-3xl text-accent-3 md:text-4xl">
                {copy.script}
              </p>
              <p className="eyebrow mt-3">{copy.eyebrow}</p>
              <h2 className="mt-4 text-balance text-4xl font-semibold text-foreground md:text-6xl">
                <span className="headline-gradient">{copy.title}</span>
              </h2>
              <div className="headline-underline mt-6" aria-hidden="true" />
              <p className="mt-6 text-base leading-8 text-muted md:text-lg">
                {copy.description}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {copy.highlights.map((item) => (
                  <div
                    key={item}
                    className="subtle-tile rounded-[1.35rem] p-4 text-sm leading-7 text-muted"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-2">
                {dict.solutions.slice(0, 4).map((item) => (
                  <span key={item.slug} className="trust-pill">
                    {item.title}
                  </span>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href={getLocalizedHref(locale, "/services")}
                  className={cn(
                    buttonVariants({ variant: "primary", size: "lg" }),
                    "w-full sm:w-auto",
                  )}
                >
                  {copy.cta}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="gradient-border rounded-[2rem]">
            <div className="surface-panel relative overflow-hidden p-4 md:p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_80%_18%,rgba(251,113,133,0.14),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(245,185,66,0.12),transparent_26%)]" />
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-55 [background-image:linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:72px_72px]"
              />

              <div className="relative min-h-[30rem] md:min-h-[34rem]">
                <motion.div
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 hidden h-[17rem] w-[17rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(34,211,238,0.12),transparent_62%)] md:block"
                  animate={reduceMotion ? undefined : { scale: [1, 1.04, 1] }}
                  transition={
                    reduceMotion
                      ? undefined
                      : {
                          duration: 7.5,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }
                  }
                />

                <motion.div
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 hidden h-[23rem] w-[23rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-cyan-300/16 md:block"
                  animate={reduceMotion ? undefined : { rotate: 360 }}
                  transition={
                    reduceMotion
                      ? undefined
                      : {
                          duration: 32,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }
                  }
                />

                <div className="grid gap-4 md:block">
                  {orbitCards.map((card, index) => {
                    const Icon = card.icon;

                    return (
                      <motion.article
                        key={card.title}
                        className={cn(
                          "min-w-0 rounded-[1.6rem] border border-white/12 bg-[linear-gradient(180deg,rgba(10,18,34,0.84),rgba(10,18,34,0.62))] p-4 text-left shadow-[0_28px_70px_rgba(5,7,13,0.22)] backdrop-blur-xl sm:p-5",
                          !reduceMotion &&
                            "motion-safe:animate-[float-drift_7s_ease-in-out_infinite]",
                          "md:absolute",
                          cardPlacements[index],
                        )}
                        initial={
                          reduceMotion
                            ? undefined
                            : { opacity: 0, y: 28, scale: 0.96 }
                        }
                        whileInView={
                          reduceMotion
                            ? undefined
                            : { opacity: 1, y: 0, scale: 1 }
                        }
                        viewport={{ once: true, amount: 0.35 }}
                        transition={
                          reduceMotion
                            ? undefined
                            : {
                                duration: 0.62,
                                delay: 0.08 + index * 0.08,
                                ease: [0.16, 1, 0.3, 1],
                              }
                        }
                        style={
                          reduceMotion
                            ? undefined
                            : {
                                animationDelay: `${index * 0.45}s`,
                                animationDuration: `${7 + index * 0.8}s`,
                              }
                        }
                      >
                        <div className="panel-safe flex items-start gap-3">
                          <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                            <Icon className="size-5" />
                          </span>
                          <div className="panel-safe">
                            <h3 className="break-safe text-lg font-semibold text-white">
                              {card.title}
                            </h3>
                            <p className="break-safe mt-2 text-sm leading-7 text-slate-300">
                              {card.description}
                            </p>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>

                <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex">
                  <div className="rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(8,15,28,0.94),rgba(10,18,34,0.82))] px-5 py-4 text-center shadow-[0_22px_60px_rgba(5,7,13,0.24)] backdrop-blur-xl">
                    <p className="break-safe text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-cyan-200">
                      teChia
                    </p>
                    <p className="break-safe mt-1 text-sm font-medium text-white">
                      {copy.orbitLabel}
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 hidden max-w-[calc(100%-2rem)] items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 text-xs font-medium text-slate-200 backdrop-blur md:inline-flex">
                  <ShieldCheck className="size-3.5 text-cyan-300" />
                  <span className="break-safe">{copy.footerLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
