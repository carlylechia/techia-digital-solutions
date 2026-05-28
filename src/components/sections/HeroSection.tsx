"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Globe2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { buttonVariants } from "@/components/site/button";
import {
  getDictionary,
  getLocalizedHref,
  getLocalizedSectionHref,
  mergedPageAnchors,
  type Locale,
} from "@/content/site";
import { cn } from "@/lib/utils";

const HERO_IMAGE_PATH =
  "/images/hero/futuristic-cityscape-with-tech-dashboard.png";
const HERO_MIN_HEIGHT = "max(760px, calc(100svh - 5rem))";

const contentVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
} as const;

const fadeUpVariants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.56,
      ease: [0.16, 1, 0.3, 1],
    },
  },
} as const;

const headingVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.09,
    },
  },
} as const;

const headingLineVariants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.62,
      ease: [0.16, 1, 0.3, 1],
    },
  },
} as const;

const heroSupportLine = {
  en: "Trusted digital systems for ambitious businesses in Africa, Europe, and global markets.",
  fr: "Des systèmes digitaux de confiance pour les entreprises ambitieuses en Afrique, en Europe et sur les marchés internationaux.",
} as const satisfies Record<Locale, string>;

const heroScrollLabel = {
  en: "Scroll",
  fr: "Défiler",
} as const satisfies Record<Locale, string>;

const heroScriptTagline = {
  en: "where elegance meets execution",
  fr: "l’élégance au service de l’exécution",
} as const satisfies Record<Locale, string>;

const heroLines = {
  en: {
    first: "Digital homes for",
    second: "modern businesses.",
  },
  fr: {
    first: "Maisons digitales pour",
    second: "entreprises modernes.",
  },
} as const satisfies Record<Locale, { first: string; second: string }>;

const floatingSignals = {
  en: [
    {
      title: "AI-ready systems",
      description:
        "Premium digital architecture built for intelligent workflows.",
    },
    {
      title: "Automation-first",
      description:
        "Reduce manual work with sharper operations and clearer visibility.",
    },
  ],
  fr: [
    {
      title: "Systèmes prêts pour l’IA",
      description:
        "Une architecture digitale premium pensée pour des workflows intelligents.",
    },
    {
      title: "Automatisation d’abord",
      description:
        "Réduisez le travail manuel avec des opérations plus claires et plus fluides.",
    },
  ],
} as const satisfies Record<
  Locale,
  ReadonlyArray<{ title: string; description: string }>
>;

