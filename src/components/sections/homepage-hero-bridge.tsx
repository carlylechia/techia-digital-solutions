"use client";

import { Activity, Bot, Gauge, Globe2, ShieldCheck, Workflow } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { InfiniteMarquee } from "@/components/site/infinite-marquee";
import { Reveal } from "@/components/site/reveal";
import { getDictionary, type Locale } from "@/content/site";

export function HomepageHeroBridge({ locale }: { locale: Locale }) {
  const reduceMotion = useReducedMotion();
  const dict = getDictionary(locale);
  const marqueeItems = [
    ...dict.hero.trust,
    ...dict.services.slice(0, 3).map((item) => item.title),
    ...dict.stack.slice(0, 3),
  ];
  const copy =
    locale === "fr"
      ? {
          eyebrow: "Ce que teChia propose",
          title:
            "Sites premium, portails, systèmes métier, automatisations et outils IA pour les entreprises sérieuses.",
          description:
            "teChia conçoit et développe des expériences digitales qui renforcent la crédibilité, structurent les demandes clients, organisent les opérations et réduisent le travail manuel avec des outils pensés pour le vrai fonctionnement de l’entreprise.",
          pillars: [
            {
              label: "Sites web et pages de conversion",
              value: "Des sites premium, rapides et optimisés SEO pour mieux présenter l’offre et inspirer confiance dès la première visite.",
            },
            {
              label: "Portails et outils métier",
              value: "Des portails clients, tableaux de bord, systèmes de devis et parcours internes construits autour de vos opérations.",
            },
            {
              label: "Automatisation et IA utiles",
              value: "Des relances, assistants et workflows intelligents qui accélèrent l’exécution sans ajouter de complexité inutile.",
            },
          ],
          boardLabel: "aperçu des services",
          boardTitle: "Ce que teChia peut concevoir, construire et mettre en ligne.",
          boardDescription:
            "Chaque solution est pensée pour soutenir la visibilité, la conversion, la coordination interne et la qualité d’exécution au quotidien.",
          railTitle: "Solutions les plus demandées",
          railItems: [
            {
              icon: Globe2,
              title: "Sites web premium",
              text: "Sites d’entreprise, pages services et pages de conversion conçus pour rassurer et convaincre.",
            },
            {
              icon: Workflow,
              title: "Portails et dashboards",
              text: "Espaces clients, tableaux de bord d’administration et outils internes plus simples à piloter.",
            },
            {
              icon: Gauge,
              title: "Devis, réservation, capture",
              text: "Des formulaires, demandes de devis et parcours de réservation mieux structurés et plus faciles à traiter.",
            },
            {
              icon: Bot,
              title: "Automatisation et IA",
              text: "Des workflows et assistants qui améliorent les délais de réponse et retirent les tâches répétitives.",
            },
          ],
          stats: [
            { label: "Web", value: "Sites premium" },
            { label: "Ops", value: "Systèmes métier" },
            { label: "Auto", value: "Automatisation" },
          ],
          footerLabel: "Solutions digitales prêtes pour le lancement",
          liveMapLabel: "Carte des offres",
          activeLabel: "Disponible",
          coreLabel: "offre teChia",
          coreBody:
            "Un seul partenaire pour le site web, les portails, les dashboards, l’automatisation et les outils IA adaptés au métier.",
        }
      : {
          eyebrow: "What teChia offers",
          title:
            "Premium websites, portals, business systems, automation, and AI tools for serious businesses.",
          description:
            "teChia designs and builds digital products that strengthen credibility, structure customer inquiries, organize operations, and reduce manual work with tools shaped around how the business actually runs.",
          pillars: [
            {
              label: "Websites and landing pages",
              value: "Premium, fast, SEO-ready websites and conversion pages that help serious businesses look credible from the first visit.",
            },
            {
              label: "Portals and business tools",
              value: "Client portals, dashboards, quote systems, and internal workflows built around your real operations.",
            },
            {
              label: "Automation and AI support",
              value: "Follow-up flows, assistants, and smart automations that save time without creating unnecessary complexity.",
            },
          ],
          boardLabel: "service overview",
          boardTitle: "What teChia can design, build, and launch.",
          boardDescription:
            "Each solution is planned to support visibility, conversion, internal coordination, and day-to-day delivery quality.",
          railTitle: "Most requested solutions",
          railItems: [
            {
              icon: Globe2,
              title: "Premium websites",
              text: "Company websites, service pages, and landing pages designed to reassure, explain, and convert.",
            },
            {
              icon: Workflow,
              title: "Portals and dashboards",
              text: "Client portals, admin dashboards, and internal tools that make information easier to manage.",
            },
            {
              icon: Gauge,
              title: "Quotes, booking, and intake",
              text: "Structured inquiry forms, quote flows, and booking journeys that reduce back-and-forth.",
            },
            {
              icon: Bot,
              title: "Automation and AI",
              text: "Workflows and assistants that speed up response times and remove repetitive operational tasks.",
            },
          ],
          stats: [
            { label: "Web", value: "Premium sites" },
            { label: "Ops", value: "Business tools" },
            { label: "Scale", value: "Automation" },
          ],
          footerLabel: "Launch-ready digital solutions",
          liveMapLabel: "Offer map",
          activeLabel: "Available",
          coreLabel: "teChia offer",
          coreBody:
            "One partner for website design, portals, dashboards, automation workflows, and AI-assisted business tools.",
        };

  return (
    <section id="homepage-trust-strip" className="container py-8 sm:py-10">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2.25rem] border border-cyan-300/12 bg-[linear-gradient(180deg,#050B16_0%,#091525_100%)] p-5 shadow-[0_36px_110px_rgba(2,6,23,0.46)] md:p-7 xl:p-9">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_26%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.12),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(245,185,66,0.08),transparent_26%)]" />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]"
          />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/55 to-transparent" />

          <div className="relative z-10 grid gap-8 xl:grid-cols-[0.82fr_1.18fr] xl:items-start">
            <div className="max-w-[38rem]">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-300/10 px-3.5 py-2 text-center text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-cyan-100 sm:text-[0.68rem] sm:tracking-[0.28em]">
                  <Activity className="size-3.5" />
                  {copy.eyebrow}
                </span>
                <span className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-center text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-slate-200 sm:text-[0.68rem] sm:tracking-[0.28em]">
                  <ShieldCheck className="size-3.5 text-cyan-300" />
                  {copy.footerLabel}
                </span>
              </div>

              <h2 className="mt-5 max-w-[13ch] text-balance text-[clamp(2.35rem,5vw,4.6rem)] font-semibold tracking-[-0.05em] text-white">
                <span className="bg-[linear-gradient(135deg,#F8FAFC_0%,#67E8F9_38%,#93C5FD_58%,#F5B942_100%)] bg-clip-text text-transparent">
                  {copy.title}
                </span>
              </h2>

              <div
                className="mt-6 h-px w-32 bg-gradient-to-r from-cyan-300 via-sky-400 to-transparent shadow-[0_0_28px_rgba(34,211,238,0.32)]"
                aria-hidden="true"
              />

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                {copy.description}
              </p>

              <div className="mt-7 grid gap-3">
                {copy.pillars.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={reduceMotion ? undefined : { opacity: 0, x: -16 }}
                    whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={
                      reduceMotion
                        ? undefined
                        : {
                            duration: 0.52,
                            delay: 0.08 + index * 0.08,
                            ease: [0.16, 1, 0.3, 1],
                          }
                    }
                    className="rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] px-4 py-4 backdrop-blur-xl"
                  >
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-cyan-200 sm:text-[0.68rem] sm:tracking-[0.28em]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-200">
                      {item.value}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/12 bg-[linear-gradient(180deg,rgba(8,16,30,0.96),rgba(7,14,26,0.92))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_90px_rgba(2,6,23,0.34)] md:p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(59,130,246,0.08),transparent_20%)]" />
              <div className="relative z-10">
                <div className="flex flex-col items-start justify-between gap-3 min-[480px]:flex-row">
                  <div>
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-cyan-200 sm:text-[0.68rem] sm:tracking-[0.28em]">
                      {copy.boardLabel}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
                      {copy.boardTitle}
                    </h3>
                  </div>
                  <div className="grid w-full grid-cols-2 gap-2 min-[480px]:w-auto min-[480px]:grid-cols-3">
                    {copy.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="min-w-0 rounded-[1rem] border border-white/10 bg-white/[0.05] px-3 py-2 text-center"
                      >
                        <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-cyan-200 sm:text-[0.6rem] sm:tracking-[0.24em]">
                          {stat.label}
                        </p>
                        <p className="mt-1 text-xs leading-5 font-semibold text-white sm:text-sm">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                  {copy.boardDescription}
                </p>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                  <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-cyan-200 sm:text-[0.68rem] sm:tracking-[0.28em]">
                      {copy.railTitle}
                    </p>
                    <div className="mt-4 grid gap-3">
                      {copy.railItems.map((item, index) => {
                        const Icon = item.icon;

                        return (
                          <motion.div
                            key={item.title}
                            initial={
                              reduceMotion
                                ? undefined
                                : { opacity: 0, y: 14 }
                            }
                            whileInView={
                              reduceMotion
                                ? undefined
                                : { opacity: 1, y: 0 }
                            }
                            viewport={{ once: true, amount: 0.35 }}
                            transition={
                              reduceMotion
                                ? undefined
                                : {
                                    duration: 0.5,
                                    delay: 0.1 + index * 0.07,
                                    ease: [0.16, 1, 0.3, 1],
                                  }
                            }
                            className="panel-safe rounded-[1.2rem] border border-white/8 bg-[#0B1525] px-4 py-3"
                          >
                            <div className="panel-safe flex items-start gap-3">
                              <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                                <Icon className="size-[18px]" />
                              </span>
                              <div className="panel-safe">
                                <p className="break-safe text-sm font-semibold text-white">
                                  {item.title}
                                </p>
                                <p className="break-safe mt-1 text-sm leading-6 text-slate-300">
                                  {item.text}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-cyan-300/12 bg-[linear-gradient(180deg,rgba(10,22,40,0.96),rgba(8,15,28,0.96))] p-4">
                    <div className="rounded-[1.25rem] border border-white/10 bg-[#07111F] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-cyan-200 sm:text-[0.68rem] sm:tracking-[0.28em]">
                          {copy.liveMapLabel}
                        </p>
                        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-cyan-100 sm:text-[0.65rem] sm:tracking-[0.22em]">
                          {copy.activeLabel}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3">
                        {copy.railItems.slice(0, 3).map((item, index) => (
                          <div
                            key={item.title}
                            className="panel-safe rounded-[1rem] border border-white/8 bg-[linear-gradient(90deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-3 py-3"
                          >
                            <div className="panel-safe flex items-center gap-3">
                              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-cyan-300/14 text-[0.68rem] font-semibold text-cyan-100">
                                0{index + 1}
                              </span>
                              <div className="panel-safe">
                                <p className="break-safe text-sm font-semibold text-white">
                                  {item.title}
                                </p>
                                <p className="break-safe mt-1 text-xs leading-5 text-slate-300">
                                  {item.text}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 rounded-[1rem] border border-dashed border-cyan-300/18 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_58%)] px-4 py-5 text-center">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-cyan-200 sm:text-[0.68rem] sm:tracking-[0.32em]">
                          {copy.coreLabel}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-200 text-balance">
                          {copy.coreBody}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-2 backdrop-blur-xl">
                  <InfiniteMarquee
                    items={marqueeItems}
                    speed="34s"
                    className="py-1"
                    itemClassName="!border-white/10 !bg-[#091525] !text-slate-100 shadow-[0_12px_28px_rgba(2,6,23,0.2)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
