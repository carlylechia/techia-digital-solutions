import Link from "next/link";
import { getLocalizedHref, type Locale } from "@/content/site";
import { cn } from "@/lib/utils";

function resolveHref(locale: Locale, href: string) {
  if (!href.startsWith("/")) return href;
  if (href === `/${locale}` || href.startsWith(`/${locale}/`)) return href;
  return getLocalizedHref(locale, href);
}

export function PremiumPageCta({
  locale,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: {
  locale: Locale;
  eyebrow?: string;
  title: string;
  description?: string;
  primaryAction: { href: string; label: string };
  secondaryAction?: { href: string; label: string };
  className?: string;
}) {
  const primaryHref = resolveHref(locale, primaryAction.href);
  const secondaryHref = secondaryAction?.href
    ? resolveHref(locale, secondaryAction.href)
    : secondaryAction?.href;
  const accentScript =
    locale === "fr" ? "rendons-le iconique" : "let's make it iconic";

  return (
    <section className={cn("container pb-20", className)}>
      <div className="gradient-border rounded-[2.1rem]">
        <div className="elevated-panel relative overflow-hidden px-6 py-10 text-center md:px-10 md:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(251,113,133,0.14),transparent_24%),radial-gradient(circle_at_15%_85%,rgba(245,185,66,0.12),transparent_20%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/60 to-transparent" />
          <div className="relative z-10">
            <span className="font-script text-3xl text-accent-3 md:text-4xl">
              {accentScript}
            </span>
            {eyebrow ? (
              <p className="eyebrow mx-auto mb-3 mt-3 justify-center">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mx-auto mt-2 max-w-4xl text-balance text-5xl font-semibold text-foreground md:text-7xl">
              <span className="headline-gradient">{title}</span>
            </h2>
            <div
              className="headline-underline mx-auto mt-6"
              aria-hidden="true"
            />
            {description ? (
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted md:text-lg">
                {description}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={primaryHref}
                className="btn-primary justify-center px-5 py-3.5"
              >
                {primaryAction.label}
              </Link>
              {secondaryAction && secondaryHref ? (
                <Link
                  href={secondaryHref}
                  className="btn-secondary justify-center px-5 py-3.5"
                >
                  {secondaryAction.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
