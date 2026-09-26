"use client";

import { useState, useTransition } from "react";
import { deactivateBlogCategoryAction, saveBlogCategoryAction } from "@/lib/blog/actions";
import type { BlogLocale } from "@/lib/blog/constants";

type Category = { id: string; name: string; slug: string; description: string; locale: BlogLocale; seoTitle: string; seoDescription: string; isActive: boolean; posts: number };

type Copy = {
  newCategory: string;
  newCategoryTitle: string;
  name: string;
  slug: string;
  language: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  active: string;
  create: string;
  edit: string;
  save: string;
  cancel: string;
  deactivate: string;
  saving: string;
  inactive: string;
  unassigned: string;
  summary: (category: Category) => string;
};

const copy: Record<BlogLocale, Copy> = {
  en: {
    newCategory: "New category",
    newCategoryTitle: "Add a focused topic",
    name: "Name",
    slug: "Slug",
    language: "Language",
    description: "Description",
    seoTitle: "SEO title",
    seoDescription: "SEO description",
    active: "Active",
    create: "Create category",
    edit: "Edit",
    save: "Save category",
    cancel: "Cancel",
    deactivate: "Deactivate",
    saving: "Saving…",
    inactive: "Inactive",
    unassigned: "Uncategorised",
    summary: (count) => `/${count.slug} · ${count.posts} articles · ${count.isActive ? "Active" : "Inactive"}`,
  },
  fr: {
    newCategory: "Nouvelle catégorie",
    newCategoryTitle: "Ajouter un thème ciblé",
    name: "Nom",
    slug: "Identifiant d'URL",
    language: "Langue",
    description: "Description",
    seoTitle: "Titre SEO",
    seoDescription: "Description SEO",
    active: "Active",
    create: "Créer la catégorie",
    edit: "Modifier",
    save: "Enregistrer la catégorie",
    cancel: "Annuler",
    deactivate: "Désactiver",
    saving: "Enregistrement…",
    inactive: "Inactive",
    unassigned: "Sans catégorie",
    summary: (count) => `/${count.slug} · ${count.posts} articles · ${count.isActive ? "Active" : "Inactive"}`,
  },
};

export function CategoryManager({ locale, categories }: { locale: BlogLocale; categories: Category[] }) {
  const t = copy[locale];
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  function submit(event: React.FormEvent<HTMLFormElement>, id?: string) { event.preventDefault(); const data = new FormData(event.currentTarget); if (id) data.set("id", id); startTransition(async () => { const result = await saveBlogCategoryAction(data); setMessage(result.ok ? result.message : result.error); if (result.ok) event.currentTarget.reset(); }); }
  return <div className="grid gap-6"><form onSubmit={(event) => submit(event)} className="premium-card grid gap-4 p-5 sm:p-6"><div><p className="eyebrow">{t.newCategory}</p><h2 className="mt-2 text-xl font-semibold text-primary">{t.newCategoryTitle}</h2></div><div className="grid gap-4 md:grid-cols-3"><label className="form-label">{t.name}<input className="form-input" name="name" required /></label><label className="form-label">{t.slug}<input className="form-input" name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="transformation-digitale" /></label><label className="form-label">{t.language}<input type="hidden" name="locale" value={locale} /><input className="form-input" value={locale === "fr" ? "Français" : "English"} disabled /></label></div><label className="form-label">{t.description}<textarea className="form-input min-h-24" name="description" /></label><div className="grid gap-4 md:grid-cols-2"><label className="form-label">{t.seoTitle}<input className="form-input" name="seoTitle" maxLength={70} /></label><label className="form-label">{t.seoDescription}<input className="form-input" name="seoDescription" maxLength={180} /></label></div><label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="isActive" defaultChecked />{t.active}</label><button className="btn-primary justify-start" type="submit" disabled={isPending}>{isPending ? t.saving : t.create}</button>{message ? <p className="text-sm text-accent" role="status">{message}</p> : null}</form><div className="grid gap-4">{categories.map((category) => <CategoryRow key={category.id} category={category} t={t} localeLabel={locale === "fr" ? "Français" : "English"} onSubmit={submit} isPending={isPending} />)}</div></div>;
}

function CategoryRow({ category, t, localeLabel, onSubmit, isPending }: { category: Category; t: Copy; localeLabel: string; onSubmit: (event: React.FormEvent<HTMLFormElement>, id?: string) => void; isPending: boolean }) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState("");
  if (!editing) return <div className="premium-card flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-semibold text-primary">{category.name}</p><p className="mt-1 text-xs text-muted">{t.summary(category)}</p></div><div className="flex gap-2"><button type="button" className="btn-secondary" onClick={() => setEditing(true)}>{t.edit}</button>{category.isActive ? <form action={async (formData: FormData) => { const result = await deactivateBlogCategoryAction(formData); setStatus(result.ok ? result.message : result.error); }}><input type="hidden" name="id" value={category.id} /><button className="btn-secondary" type="submit" disabled={isPending}>{t.deactivate}</button></form> : <span className="self-center text-xs text-muted">{t.inactive}</span>}</div>{status ? <p className="w-full text-xs text-accent">{status}</p> : null}</div>;
  return <form onSubmit={(event) => onSubmit(event, category.id)} className="premium-card grid gap-4 p-5 sm:p-6"><div className="flex items-center justify-between"><h3 className="font-semibold text-primary">{t.edit} — {category.name}</h3><button type="button" className="text-sm text-muted hover:text-primary" onClick={() => setEditing(false)}>{t.cancel}</button></div><div className="grid gap-4 md:grid-cols-3"><label className="form-label">{t.name}<input className="form-input" name="name" defaultValue={category.name} required /></label><label className="form-label">{t.slug}<input className="form-input" name="slug" defaultValue={category.slug} required /></label><label className="form-label">{t.language}<input type="hidden" name="locale" value={category.locale} /><input className="form-input" value={localeLabel} disabled /></label></div><label className="form-label">{t.description}<textarea className="form-input min-h-24" name="description" defaultValue={category.description || ""} /></label><div className="grid gap-4 md:grid-cols-2"><label className="form-label">{t.seoTitle}<input className="form-input" name="seoTitle" defaultValue={category.seoTitle || ""} maxLength={70} /></label><label className="form-label">{t.seoDescription}<input className="form-input" name="seoDescription" defaultValue={category.seoDescription || ""} maxLength={180} /></label></div><label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="isActive" defaultChecked={category.isActive} />{t.active}</label><button className="btn-primary justify-start" type="submit" disabled={isPending}>{t.save}</button></form>;
}
