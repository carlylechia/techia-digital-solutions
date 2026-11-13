import Link from "next/link";
import { CheckCircle2, PlaySquare, Signal } from "lucide-react";
import { CourseCheckoutButton } from "@/components/courses/CourseCheckoutButton";
import { CourseMetaTile } from "@/components/courses/CourseMetaTile";
import type { StorefrontCourse } from "@/lib/courses/catalog-service";
import { getCheckoutHints } from "@/lib/payments/providers";
import { formatMoney } from "@/lib/payments/money";
import type { Locale } from "@/content/site";

export async function CourseCard({
  course,
  locale,
  sourcePage,
}: {
  course: StorefrontCourse;
  locale: Locale;
  sourcePage: string;
}) {
  const copy =
    locale === "fr"
      ? {
          view: "Voir le cours",
          buy: "Acheter",
          lessons: "leçons",
          level: "Niveau",
          price: "Prix",
          inFullPack: "Dans le pack complet",
          priceSoon: "Prix à venir",
          save: "Économisez",
        }
      : {
          view: "View course",
          buy: "Buy now",
          lessons: "lessons",
          level: "Level",
          price: "Price",
          inFullPack: "In full pack",
          priceSoon: "Price coming soon",
          save: "Save",
        };
  const hints = await getCheckoutHints();
  const compareAtPriceMinor =
    course.compareAtPriceMinor &&
    course.priceMinor &&
    course.compareAtPriceMinor > course.priceMinor
      ? course.compareAtPriceMinor
      : null;
  const savingsPercent =
    compareAtPriceMinor && course.priceMinor
      ? Math.round(
          ((compareAtPriceMinor - course.priceMinor) / compareAtPriceMinor) * 100,
        )
      : null;

  return (
    <article className="group flex h-full min-w-0 max-w-full flex-col rounded-[1.6rem] border border-border bg-surface p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-[0_24px_50px_-28px_rgba(8,145,178,0.45)]">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <p className="line-clamp-2 min-w-[8rem] flex-1 break-words text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-500/90 min-[480px]:text-xs min-[480px]:tracking-[0.18em]">
          {course.category?.name}
        </p>
        {course.includedInFullPack ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 dark:border-cyan-400/25 dark:bg-cyan-400/10 dark:text-cyan-400">
            <CheckCircle2 className="size-3.5 shrink-0" />
            {copy.inFullPack}
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 line-clamp-2 text-xl font-semibold leading-snug text-primary sm:text-[1.35rem]">
        {course.title}
      </h3>

      <p className="mt-2.5 line-clamp-3 text-sm leading-6 text-muted">
        {course.shortDescription}
      </p>

      <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <CourseMetaTile
          icon={<Signal className="size-4" />}
          label={copy.level}
          value={course.levelLabel}
        />
        <CourseMetaTile
          icon={<PlaySquare className="size-4" />}
          label={copy.lessons}
          value={String(course.lessons.length)}
        />
      </div>

      <div className="mt-auto pt-5">
        <div className="flex items-end justify-between gap-3 border-t border-border/70 pt-4">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted">
            {copy.price}
          </span>
          <div className="shrink-0 text-right">
            {compareAtPriceMinor && savingsPercent ? (
              <span className="block text-[11px] font-medium text-muted">
                <span className="line-through">
                  {formatMoney(compareAtPriceMinor, course.currency, locale)}
                </span>{" "}
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {copy.save} {savingsPercent}%
                </span>
              </span>
            ) : null}
            {course.priceMinor ? (
              <span className="block text-lg font-bold text-primary">
                {formatMoney(course.priceMinor, course.currency, locale)}
              </span>
            ) : (
              <span className="text-sm font-medium text-muted">
                {copy.priceSoon}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3.5 flex flex-col gap-2.5 min-[360px]:flex-row">
          <Link
            href={course.path}
            className="btn-secondary w-full min-w-0 flex-1 whitespace-nowrap px-4 py-2.5 text-sm min-[360px]:w-auto"
          >
            <span className="min-w-0 truncate">{copy.view}</span>
          </Link>
          <CourseCheckoutButton
            pack={{
              id: course.id,
              slug: course.slug,
              title: course.title,
              checkoutUrl: null,
              priceMinor: course.priceMinor,
              priceCurrency: course.currency,
            }}
            itemType="course"
            label={copy.buy}
            sourcePage={sourcePage}
            showPrice={false}
            hints={hints}
            chariowProductId={course.chariowProductId}
            className="min-w-0 flex-1 px-4 py-2.5 text-sm min-[360px]:w-auto"
          />
        </div>
      </div>
    </article>
  );
}
