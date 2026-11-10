import Link from "next/link";
import { CourseCheckoutButton } from "@/components/courses/CourseCheckoutButton";
import type { StorefrontCourse } from "@/lib/courses/catalog-service";
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
          inFullPack: "Inclus dans le pack complet",
          priceSoon: "Prix à venir",
        }
      : {
          view: "View course",
          buy: "Buy now",
          lessons: "lessons",
          inFullPack: "Included in full pack",
          priceSoon: "Price coming soon",
        };

  return (
    <article className="h-full rounded-[1.6rem] border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          {course.category ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-500/90">
              {course.category.name}
            </p>
          ) : null}
          <h3 className="mt-3 text-xl font-semibold text-primary sm:text-2xl">
            {course.title}
          </h3>
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-muted">{course.shortDescription}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="trust-pill">{course.levelLabel}</span>
        <span className="trust-pill">
          {course.lessons.length} {copy.lessons}
        </span>
        {course.includedInFullPack ? (
          <span className="trust-pill">{copy.inFullPack}</span>
        ) : null}
      </div>

      <div className="mt-5 text-lg font-semibold text-primary">
        {course.priceMinor ? (
          formatMoney(course.priceMinor, course.currency, locale)
        ) : (
          <span className="text-sm font-medium text-muted">{copy.priceSoon}</span>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href={course.path} className="btn-secondary justify-center px-4 py-3">
          {copy.view}
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
        />
      </div>
    </article>
  );
}
