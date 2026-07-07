"use client";

import { trackCourseEvent } from "@/lib/analytics/courseEvents";
import type { CourseFaqItem, CoursePack } from "@/lib/courses/coursePacks";

export function CourseFaq({
  items,
  sourcePage,
  pack,
}: {
  items: CourseFaqItem[];
  sourcePage: string;
  pack?: Pick<CoursePack, "id" | "slug" | "title">;
}) {
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-[1.45rem] border border-border bg-surface p-5"
          onToggle={(event) => {
            if (!(event.currentTarget as HTMLDetailsElement).open) return;
            trackCourseEvent("faq_opened", {
              pack_id: pack?.id,
              pack_slug: pack?.slug,
              pack_title: pack?.title,
              source_page: sourcePage,
              faq_question: item.question,
            });
          }}
        >
          <summary className="cursor-pointer list-none text-lg font-semibold text-primary">
            {item.question}
          </summary>
          <p className="mt-4 text-sm leading-7 text-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
