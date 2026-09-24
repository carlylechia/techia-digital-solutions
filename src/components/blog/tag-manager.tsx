"use client";

import { useState, useTransition } from "react";
import { createBlogTagAction } from "@/lib/blog/actions";
import type { BlogLocale } from "@/lib/blog/constants";

type Tag = { id: string; name: string; slug: string; articles: number };

export function TagManager({ locale, tags }: { locale: BlogLocale; tags: Tag[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return <div className="grid gap-6"><form className="premium-card grid gap-4 p-5 sm:p-6" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(async () => { const result = await createBlogTagAction(data); setMessage(result.ok ? result.message : result.error); }); }}><div><p className="eyebrow">Content organization</p><h2 className="mt-2 text-xl font-semibold text-primary">Create a tag</h2><p className="mt-2 text-sm text-muted">Use tags for internal discovery, not as a thin SEO page strategy.</p></div><div className="grid gap-4 md:grid-cols-3"><label className="form-label">Name<input className="form-input" name="name" required /></label><label className="form-label">Slug<input className="form-input" name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label><label className="form-label">Language<input type="hidden" name="locale" value={locale} /><input className="form-input" value={locale === "fr" ? "Français" : "English"} disabled /></label></div><button className="btn-primary justify-start" type="submit" disabled={pending}>{pending ? "Creating…" : "Create tag"}</button></form><div className="premium-card p-5 sm:p-6"><h2 className="font-semibold text-primary">{tags.length} tags</h2><div className="mt-4 flex flex-wrap gap-2">{tags.map((tag) => <span key={tag.id} className="status-pill">{tag.name} · {tag.articles}</span>)}</div></div>{message ? <p className="rounded-xl bg-accent/10 p-3 text-sm text-accent" role="status">{message}</p> : null}</div>;
}
