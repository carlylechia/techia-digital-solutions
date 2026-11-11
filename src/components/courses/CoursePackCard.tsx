import { CheckCircle2, PlaySquare, Signal, Sparkles } from "lucide-react";
import { CourseTrackedLink } from "@/components/courses/course-analytics";
import { CourseCheckoutButton } from "@/components/courses/CourseCheckoutButton";
import { CourseMetaTile } from "@/components/courses/CourseMetaTile";
import type { Locale } from "@/content/site";
import type { CoursePack } from "@/lib/courses/coursePacks";
import { formatMoney } from "@/lib/payments/money";
import { cn } from "@/lib/utils";

export function CoursePackCard({
  pack,
  locale,
  sourcePage,
  emphasize = false,
  audienceLabel,
  levelLabel,
  courseLabelSingular,
  courseLabelPlural,
  detailLabel,
  checkoutLabel,
}: {
  pack: CoursePack;
  locale: Locale;
  sourcePage: string;
  emphasize?: boolean;
  audienceLabel: string;
  levelLabel: string;
  courseLabelSingular: string;
  courseLabelPlural: string;
  detailLabel: string;
  checkoutLabel: string;
}) {
  const copy =
    locale === "fr"
      ? { level: "Niveau", price: "Prix", priceSoon: "Prix à venir" }
      : { level: "Level", price: "Price", priceSoon: "Price coming soon" };
  const priceMinor =
    typeof pack.priceMinor === "number" && pack.priceMinor > 0
      ? pack.priceMinor
      : null;
  const currency = pack.priceCurrency || "XAF";

  return (
    <article
      className={cn("group h-full rounded-[1.65rem]", emphasize && "gradient-border p-px")}
    >
      <div
        className={cn(
          "flex h-full flex-col rounded-[1.6rem] border border-border bg-surface p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-[0_24px_50px_-28px_rgba(8,145,178,0.45)]",
          emphasize && "elevated-panel border-transparent",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-500/90">
            {pack.category}
          </p>
          {pack.badge ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              <Sparkles className="size-3.5 shrink-0" />
              {pack.badge}
            </span>
          ) : null}
        </div>

        <h3 className="mt-3 line-clamp-2 text-2xl font-semibold leading-snug text-primary">
          {pack.title}
        </h3>

        <p className="mt-2.5 line-clamp-3 text-sm leading-6 text-muted">
          {pack.summary}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <CourseMetaTile
            icon={<Signal className="size-4" />}
            label={copy.level}
            value={levelLabel}
          />
          <CourseMetaTile
            icon={<PlaySquare className="size-4" />}
            label={pack.courseCount === 1 ? courseLabelSingular : courseLabelPlural}
            value={String(pack.courseCount ?? 0)}
          />
        </div>

        {pack.bestFor.length ? (
          <div className="mt-5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted">
              {audienceLabel}
            </p>
            <ul className="mt-2.5 space-y-2">
              {pack.bestFor.slice(0, 3).map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-6 text-primary">
                  <CheckCircle2 className="mt-1 size-3.5 shrink-0 text-cyan-700 dark:text-cyan-400" />
                  <span className="line-clamp-2">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-auto pt-5">
          <div className="flex items-baseline justify-between gap-3 border-t border-border/70 pt-4">
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted">
              {copy.price}
            </span>
            {priceMinor ? (
              <span className="text-lg font-bold text-primary">
                {formatMoney(priceMinor, currency, locale)}
              </span>
            ) : (
              <span className="text-sm font-medium text-muted">{copy.priceSoon}</span>
            )}
          </div>

          <div className="mt-3.5 flex flex-nowrap gap-2.5">
            <CourseTrackedLink
              href={pack.path}
              eventName="course_pack_click"
              eventParams={{
                pack_id: pack.id,
                pack_slug: pack.slug,
                pack_title: pack.title,
                source_page: sourcePage,
              }}
              className="btn-secondary min-w-0 flex-1 whitespace-nowrap px-4 py-2.5 text-sm"
            >
              <span className="min-w-0 truncate">{detailLabel}</span>
            </CourseTrackedLink>
            <CourseCheckoutButton
              pack={pack}
              label={checkoutLabel}
              sourcePage={sourcePage}
              showPrice={false}
              className="min-w-0 flex-1 px-4 py-2.5 text-sm"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
