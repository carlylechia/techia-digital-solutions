"use client";

import Link from "next/link";
import { ArrowRight, MessageCircleMore, Sparkles } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { AnimatedGridBackground } from "@/components/site/animated-grid-background";
import { buttonVariants } from "@/components/site/button";
import { openAIChatWidget } from "@/lib/ai/open-chat";
import { cn } from "@/lib/utils";
import type { Locale } from "@/content/site";

export function AIConsultationSection({
  locale,
  secondaryAction,
  className,
}: {
  locale: Locale;
  secondaryAction: { href: string; label: string };
  className?: string;
}) {
  const copy =
    locale === "fr"
      ? {
          script: "parlons stratégie d’abord",
          eyebrow: "Agent IA",
          title: "Discutez avec l’agent IA pour identifier le bon besoin digital pour votre entreprise.",
          description:
            "Dites-nous ce que votre équipe essaie d’accomplir et obtenez rapidement une orientation claire vers le bon mix entre marketing, branding, web, automatisation, IA ou logiciel métier.",
          points: [
            "Recommandations rapides pour visibilité, branding, web, automatisation ou IA",
            "Aucun formulaire lourd avant d’obtenir une direction utile",
            "Une transition simple vers un devis ou un démarrage de projet",
          ],
          primaryLabel: "Discuter maintenant",
        }
      : {
          script: "start with a sharper question",
          eyebrow: "AI consultant",
          title: "Chat with the AI agent to identify the best digital fit for your business.",
          description:
            "Tell us what your team needs to achieve and get a clear recommendation for the right mix of marketing, branding, web, automation, AI, or business software.",
          points: [
            "Fast guidance on visibility, branding, web, automation, or AI fit",
            "No heavy intake before you get something genuinely useful",
            "A smooth path into a quote or project kickoff",
          ],
          primaryLabel: "Chat now",
        };

  return (
    <Reveal className={cn("container py-16", className)}>
      <div className="gradient-border rounded-[2rem]">
        <div className="elevated-panel relative overflow-hidden p-6 md:p-8">
          <AnimatedGridBackground className="opacity-70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(251,113,133,0.14),transparent_26%),radial-gradient(circle_at_50%_100%,rgba(245,185,66,0.12),transparent_26%)]" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <p className="font-script text-3xl text-accent-3 md:text-4xl">{copy.script}</p>
              <p className="eyebrow mt-3">{copy.eyebrow}</p>
              <h2 className="mt-4 max-w-3xl text-balance text-4xl font-semibold text-foreground md:text-6xl">
                <span className="headline-gradient">{copy.title}</span>
              </h2>
              <div className="headline-underline mt-6" aria-hidden="true" />
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted md:text-lg">{copy.description}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => openAIChatWidget()}
                  className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full justify-center sm:w-auto")}
                >
                  <MessageCircleMore className="size-4" />
                  {copy.primaryLabel}
                  <ArrowRight className="size-4" />
                </button>
                <Link href={secondaryAction.href} className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full justify-center sm:w-auto")}>
                  {secondaryAction.label}
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="trust-pill">
                  <Sparkles className="size-3.5" />
                  {locale === "fr" ? "Conseil instantané" : "Instant guidance"}
                </span>
                <span className="trust-pill">{locale === "fr" ? "Aucun compte" : "No sign-up"}</span>
                <span className="trust-pill">{locale === "fr" ? "Clair et rapide" : "Clear and fast"}</span>
              </div>
            </div>

            <div className="grid gap-3">
              {copy.points.map((point) => (
                <div key={point} className="rounded-[1.4rem] border border-border bg-background/70 p-4 text-sm leading-7 text-muted shadow-sm backdrop-blur">
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
