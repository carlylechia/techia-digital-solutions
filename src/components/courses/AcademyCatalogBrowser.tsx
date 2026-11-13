"use client";

import {
  useDeferredValue,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowDownUp,
  BookOpen,
  Package,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AcademyCatalogItem = {
  id: string;
  title: string;
  slug: string;
  status: string;
  position: number;
  effectivePriceMinor: number | null;
  courseCount: number;
  updatedAt: string;
  searchText: string;
  content: ReactNode;
};

type View = "courses" | "packs";
type StatusFilter = "ALL" | "PUBLISHED" | "DRAFT" | "ARCHIVED";
type Sort =
  | "position"
  | "title"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "courses";

const SORT_LABELS: Record<Sort, string> = {
  position: "Catalog order",
  title: "Title A–Z",
  newest: "Recently updated",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  courses: "Most courses",
};

function normalise(value: string) {
  return value.toLowerCase().normalize("NFKD");
}

function matches(item: AcademyCatalogItem, terms: string[]) {
  if (!terms.length) return true;
  const haystack = normalise(item.searchText);
  return terms.every((term) => haystack.includes(term));
}

function compare(a: AcademyCatalogItem, b: AcademyCatalogItem, sort: Sort) {
  switch (sort) {
    case "title":
      return a.title.localeCompare(b.title);
    case "newest":
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    case "price-asc":
      return (
        (a.effectivePriceMinor ?? Number.MAX_SAFE_INTEGER) -
        (b.effectivePriceMinor ?? Number.MAX_SAFE_INTEGER)
      );
    case "price-desc":
      return (
        (b.effectivePriceMinor ?? -1) - (a.effectivePriceMinor ?? -1)
      );
    case "courses":
      return b.courseCount - a.courseCount || a.title.localeCompare(b.title);
    case "position":
    default:
      return a.position - b.position || a.title.localeCompare(b.title);
  }
}

/**
 * Courses and packs live in separate tabbed views so the catalog stays usable
 * as it grows. Search, status filtering, and sorting happen client-side without
 * losing the server-rendered edit forms (passed in as React nodes).
 */
export function AcademyCatalogBrowser({
  courses,
  packs,
  coursesActions,
  packsActions,
}: {
  courses: AcademyCatalogItem[];
  packs: AcademyCatalogItem[];
  coursesActions?: ReactNode;
  packsActions?: ReactNode;
}) {
  const [view, setView] = useState<View>("courses");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<Sort>("position");
  const deferredQuery = useDeferredValue(query);

  const terms = useMemo(
    () =>
      normalise(deferredQuery)
        .split(/\s+/)
        .map((term) => term.trim())
        .filter(Boolean),
    [deferredQuery],
  );

  const filteredCourses = useMemo(
    () =>
      courses
        .filter((item) => status === "ALL" || item.status === status)
        .filter((item) => matches(item, terms))
        .sort((a, b) => compare(a, b, sort)),
    [courses, sort, status, terms],
  );

  const filteredPacks = useMemo(
    () =>
      packs
        .filter((item) => status === "ALL" || item.status === status)
        .filter((item) => matches(item, terms))
        .sort((a, b) => compare(a, b, sort)),
    [packs, sort, status, terms],
  );

  const activeItems = view === "courses" ? courses : packs;
  const filtered = view === "courses" ? filteredCourses : filteredPacks;

  const hasFilters =
    Boolean(query.trim()) || status !== "ALL" || sort !== "position";
  const noun = view === "courses" ? "course" : "pack";

  function switchView(next: View) {
    setView(next);
    setQuery("");
    setStatus("ALL");
    setSort("position");
  }

  function clearFilters() {
    setQuery("");
    setStatus("ALL");
    setSort("position");
  }

  function renderEmptyState(itemNoun: "course" | "pack") {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-border bg-surface p-8 text-center sm:p-10">
        <p className="text-sm font-semibold text-primary">
          No {itemNoun}s match these filters.
        </p>
        <p className="mt-2 text-sm text-muted">
          Try a different search term or clear the filters.
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="btn-secondary mt-4"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div
        role="tablist"
        aria-label="Academy catalog views"
        className="grid gap-2 rounded-[1.5rem] border border-border bg-surface/70 p-2 sm:grid-cols-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === "courses"}
          onClick={() => switchView("courses")}
          className={cn(
            "flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left transition",
            view === "courses"
              ? "bg-accent text-slate-950 shadow-[0_18px_40px_-26px_rgba(6,182,212,0.9)]"
              : "text-muted hover:bg-surface-strong/60 hover:text-primary",
          )}
        >
          <span className="flex items-center gap-2.5 text-sm font-semibold">
            <BookOpen className="size-4" /> Courses
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-bold",
              view === "courses" ? "bg-slate-950/15" : "bg-surface-strong",
            )}
          >
            {courses.length}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "packs"}
          onClick={() => switchView("packs")}
          className={cn(
            "flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left transition",
            view === "packs"
              ? "bg-accent text-slate-950 shadow-[0_18px_40px_-26px_rgba(6,182,212,0.9)]"
              : "text-muted hover:bg-surface-strong/60 hover:text-primary",
          )}
        >
          <span className="flex items-center gap-2.5 text-sm font-semibold">
            <Package className="size-4" /> Packs
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-bold",
              view === "packs" ? "bg-slate-950/15" : "bg-surface-strong",
            )}
          >
            {packs.length}
          </span>
        </button>
      </div>

      <div className="grid gap-4 rounded-[1.5rem] border border-border bg-background/70 p-4 sm:p-5">
        <div hidden={view !== "courses"}>{coursesActions}</div>
        <div hidden={view !== "packs"}>{packsActions}</div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)_minmax(0,0.7fr)_auto] lg:items-end">
          <label className="grid min-w-0 gap-2 text-sm font-medium text-primary">
            Search {view}
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  view === "courses"
                    ? "Title, slug, category, skill…"
                    : "Title, slug, included course…"
                }
                className="w-full rounded-xl border border-border bg-surface py-3 pl-9 pr-3 text-sm text-primary outline-none transition placeholder:text-muted/70 focus:border-accent/60 focus:ring-2 focus:ring-accent/25"
                aria-label={`Search ${view}`}
              />
            </span>
          </label>

          <label className="grid min-w-0 gap-2 text-sm font-medium text-primary">
            Status
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as StatusFilter)
              }
              className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-primary outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/25"
            >
              <option value="ALL">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>

          <label className="grid min-w-0 gap-2 text-sm font-medium text-primary">
            Sort
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-primary outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/25"
            >
              {(Object.keys(SORT_LABELS) as Sort[])
                .filter((option) => view === "packs" || option !== "courses")
                .map((option) => (
                  <option key={option} value={option}>
                    {SORT_LABELS[option]}
                  </option>
                ))}
            </select>
          </label>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="btn-secondary inline-flex items-center justify-center gap-2 px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="size-4" /> Clear
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <p aria-live="polite">
            <SlidersHorizontal className="mr-1.5 inline size-3.5" />
            Showing <strong className="text-primary">{filtered.length}</strong>{" "}
            of {activeItems.length} {activeItems.length === 1 ? noun : `${noun}s`}
            {status !== "ALL" ? ` · ${status.toLowerCase()}` : ""}
          </p>
          <p className="inline-flex items-center gap-1.5">
            <ArrowDownUp className="size-3.5" /> {SORT_LABELS[sort]}
          </p>
        </div>
      </div>

      <div hidden={view !== "courses"} className="grid gap-4">
        {filteredCourses.map((item) => (
          <div key={item.id} className="min-w-0">
            {item.content}
          </div>
        ))}
        {!filteredCourses.length ? renderEmptyState("course") : null}
      </div>

      <div hidden={view !== "packs"} className="grid gap-4">
        {filteredPacks.map((item) => (
          <div key={item.id} className="min-w-0">
            {item.content}
          </div>
        ))}
        {!filteredPacks.length ? renderEmptyState("pack") : null}
      </div>
    </div>
  );
}
