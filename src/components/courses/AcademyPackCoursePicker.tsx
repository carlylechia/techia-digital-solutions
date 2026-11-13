"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ListOrdered, Plus, X } from "lucide-react";
import { academyHintClass } from "@/components/courses/academy-form-styles";

export type AcademyPackCourseOption = {
  id: string;
  title: string;
  slug: string;
  status: string;
};

/**
 * Ordered course picker for a pack.
 *
 * The dropdown only receives PUBLISHED courses from the server, so an
 * administrator can never add a draft or archived course to a pack. Courses
 * already in the pack stay visible (and removable) even if their status later
 * changes, so editing a pack never silently drops content.
 */
export function AcademyPackCoursePicker({
  courses,
  initialCourseIds,
}: {
  courses: AcademyPackCourseOption[];
  initialCourseIds: string[];
}) {
  const [selectedIds, setSelectedIds] = useState(initialCourseIds);
  const [choice, setChoice] = useState("");

  const byId = new Map(courses.map((course) => [course.id, course]));
  const selectedCourses = selectedIds
    .map((id) => byId.get(id))
    .filter((course): course is AcademyPackCourseOption => Boolean(course));
  const publishedCourses = courses.filter(
    (course) => course.status === "PUBLISHED",
  );
  const availableCourses = publishedCourses.filter(
    (course) => !selectedIds.includes(course.id),
  );

  function addCourse() {
    if (!choice || selectedIds.includes(choice)) return;
    setSelectedIds((current) => [...current, choice]);
    setChoice("");
  }

  function move(index: number, direction: -1 | 1) {
    setSelectedIds((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeCourse(id: string) {
    setSelectedIds((current) => current.filter((courseId) => courseId !== id));
  }

  return (
    <div className="grid gap-4">
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="courseIds" value={id} />
      ))}

      <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="grid min-w-0 gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
          Add a published course
          <select
            value={choice}
            onChange={(event) => setChoice(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-primary outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/25"
            aria-label="Published course"
          >
            <option value="">
              {availableCourses.length
                ? "Choose a published course…"
                : publishedCourses.length
                  ? "Every published course is already in this pack"
                  : "No published courses available"}
            </option>
            {availableCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title} · /{course.slug}
              </option>
            ))}
          </select>
          <span className={academyHintClass}>
            Only PUBLISHED courses can be added. Drafts and archived courses are
            excluded.
          </span>
        </label>
        <button
          type="button"
          onClick={addCourse}
          disabled={!choice}
          className="btn-secondary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-4" /> Add course
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <ListOrdered className="size-4 text-accent" />
            Courses in this pack
            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-bold text-muted">
              {selectedCourses.length}
            </span>
          </p>
          <p className="text-xs text-muted">
            The order below is the order shown on the storefront.
          </p>
        </div>

        {selectedCourses.length ? (
          <ul className="divide-y divide-border">
            {selectedCourses.map((course, index) => {
              const isPublished = course.status === "PUBLISHED";
              return (
                <li
                  key={course.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-border bg-background text-xs font-bold text-muted">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-primary">
                        {course.title}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span className="truncate">/{course.slug}</span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${
                            isPublished
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                          }`}
                        >
                          {isPublished ? "PUBLISHED" : course.status}
                        </span>
                        {!isPublished ? (
                          <span className="text-amber-300">
                            Not addable to new packs — kept until you remove it.
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${course.title} up`}
                      className="btn-secondary px-2.5 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === selectedCourses.length - 1}
                      aria-label={`Move ${course.title} down`}
                      className="btn-secondary px-2.5 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCourse(course.id)}
                      aria-label={`Remove ${course.title} from this pack`}
                      className="btn-secondary px-2.5 py-2 text-red-300 hover:border-red-500/40"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-4 py-6 text-sm text-muted">
            This pack has no courses yet. Add at least one published course above.
          </p>
        )}
      </div>
    </div>
  );
}
