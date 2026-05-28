import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatedGridBackground } from "@/components/site/animated-grid-background";
import { getLocalizedHref, type Locale } from "@/content/site";
import { cn } from "@/lib/utils";

type PremiumPageAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

function resolveHref(locale: Locale, href: string) {
  if (!href.startsWith("/")) return href;
  if (href === `/${locale}` || href.startsWith(`/${locale}/`)) return href;
  return getLocalizedHref(locale, href);
}

export function PremiumPageHero({
  locale,
  eyebrow,
  title,
  description,
  badges = [],
  actions = [],
  aside,
  className,
}: {
  locale: Locale;
  eyebrow?: string;
  title: string;
  description?: string;
  badges?: string[];
  actions?: PremiumPageAction[];
  aside?: ReactNode;
  className?: string;
}) {
  const accentScript =
    locale === "fr" ? "conçu pour demain" : "crafted for tomorrow";

  return (
    <section className={cn("container pt-8 pb-8 md:pt-12", className)}>
      <div className="gradient-border rounded-[2.1rem]">
        <div className="elevated-panel relative overflow-hidden px-6 py-9 md:px-10 md:py-12">
          <AnimatedGridBackground className="opacity-80 [mask-image:radial-gradient(circle_at_top_right,black,transparent_82%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_80%_22%,rgba(251,113,133,0.12),transparent_26%),radial-gradient(circle_at_50%_100%,rgba(245,185,66,0.1),transparent_28%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/60 to-transparent" />

          <div
            className={cn(
              "relative z-10 grid gap-8",
              aside ? "lg:grid-cols-[1.08fr_0.92fr] lg:items-start" : "",
            )}
          >
            <div>
              <span className="font-script text-3xl text-accent-3 md:text-4xl">
                {accentScript}
              </span>
              {eyebrow ? <p className="eyebrow mb-4 mt-3">{eyebrow}</p> : null}
              <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[0.94] text-foreground md:text-7xl">
                <span className="headline-gradient">{title}</span>
              </h1>
              <div className="headline-underline mt-6" aria-hidden="true" />
              {description ? (
                <p className="mt-6 max-w-3xl text-pretty text-base leading-8 text-muted md:text-lg">
                  {description}
                </p>
              ) : null}

              {actions.length ? (
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {actions.map((action) => {
                    const href = resolveHref(locale, action.href);

                    return (
                      <Link
                        key={`${action.label}-${action.href}`}
                        href={href}
                        className={cn(
                          action.variant === "secondary"
                            ? "btn-secondary justify-center px-5 py-3"
                            : "btn-primary justify-center px-5 py-3",
                          "w-full sm:w-auto",
                        )}
                      >
                        {action.label}
                        {action.variant === "secondary" ? null : (
                          <ArrowRight className="size-4" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : null}

              {badges.length ? (
                <div className="mt-8 flex flex-wrap gap-2.5">
                  {badges.map((badge, i) => (
                    <span key={`${badge}-${i}`} className="trust-pill">
                      {badge}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {aside ? (
              <div className="relative z-10 rounded-[1.85rem] border border-border bg-white/[0.08] p-1 backdrop-blur-xl dark:bg-white/[0.04]">
                {aside}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
