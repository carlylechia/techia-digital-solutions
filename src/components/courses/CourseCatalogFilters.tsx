"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Locale } from "@/content/site";

type CategoryOption = { slug: string; name: string };

export function CourseCatalogFilters({
  locale,
  categories,
  mode,
}: {
  locale: Locale;
  categories: CategoryOption[];
  mode: "courses" | "packs";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQuery);
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);

  // Adjust the controlled input when the URL changes from outside the input
  // (clear button, browser back/forward, or another filter control).
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setQuery(urlQuery);
  }

  const copy =
    locale === "fr"
      ? {
          search: mode === "packs" ? "Rechercher un pack" : "Rechercher un cours",
          placeholder:
            mode === "packs"
              ? "Titre, compétence, contenu du pack..."
              : "Titre, compétence, catégorie...",
          category: "Catégorie",
          all: "Toutes",
          sort: "Trier",
          recommended: "Recommandés",
          alpha: "Alphabétique",
          low: "Prix : croissant",
          high: "Prix : décroissant",
          clear: "Effacer",
          clearLabel: "Effacer la recherche et tous les filtres",
        }
      : {
          search: mode === "packs" ? "Search packs" : "Search courses",
          placeholder:
            mode === "packs"
              ? "Title, skill, pack content..."
              : "Title, skill, category...",
          category: "Category",
          all: "All",
          sort: "Sort",
          recommended: "Featured",
          alpha: "Alphabetical",
          low: "Price: low to high",
          high: "Price: high to low",
          clear: "Clear",
          clearLabel: "Clear search and all filters",
        };

  // Debounce search input so typing stays responsive.
  useEffect(() => {
    if (query === urlQuery) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) params.set("q", query.trim());
      else params.delete("q");
      router.replace(`${pathname}?${params.toString()}#catalog`, {
        scroll: false,
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [query, urlQuery, pathname, router, searchParams]);

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}#catalog`, {
      scroll: false,
    });
  }

  const hasFilters = useMemo(
    () =>
      Boolean(
        searchParams.get("q") ||
          searchParams.get("category") ||
          searchParams.get("sort"),
      ),
    [searchParams],
  );

  function clearFilters() {
    // Reset the controlled input immediately so it cannot re-add the old query
    // through the debounced effect, then remove every filter from the URL.
    setQuery("");
    const params = new URLSearchParams();
    const view = searchParams.get("view");
    if (view) params.set("view", view);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}#catalog`, { scroll: false });
  }

  return (
    <div
      className={`grid gap-4 rounded-[1.5rem] border border-border bg-background/70 p-4 sm:p-5 ${
        mode === "packs"
          ? "lg:grid-cols-[1fr_auto] lg:items-end"
          : "lg:grid-cols-[1.3fr_0.7fr_0.7fr_auto] lg:items-end"
      }`}
    >
      <label className="grid gap-2 text-sm font-medium text-primary">
        {copy.search}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={copy.placeholder}
          className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-primary outline-none focus:border-cyan-500"
          type="search"
          aria-label={copy.search}
        />
      </label>

      {mode === "courses" ? (
        <>
          <label className="grid gap-2 text-sm font-medium text-primary">
            {copy.category}
            <select
              value={searchParams.get("category") || ""}
              onChange={(e) => update("category", e.target.value)}
              className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-primary outline-none focus:border-cyan-500"
            >
              <option value="">{copy.all}</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-primary">
            {copy.sort}
            <select
              value={searchParams.get("sort") || "recommended"}
              onChange={(e) => update("sort", e.target.value)}
              className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-primary outline-none focus:border-cyan-500"
            >
              <option value="recommended">{copy.recommended}</option>
              <option value="title">{copy.alpha}</option>
              <option value="price-asc">{copy.low}</option>
              <option value="price-desc">{copy.high}</option>
            </select>
          </label>
        </>
      ) : null}

      <button
        type="button"
        onClick={clearFilters}
        disabled={!hasFilters}
        aria-label={copy.clearLabel}
        className="btn-secondary justify-center px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {copy.clear}
      </button>
    </div>
  );
}