export function HeroSection({ locale = "en" }: { locale?: Locale }) {
  const reduceMotion = useReducedMotion();
  const motionState = reduceMotion
    ? { initial: false }
    : { initial: false, animate: "show" as const };
  const dict = getDictionary(locale);
  const lines = heroLines[locale];
  const signals = floatingSignals[locale];
  const serviceBadges = dict.hero.trust.slice(0, 5);

  return (
    <section
      aria-labelledby="homepage-hero-heading"
      className="relative isolate overflow-hidden bg-[#040812]"
      style={{ minHeight: HERO_MIN_HEIGHT }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_80%_16%,rgba(251,113,133,0.18),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(245,185,66,0.15),transparent_28%),linear-gradient(180deg,#040812_0%,#081424_100%)]" />

      <Image
        src={HERO_IMAGE_PATH}
        alt=""
        aria-hidden="true"
        fill
        priority
        quality={92}
        sizes="100vw"
        className="object-cover object-[68%_center] md:object-center"
      />

      <div
        className="absolute inset-0"
        style={{ background: "rgba(4, 8, 18, 0.68)" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(4, 8, 18, 0.95), rgba(8, 20, 36, 0.72), rgba(4, 8, 18, 0.12))",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, #040812 0%, rgba(4, 8, 18, 0.42) 38%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 25% 35%, rgba(34, 211, 238, 0.16), transparent 35%), radial-gradient(circle at 70% 50%, rgba(251, 113, 133, 0.12), transparent 35%)",
        }}
      />
      <div
        className="absolute inset-0 sm:hidden"
        style={{
          background:
            "linear-gradient(to bottom, rgba(5, 7, 13, 0.88), rgba(5, 7, 13, 0.52) 34%, transparent 76%), linear-gradient(to right, rgba(5, 7, 13, 0.96) 0%, rgba(5, 7, 13, 0.78) 54%, rgba(5, 7, 13, 0.24) 100%)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_76%)]"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div
        className="container relative flex items-center py-14 sm:py-20"
        style={{ minHeight: HERO_MIN_HEIGHT }}
      >
        <motion.div
          className="w-full max-w-[46rem] text-center lg:max-w-[45rem] lg:text-left"
          variants={reduceMotion ? undefined : contentVariants}
          {...motionState}
        >
          <motion.p
            variants={reduceMotion ? undefined : fadeUpVariants}
            className="font-script text-[clamp(2.4rem,4vw,3.8rem)] text-[#FDBA74]"
          >
            {heroScriptTagline[locale]}
          </motion.p>

          <motion.div
            variants={reduceMotion ? undefined : fadeUpVariants}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[#CFFAFE] shadow-[0_18px_50px_rgba(5,7,13,0.18)] backdrop-blur-xl"
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-[#22D3EE] shadow-[0_0_18px_rgba(34,211,238,0.7)]"
            />
            {dict.hero.eyebrow}
          </motion.div>

          <motion.h1
            id="homepage-hero-heading"
            className="mx-auto mt-6 max-w-[12ch] text-[clamp(3.25rem,8vw,6.4rem)] font-semibold leading-[0.92] tracking-[-0.06em] text-white sm:max-w-[13ch] md:max-w-none lg:mx-0"
            variants={reduceMotion ? undefined : headingVariants}
          >
            <motion.span
              variants={reduceMotion ? undefined : headingLineVariants}
              className="block md:whitespace-nowrap"
            >
              <span className="bg-[linear-gradient(135deg,#F8FAFC_0%,#22D3EE_42%,#FB7185_78%,#F5B942_100%)] bg-clip-text text-transparent">
                {lines.first}
              </span>
            </motion.span>
            <motion.span
              variants={reduceMotion ? undefined : headingLineVariants}
              className="mt-1 block text-[#F8FAFC] md:whitespace-nowrap"
            >
              {lines.second}
            </motion.span>
          </motion.h1>

          <motion.div
            variants={reduceMotion ? undefined : fadeUpVariants}
            className="headline-underline mx-auto mt-6 lg:mx-0"
            aria-hidden="true"
          />

          <motion.p
            variants={reduceMotion ? undefined : fadeUpVariants}
            className="mx-auto mt-6 max-w-[39rem] text-pretty text-base leading-8 text-[#CBD5E1] sm:text-lg md:text-xl lg:mx-0"
          >
            {dict.hero.description}
          </motion.p>

          <motion.div
            variants={reduceMotion ? undefined : fadeUpVariants}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-start"
          >
            <Link
              href={getLocalizedHref(locale, "/start-project")}
              aria-label="Start your digital project with teChia Digital Solutions"
              className={cn(
                buttonVariants({ variant: "primary", size: "lg" }),
                "group relative w-full overflow-hidden border border-white/18 px-6 py-4 text-[0.98rem] text-white shadow-[0_24px_64px_rgba(37,99,235,0.24)] sm:w-auto",
                "bg-[linear-gradient(135deg,#2563EB_0%,#22D3EE_42%,#FB7185_72%,#F5B942_100%)]",
                "before:absolute before:inset-y-0 before:left-[-35%] before:w-[42%] before:skew-x-[-22deg] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)] before:opacity-0 before:transition before:duration-500",
                "hover:border-white/28 hover:shadow-[0_28px_70px_rgba(34,211,238,0.28)] hover:before:left-[118%] hover:before:opacity-100 focus-visible:border-white/30 focus-visible:before:left-[118%] focus-visible:before:opacity-100",
              )}
              data-event="start_project_click"
            >
              {dict.common.startProject}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            <Link
              href={getLocalizedSectionHref(
                locale,
                "/services",
                mergedPageAnchors.services.solutions,
              )}
              aria-label="Explore teChia Digital Solutions services and solutions"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "w-full border border-cyan-300/28 bg-white/[0.07] px-6 py-4 text-[0.98rem] text-[#F8FAFC] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:w-auto",
                "hover:border-cyan-300/58 hover:bg-white/[0.12] hover:text-white focus-visible:border-cyan-300/70 focus-visible:bg-white/[0.12]",
              )}
            >
              {dict.common.exploreSolutions}
            </Link>
          </motion.div>

          <motion.div
            variants={reduceMotion ? undefined : fadeUpVariants}
            className="mt-5 flex items-center justify-center gap-3 text-left text-sm leading-6 text-[#CBD5E1] lg:justify-start"
          >
            <Globe2
              aria-hidden="true"
              className="size-4 shrink-0 text-[#2DD4BF]"
            />
            <p className="m-0 max-w-[42rem]">{heroSupportLine[locale]}</p>
          </motion.div>

          <motion.ul
            variants={reduceMotion ? undefined : fadeUpVariants}
            className="mt-7 flex flex-wrap justify-center gap-2.5 lg:justify-start"
            aria-label="teChia Digital Solutions services"
          >
            {serviceBadges.map((badge) => (
              <li
                key={badge}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3.5 py-2.5 text-sm font-medium text-[#E2E8F0] shadow-[0_18px_34px_rgba(5,7,13,0.12)] backdrop-blur-xl"
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-[#22D3EE]"
                />
                {badge}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <div className="pointer-events-none absolute right-4 bottom-28 hidden xl:block">
          <div className="grid w-[18rem] gap-3">
            {signals.map((signal, index) => (
              <motion.div
                key={signal.title}
                className="rounded-[1.5rem] border border-white/12 bg-[linear-gradient(180deg,rgba(10,18,34,0.78),rgba(10,18,34,0.56))] p-4 text-left shadow-[0_28px_70px_rgba(5,7,13,0.26)] backdrop-blur-xl"
                initial={reduceMotion ? undefined : { opacity: 0, x: 18 }}
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        opacity: 1,
                        x: 0,
                        y: [0, index === 0 ? -8 : -12, 0],
                      }
                }
                transition={
                  reduceMotion
                    ? undefined
                    : {
                        opacity: { duration: 0.55, delay: 0.34 + index * 0.12 },
                        x: {
                          duration: 0.55,
                          delay: 0.34 + index * 0.12,
                          ease: [0.16, 1, 0.3, 1],
                        },
                        y: {
                          duration: 7 + index,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatType: "mirror",
                          ease: "easeInOut",
                          delay: index * 0.35,
                        },
                      }
                }
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#CFFAFE]"
                  >
                    0{index + 1}
                  </span>
                  <div>
                    <p className="m-0 text-sm font-semibold tracking-[0.01em] text-white">
                      {signal.title}
                    </p>
                    <p className="m-0 mt-1 text-sm leading-6 text-[#CBD5E1]">
                      {signal.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
          initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={
            reduceMotion ? undefined : { duration: 0.48, delay: 0.62 }
          }
        >
          <Link
            href="#homepage-trust-strip"
            aria-label="Scroll to explore more of the teChia Digital Solutions homepage"
            className="group inline-flex flex-col items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#CBD5E1]/88"
          >
            <span>{heroScrollLabel[locale]}</span>
            <span className="flex h-11 w-7 items-start justify-center rounded-full border border-white/16 bg-white/[0.06] p-1.5 shadow-[0_16px_30px_rgba(5,7,13,0.16)] backdrop-blur-md">
              <motion.span
                className="block size-2 rounded-full bg-[#22D3EE]"
                animate={reduceMotion ? undefined : { y: [0, 12, 0] }}
                transition={
                  reduceMotion
                    ? undefined
                    : {
                        duration: 1.6,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }
                }
              />
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
