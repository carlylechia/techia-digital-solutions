"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Eye, Plus, X } from "lucide-react";
import { saveHomepageBlogPicksAction } from "@/lib/blog/actions";
import type { BlogLocale } from "@/lib/blog/constants";
import { getBlogPostPath } from "@/lib/blog/slug";

export type HomepagePickOption = {
  id: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  readingTime: number;
  categoryName: string;
};

export function HomepagePicksManager({
  locale,
  options,
  limit,
  initialPicks,
}: {
  locale: BlogLocale;
  options: HomepagePickOption[];
  limit: number;
  initialPicks: string[];
}) {
  const [picks, setPicks] = useState<string[]>(initialPicks);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const byId = new Map(options.map((option) => [option.id, option]));
  const available = options.filter((option) => !picks.includes(option.id));
  const isFull = picks.length >= limit;
  const picked = picks.map((id) => byId.get(id)).filter((option): option is HomepagePickOption => Boolean(option));

  function move(index: number, direction: -1 | 1) {
    setMessage(null);
    setPicks((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData();
    data.set("locale", locale);
    picks.forEach((id) => data.append("pickIds", id));
    startTransition(async () => {
      const result = await saveHomepageBlogPicksAction(data);
      setMessage({ tone: result.ok ? "ok" : "error", text: result.ok ? result.message : result.error });
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <input type="hidden" name="locale" value={locale} />
      {picks.map((id) => (
        <input key={id} type="hidden" name="pickIds" value={id} />
      ))}

      <section className="premium-card overflow-hidden">
        <div className="border-b border-border p-5 sm:p-6">
          <p className="eyebrow">Homepage featured insights</p>
          <h2 className="mt-2 text-xl font-semibold text-primary">
            Current lineup ({picks.length}/{limit})
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            These articles appear in this order in the reading section of the homepage. Leave every slot empty to fall back to the most
            recent published articles.
          </p>
        </div>
        {picked.length ? (
          <div className="divide-y divide-border">
            {picked.map((option, index) => (
              <div key={option.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">Position {index + 1}</p>
                  <p className="mt-1 font-semibold text-primary">{option.title}</p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {option.categoryName || "Uncategorised"} · {option.readingTime} min read
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || isPending}
                    aria-label={`Move ${option.title} up`}
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => move(index, 1)}
                    disabled={index === picked.length - 1 || isPending}
                    aria-label={`Move ${option.title} down`}
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setMessage(null);
                      setPicks((current) => current.filter((id) => id !== option.id));
                    }}
                    disabled={isPending}
                    aria-label={`Remove ${option.title} from the homepage`}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-muted">
            No article is promoted yet. The homepage shows the most recent published articles until you choose one.
          </div>
        )}
      </section>

      <section className="premium-card overflow-hidden">
        <div className="border-b border-border p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-primary">Published articles</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {isFull ? `The lineup is full. Remove a slot to add another article.` : `Choose up to ${limit} articles for this language.`}
          </p>
        </div>
        {available.length ? (
          <div className="divide-y divide-border">
            {available.map((option) => (
              <div key={option.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="font-semibold text-primary">{option.title}</p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {option.categoryName || "Uncategorised"} · {option.readingTime} min read
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={getBlogPostPath(locale, option.slug)}
                    className="btn-secondary"
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Preview ${option.title}`}
                  >
                    <Eye className="size-4" />
                  </Link>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={isFull || isPending}
                    onClick={() => {
                      setMessage(null);
                      setPicks((current) => [...current, option.id]);
                    }}
                    aria-label={`Add ${option.title} to the homepage`}
                  >
                    <Plus className="size-4" />Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-muted">
            {options.length ? "Every published article is already in the lineup." : `No published ${locale === "fr" ? "French" : "English"} article to promote yet.`}
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button className="btn-primary" type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save homepage lineup"}
        </button>
        {message ? (
          <p className={`text-sm ${message.tone === "ok" ? "text-accent" : "text-red-500"}`} role="status">
            {message.text}
          </p>
        ) : null}
      </div>
    </form>
  );
}
