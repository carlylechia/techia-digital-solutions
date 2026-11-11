import Link from "next/link";
import { CheckCircle2, PlaySquare, Signal } from "lucide-react";
import { CourseCheckoutButton } from "@/components/courses/CourseCheckoutButton";
import { CourseMetaTile } from "@/components/courses/CourseMetaTile";
import type { StorefrontCourse } from "@/lib/courses/catalog-service";
import { getCheckoutHints } from "@/lib/payments/providers";
import { formatMoney } from "@/lib/payments/money";
import type { Locale } from "@/content/site";

export function CourseCard({
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
        }
      : {
          view: "View course",
          buy: "Buy now",
          lessons: "lessons",
          level: "Level",
          price: "Price",
          inFullPack: "In full pack",
          priceSoon: "Price coming soon",
        };
  const hints = getCheckoutHints();

  return (
    <article className="group flex h-full flex-col rounded-[1.6rem] border border-border bg-surface p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-[0_24px_50px_-28px_rgba(8,145,178,0.45)]">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-500/90">
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

      <div className="mt-5 grid grid-cols-2 gap-2.5">
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
        <div className="flex items-baseline justify-between gap-3 border-t border-border/70 pt-4">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted">
            {copy.price}
          </span>
          {course.priceMinor ? (
            <span className="text-lg font-bold text-primary">
              {formatMoney(course.priceMinor, course.currency, locale)}
            </span>
          ) : (
            <span className="text-sm font-medium text-muted">
              {copy.priceSoon}
            </span>
          )}
        </div>

        <div className="mt-3.5 flex flex-nowrap gap-2.5">
          <Link
            href={course.path}
            className="btn-secondary min-w-0 flex-1 whitespace-nowrap px-4 py-2.5 text-sm"
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
            className="min-w-0 flex-1 px-4 py-2.5 text-sm"
          />
        </div>
      </div>
    </article>
  );
}
