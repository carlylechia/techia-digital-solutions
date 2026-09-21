import { CourseTrackedLink } from "@/components/courses/course-analytics";
import { CourseCheckoutButton } from "@/components/courses/CourseCheckoutButton";
import type { CoursePack } from "@/lib/courses/coursePacks";
import { cn } from "@/lib/utils";

export function CoursePackCard({
  pack,
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
  sourcePage: string;
  emphasize?: boolean;
  audienceLabel: string;
  levelLabel: string;
  courseLabelSingular: string;
  courseLabelPlural: string;
  detailLabel: string;
  checkoutLabel: string;
}) {
  return (
    <article
      className={cn("rounded-[1.65rem]", emphasize && "gradient-border p-px")}
    >
      <div
        className={cn(
          "h-full rounded-[1.6rem] border border-border bg-surface p-5",
          emphasize && "elevated-panel border-transparent",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-500/90">
              {pack.category}
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-primary">
              {pack.title}
            </h3>
          </div>
          {pack.badge ? (
            <span className="trust-pill whitespace-nowrap">{pack.badge}</span>
          ) : null}
        </div>

        <p className="mt-4 text-sm leading-7 text-muted">{pack.summary}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="trust-pill">{levelLabel}</span>
          {pack.courseCount ? (
            <span className="trust-pill">
              {pack.courseCount}{" "}
              {pack.courseCount === 1 ? courseLabelSingular : courseLabelPlural}
            </span>
          ) : null}
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {audienceLabel}
          </p>
          <ul className="mt-3 grid gap-2 text-sm leading-7 text-primary">
            {pack.bestFor.slice(0, 3).map((item) => (
              <li
                key={item}
                className="rounded-[1rem] border border-border bg-background/70 px-3 py-2"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <CourseTrackedLink
            href={pack.path}
            eventName="course_pack_click"
            eventParams={{
              pack_id: pack.id,
              pack_slug: pack.slug,
              pack_title: pack.title,
              source_page: sourcePage,
            }}
            className="btn-secondary justify-center px-4 py-3"
          >
            {detailLabel}
          </CourseTrackedLink>
          <CourseCheckoutButton
            pack={pack}
            label={checkoutLabel}
            sourcePage={sourcePage}
          />
        </div>
      </div>
    </article>
  );
}
