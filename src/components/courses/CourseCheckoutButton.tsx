"use client";

import { CourseTrackedAnchor } from "@/components/courses/course-analytics";
import type { CoursePack } from "@/lib/courses/coursePacks";
import { cn } from "@/lib/utils";

export function CourseCheckoutButton({
  pack,
  label,
  sourcePage,
  className,
}: {
  pack: Pick<CoursePack, "id" | "slug" | "title" | "checkoutUrl">;
  label: string;
  sourcePage: string;
  className?: string;
}) {
  if (!pack.checkoutUrl) {
    return (
      <span
        aria-disabled="true"
        className={cn(
          "inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-border bg-surface px-5 py-3 text-center text-sm font-medium text-muted dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400 sm:w-auto",
          className,
        )}
      >
        Checkout link coming soon
      </span>
    );
  }

  return (
    <CourseTrackedAnchor
      href={pack.checkoutUrl}
      target="_blank"
      rel="noreferrer"
      eventName="chariow_checkout_click"
      eventParams={{
        pack_id: pack.id,
        pack_slug: pack.slug,
        pack_title: pack.title,
        source_page: sourcePage,
      }}
      className={cn(
        "btn-primary w-full justify-center px-5 py-3 sm:w-auto",
        className,
      )}
    >
      {label}
    </CourseTrackedAnchor>
  );
}
