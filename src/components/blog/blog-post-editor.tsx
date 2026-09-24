"use client";

import Link from "next/link";
import { AlertCircle, Check, Eye, Save, Send, Settings2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { BlogLocale, BlogPostStatusValue } from "@/lib/blog/constants";
import { createBlogPostAction, deleteBlogPostAction, saveBlogPostAction, transitionBlogPostAction, type BlogActionResult } from "@/lib/blog/actions";
import { RichTextEditor } from "./rich-text-editor";
import { normalizeRichTextSource } from "@/lib/blog/rich-text";
import { BlogMediaUploader } from "./blog-media-uploader";

type EditorPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  locale: BlogLocale;
  status: BlogPostStatusValue;
  version: number;
  categoryId: string | null;
  authorId: string | null;
  translationGroupId: string;
  tagIds: string[];
  relatedPostIds: string[];
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  featuredImageUrl: string;
  featuredImagePublicId: string;
  featuredImageAlt: string;
  ogImageUrl: string;
  ogImagePublicId: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaHref: string;
  ctaLabel: string;
  featured: boolean;
  allowIndex: boolean;
  nofollow: boolean;
  scheduledAt: string;
  publishedAt: string;
  authorName: string;
  reviewNotes: Array<{ id: string; body: string; createdAt: string; authorName: string }>;
  revisions: Array<{ id: string; version: number; title: string; createdAt: string; authorName: string }>;
};

type Option = { id: string; name: string; slug?: string; displayName?: string; userId?: string | null; isActive?: boolean };
type EditorIssue = { field: string; message: string; severity: "error" | "warning" };
type StatusMessage = { kind: "success" | "error"; text: string; issues?: EditorIssue[] };

const issueLabels: Record<string, string> = {
  authorId: "Author",
  categoryId: "Category",
  content: "Article content",
  featuredImageUrl: "Featured image",
  featuredImageAlt: "Featured image alt text",
  seoTitle: "SEO title",
  seoDescription: "Meta description",
  title: "Title",
};

const issueAnchors: Record<string, string> = {
  authorId: "editor-author",
  categoryId: "editor-category",
  content: "editor-content",
  featuredImageUrl: "editor-featured-image",
  featuredImageAlt: "editor-featured-image-alt",
  title: "editor-title",
};

function valueOf(result: BlogActionResult) {
  return result.ok ? result.message : result.error;
}

function issueLabel(field: string) {
  return issueLabels[field] || field;
}

function IssueList({ issues }: { issues: EditorIssue[] }) {
  return <ul className="mt-2 grid gap-2 pl-4">{issues.map((issue, index) => <li key={`${issue.field}-${index}`}><strong>{issueLabel(issue.field)}:</strong> {issue.message}{issueAnchors[issue.field] ? <a href={`#${issueAnchors[issue.field]}`} className="ml-1 font-semibold underline underline-offset-2">Open field</a> : null}</li>)}</ul>;
}

export function BlogPostEditor({
  locale,
  post,
  categories,
  tags,
  authors,
  canManage,
  canPublish,
  isNew = false,
  previewBase,
}: {
  locale: BlogLocale;
  post: EditorPost;
  categories: Option[];
  tags: Option[];
  authors: Option[];
  canManage: boolean;
  canPublish: boolean;
  isNew?: boolean;
  previewBase?: string;
}) {
  const [form, setForm] = useState(post);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved" | "failed">("saved");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const skipNextAutosave = useRef(true);
  const latestRequest = useRef(0);
  const lastAutosaveSignature = useRef<string | null>(null);

  const editable = canManage || form.status === "DRAFT" || form.status === "CHANGES_REQUESTED";
  const wordCount = useMemo(() => normalizeRichTextSource(form.content).replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length, [form.content]);
  const autosaveSignature = useMemo(() => JSON.stringify({ ...form, version: undefined, status: undefined, reviewNotes: undefined }), [form]);
  const seoTitleLength = (form.seoTitle || form.title).length;
  const seoDescriptionLength = (form.seoDescription || form.excerpt).length;
  const blockingIssues = statusMessage?.issues?.filter((issue) => issue.severity === "error") || [];
  const recommendationIssues = statusMessage?.issues?.filter((issue) => issue.severity === "warning") || [];

  useEffect(() => {
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    if (isNew || !editable || !form.id || lastAutosaveSignature.current === autosaveSignature) return;
    lastAutosaveSignature.current = autosaveSignature;
    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      const requestId = ++latestRequest.current;
      const data = new FormData(formRef.current || undefined);
      data.set("id", form.id);
      data.set("content", form.content);
      data.set("version", String(form.version));
      try {
        const response = await fetch(`/api/editorial/posts/${encodeURIComponent(form.id)}`, { method: "PATCH", body: data, credentials: "same-origin" });
        const result = (await response.json()) as { ok: boolean; version?: number; error?: string };
        if (requestId !== latestRequest.current) return;
        if (!response.ok || !result.ok) {
          setSaveState("failed");
          setStatusMessage({ kind: "error", text: result.error || "Save failed. Reload before trying again." });
          return;
        }
        if (result.version) setForm((current) => ({ ...current, version: result.version as number }));
        setSaveState("saved");
      } catch {
        if (requestId === latestRequest.current) {
          setSaveState("failed");
          setStatusMessage({ kind: "error", text: "Save failed. Check your connection and try again." });
        }
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [autosaveSignature, editable, form.content, form.id, form.version, isNew]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (saveState === "unsaved" || saveState === "saving") event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [saveState]);

  function update<K extends keyof EditorPost>(key: K, value: EditorPost[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaveState("unsaved");
  }

  function updateSlug(value: string) {
    const next = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    update("slug", next);
  }

  function buildFormData() {
    const data = new FormData(formRef.current || undefined);
    data.set("id", form.id);
    data.set("content", form.content);
    data.set("version", String(form.version));
    return data;
  }

  async function saveDraft(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setSaveState("saving");
    setStatusMessage(null);
    const data = buildFormData();
    const result = isNew ? await createBlogPostAction(data) : await saveBlogPostAction(data);
    if (!result.ok) {
      setSaveState("failed");
      setStatusMessage({ kind: "error", text: valueOf(result), issues: result.issues });
      return;
    }
    if (isNew && result.ok && result.id) {
      window.location.assign(canManage ? `/${locale}/admin/blog/posts/${result.id}` : `/${locale}/writer/posts/${result.id}`);
      return;
    }
    if (result.version) setForm((current) => ({ ...current, version: result.version as number }));
    setSaveState("saved");
    setStatusMessage({ kind: "success", text: result.message, issues: result.issues });
  }

  function deleteDraft() {
    if (!canManage || !window.confirm("Delete this unpublished draft permanently? Published and archived articles must be archived instead.")) return;
    const data = new FormData();
    data.set("id", form.id);
    startTransition(async () => {
      const result = await deleteBlogPostAction(data);
      if (result.ok) window.location.assign(`/${locale}/admin/blog/posts`);
      else setStatusMessage({ kind: "error", text: result.error, issues: result.issues });
    });
  }

  function transition(action: "SUBMIT" | "PUBLISH" | "SCHEDULE" | "REQUEST_CHANGES" | "ARCHIVE" | "RESTORE" | "RETURN_TO_DRAFT", note = "", scheduledAt = "") {
    if (saveState !== "saved") {
      setStatusMessage({ kind: "error", text: "Wait for the latest changes to finish saving before changing publication status." });
      return;
    }
    const data = new FormData();
    data.set("postId", form.id);
    data.set("version", String(form.version));
    data.set("action", action);
    if (note) data.set("reviewNote", note);
    if (scheduledAt) data.set("scheduledAt", scheduledAt);
    startTransition(async () => {
      const result = await transitionBlogPostAction(data);
      if (!result.ok) {
        setStatusMessage({ kind: "error", text: result.error, issues: result.issues });
        return;
      }
      if (result.version) setForm((current) => ({ ...current, version: result.version as number, status: action === "SUBMIT" ? "IN_REVIEW" : action === "PUBLISH" ? "PUBLISHED" : action === "SCHEDULE" ? "SCHEDULED" : action === "REQUEST_CHANGES" ? "CHANGES_REQUESTED" : action === "ARCHIVE" ? "ARCHIVED" : "DRAFT" }));
      setStatusMessage({ kind: "success", text: result.message, issues: result.issues });
      setSaveState("saved");
    });
  }

  const inputClass = "form-input";
  return (
    <form ref={formRef} onSubmit={saveDraft} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <input type="hidden" name="id" value={form.id} />
      <input type="hidden" name="locale" value={form.locale} />
      <input type="hidden" name="version" value={form.version} />
      <div className="grid gap-6">
        <section className="premium-card grid gap-5 p-5 sm:p-7" aria-labelledby="editor-basics-title">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Article editor</p><h2 id="editor-basics-title" className="mt-2 text-2xl font-semibold text-primary">Story foundations</h2></div><span className="status-pill">{form.status.replaceAll("_", " ")}</span></div>
          <label className="form-label">Title<input id="editor-title" className={inputClass} name="title" value={form.title} onChange={(event) => update("title", event.target.value)} disabled={!editable} required minLength={5} maxLength={180} /></label>
          <div className="grid gap-5 md:grid-cols-[1fr_15rem]">
            <label className="form-label">URL slug<input className={inputClass} name="slug" value={form.slug} onChange={(event) => updateSlug(event.target.value)} disabled={!editable} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label>
            <label className="form-label">Language<select className={inputClass} name="localeSelect" value={form.locale} onChange={(event) => update("locale", event.target.value as BlogLocale)} disabled={!isNew || !editable}><option value="en">English</option><option value="fr">Français</option></select><input type="hidden" name="locale" value={form.locale} /></label>
          </div>
          <label className="form-label">Excerpt / summary<textarea className={`${inputClass} min-h-28`} name="excerpt" value={form.excerpt} onChange={(event) => update("excerpt", event.target.value)} disabled={!editable} required minLength={30} maxLength={320} /><span className="text-xs text-muted">{form.excerpt.length}/320 · Aim for a clear, useful summary.</span></label>
        </section>

        <section id="editor-content" className="premium-card blog-editor-section grid gap-4 overflow-visible p-5 sm:p-7" aria-labelledby="editor-content-title">
          <div><p className="eyebrow">Long-form content</p><h2 id="editor-content-title" className="mt-2 text-2xl font-semibold text-primary">Build the article</h2><p className="mt-2 text-sm text-muted">Write for the reader. Add clear headings, useful examples, and relevant internal links to teChia services or resources.</p></div>
          <RichTextEditor initialHtml={form.content} onChange={(value) => update("content", value)} disabled={!editable} />
          <div className="flex flex-wrap gap-4 text-xs text-muted"><span>{wordCount} words</span><span>{form.content.length} HTML characters</span><span>Server allowlist sanitization on save</span></div>
        </section>

        <section className="premium-card grid gap-5 p-5 sm:p-7" aria-labelledby="editor-seo-title">
          <div><p className="eyebrow">Search appearance</p><h2 id="editor-seo-title" className="mt-2 text-2xl font-semibold text-primary">SEO controls</h2></div>
          <label className="form-label">SEO title<input className={inputClass} name="seoTitle" value={form.seoTitle} onChange={(event) => update("seoTitle", event.target.value)} disabled={!editable} maxLength={70} /><span className={seoTitleLength > 60 ? "text-xs text-amber-500" : "text-xs text-muted"}>{seoTitleLength}/60 recommended</span></label>
          <label className="form-label">Meta description<textarea className={`${inputClass} min-h-24`} name="seoDescription" value={form.seoDescription} onChange={(event) => update("seoDescription", event.target.value)} disabled={!editable} maxLength={180} /><span className={seoDescriptionLength > 160 ? "text-xs text-amber-500" : "text-xs text-muted"}>{seoDescriptionLength}/160 recommended</span></label>
          <label className="form-label">Focus topic / keyword<input className={inputClass} name="focusKeyword" value={form.focusKeyword} onChange={(event) => update("focusKeyword", event.target.value)} disabled={!editable} maxLength={120} placeholder="A natural topic, not a keyword list" /></label>
          <label className="form-label">Canonical URL <span className="text-xs text-muted">(optional)</span><input className={inputClass} name="canonicalUrl" value={form.canonicalUrl} onChange={(event) => update("canonicalUrl", event.target.value)} disabled={!editable || !canPublish} placeholder="https://techiadigital.com/en/blog/..." /></label>
          {canManage ? <label className="form-label">Translation group ID <span className="text-xs text-muted">(optional; links equivalent language versions)</span><input className={inputClass} name="translationGroupId" value={form.translationGroupId} onChange={(event) => update("translationGroupId", event.target.value)} disabled={!editable} /></label> : null}
        </section>

        <section className="premium-card grid gap-5 p-5 sm:p-7" aria-labelledby="editor-media-title">
          <div><p className="eyebrow">Presentation</p><h2 id="editor-media-title" className="mt-2 text-2xl font-semibold text-primary">Image and conversion</h2></div><BlogMediaUploader onUploaded={(media) => { update("featuredImageUrl", media.url); update("featuredImagePublicId", media.publicId); }} />
          <div className="grid gap-5 md:grid-cols-2">
            <label className="form-label">Featured image URL<input id="editor-featured-image" className={inputClass} name="featuredImageUrl" value={form.featuredImageUrl} onChange={(event) => update("featuredImageUrl", event.target.value)} disabled={!editable} placeholder="https://res.cloudinary.com/..." /></label>
            <label className="form-label">Featured image alt text<input id="editor-featured-image-alt" className={inputClass} name="featuredImageAlt" value={form.featuredImageAlt} onChange={(event) => update("featuredImageAlt", event.target.value)} disabled={!editable} maxLength={300} /></label>
            <label className="form-label">Cloudinary public ID<input className={inputClass} name="featuredImagePublicId" value={form.featuredImagePublicId} onChange={(event) => update("featuredImagePublicId", event.target.value)} disabled={!editable} /></label>
            <label className="form-label">Open Graph image URL<input className={inputClass} name="ogImageUrl" value={form.ogImageUrl} onChange={(event) => update("ogImageUrl", event.target.value)} disabled={!editable} /></label>
          </div>
          <div className="grid gap-5 md:grid-cols-2"><label className="form-label">CTA title<input className={inputClass} name="ctaTitle" value={form.ctaTitle} onChange={(event) => update("ctaTitle", event.target.value)} disabled={!editable} /></label><label className="form-label">CTA label<input className={inputClass} name="ctaLabel" value={form.ctaLabel} onChange={(event) => update("ctaLabel", event.target.value)} disabled={!editable} /></label><label className="form-label md:col-span-2">CTA URL<input className={inputClass} name="ctaHref" value={form.ctaHref} onChange={(event) => update("ctaHref", event.target.value)} disabled={!editable} placeholder="/contact or /services/seo" /></label><label className="form-label md:col-span-2">CTA description<textarea className={`${inputClass} min-h-20`} name="ctaDescription" value={form.ctaDescription} onChange={(event) => update("ctaDescription", event.target.value)} disabled={!editable} /></label></div>
        </section>
      </div>

      <aside className="grid content-start gap-5 xl:sticky xl:top-6">
        <section className="premium-card grid gap-4 p-5" aria-labelledby="editor-publish-title"><div className="flex items-center gap-2"><Settings2 className="size-4 text-accent" /><h2 id="editor-publish-title" className="font-semibold text-primary">Publishing</h2></div><div className="rounded-xl border border-border bg-surface-strong/60 p-3 text-xs leading-5 text-muted">Status: <strong className="text-primary">{form.status.replaceAll("_", " ")}</strong><br />Autosave: <strong className={saveState === "failed" ? "text-red-400" : "text-primary"}>{saveState === "saving" ? "Saving…" : saveState === "unsaved" ? "Unsaved changes" : saveState === "failed" ? "Save failed" : "Saved"}</strong></div><p className="text-[11px] leading-5 text-muted">Only an active author, active category, and unique title are required to publish. Word count, internal links, and featured image details are recommendations.</p>{statusMessage ? <div className={`rounded-xl p-3 text-xs leading-5 ${statusMessage.kind === "error" ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"}`} role={statusMessage.kind === "error" ? "alert" : "status"}><p>{statusMessage.text}</p>{statusMessage.issues?.length ? <div className="mt-3 border-t border-current/20 pt-3">{blockingIssues.length ? <div><p className="font-semibold">Blocking requirements:</p><IssueList issues={blockingIssues} /></div> : null}{recommendationIssues.length ? <div className="mt-3"><p className="font-semibold">Recommendations (these do not block publishing):</p><IssueList issues={recommendationIssues} /></div> : null}</div> : null}</div> : null}<div className="grid gap-2"><button type="submit" className="btn-primary justify-center" disabled={!editable || isPending}><Save className="size-4" />{isPending ? "Saving…" : isNew ? "Create draft" : "Save draft"}</button>{form.id && !isNew ? <Link href={`${previewBase || `/${locale}/admin/blog/preview`}/${form.id}`} className="btn-secondary justify-center" target="_blank"><Eye className="size-4" />Preview</Link> : null}</div>{form.status === "DRAFT" || form.status === "CHANGES_REQUESTED" ? <button type="button" className="btn-secondary justify-center" disabled={!editable || isPending || saveState !== "saved"} onClick={() => transition("SUBMIT")}><Send className="size-4" />Submit for review</button> : null}{canPublish && form.status === "IN_REVIEW" ? <><button type="button" className="btn-primary justify-center" disabled={isPending || saveState !== "saved"} onClick={() => transition("PUBLISH")}><Check className="size-4" />Publish now</button><label className="form-label text-xs">Or schedule<input type="datetime-local" className={inputClass} onChange={(event) => { if (event.target.value) transition("SCHEDULE", "", new Date(event.target.value).toISOString()); }} disabled={isPending} /></label><button type="button" className="btn-secondary justify-center text-amber-300" disabled={isPending} onClick={() => { const note = window.prompt("Review note for the writer"); if (note) transition("REQUEST_CHANGES", note); }}>Request changes</button></> : null}{canPublish && form.status === "PUBLISHED" ? <button type="button" className="btn-secondary justify-center text-amber-300" disabled={isPending || saveState !== "saved"} onClick={() => transition("ARCHIVE")}>Unpublish and archive</button> : null}{canPublish && form.status === "ARCHIVED" ? <button type="button" className="btn-secondary justify-center" disabled={isPending || saveState !== "saved"} onClick={() => transition("RESTORE")}>Restore to draft</button> : null}</section>
        <section className="premium-card grid gap-4 p-5"><h2 className="font-semibold text-primary">Organization</h2>{canManage ? <label className="form-label">Author<select id="editor-author" className={inputClass} name="authorId" value={form.authorId || ""} onChange={(event) => update("authorId", event.target.value)} disabled={!editable}><option value="">Select author</option>{authors.map((author) => <option key={author.id} value={author.id} disabled={author.isActive === false}>{author.displayName}{author.isActive === false ? " (inactive)" : ""}</option>)}</select></label> : <p className="text-sm text-muted">Byline: <strong className="text-primary">{form.authorName}</strong></p>}<label className="form-label">Category<select id="editor-category" className={inputClass} name="categoryId" value={form.categoryId || ""} onChange={(event) => update("categoryId", event.target.value)} disabled={!editable}><option value="">Select category</option>{categories.filter((category) => category.slug || category.name).map((category) => <option key={category.id} value={category.id} disabled={category.isActive === false}>{category.name}{category.isActive === false ? " (inactive)" : ""}</option>)}</select></label><fieldset><legend className="form-label">Tags</legend><div className="grid gap-2">{tags.map((tag) => <label key={tag.id} className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="tagIds" value={tag.id} checked={form.tagIds.includes(tag.id)} onChange={(event) => update("tagIds", event.target.checked ? [...form.tagIds, tag.id] : form.tagIds.filter((id) => id !== tag.id))} disabled={!editable} />{tag.name}</label>)}</div></fieldset>{canManage ? <label className="form-label">Related published article IDs <span className="text-xs text-muted">(comma-separated; optional override)</span><input className={inputClass} name="relatedPostIds" value={form.relatedPostIds.join(", ")} onChange={(event) => update("relatedPostIds", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} disabled={!editable} /></label> : null}</section>
        {canManage ? <section className="premium-card grid gap-3 p-5"><h2 className="font-semibold text-primary">Indexing</h2><label className="flex items-center gap-2 text-sm text-muted"><input type="hidden" name="allowIndex" value="false" /><input type="checkbox" name="allowIndex" value="true" checked={form.allowIndex} onChange={(event) => update("allowIndex", event.target.checked)} disabled={!editable} />Allow search indexing</label><label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="nofollow" value="true" checked={form.nofollow} onChange={(event) => update("nofollow", event.target.checked)} disabled={!editable} />No-follow public links</label><label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="featured" value="true" checked={form.featured} onChange={(event) => update("featured", event.target.checked)} disabled={!editable} />Feature on blog homepage</label></section> : null}
        {form.reviewNotes.length ? <section className="premium-card grid gap-3 p-5"><h2 className="font-semibold text-primary">Review notes</h2>{form.reviewNotes.map((note) => <div key={note.id} className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-muted"><p>{note.body}</p><p className="mt-2 text-[10px] uppercase tracking-wider text-amber-300">{note.authorName} · {new Date(note.createdAt).toLocaleDateString()}</p></div>)}</section> : null}
        {form.revisions.length ? <section className="premium-card grid gap-3 p-5"><h2 className="font-semibold text-primary">Revision checkpoints</h2><p className="text-xs leading-5 text-muted">Autosave protects against overwrites. Checkpoints are retained at workflow transitions.</p>{form.revisions.slice(0, 6).map((revision) => <div key={revision.id} className="flex items-center justify-between gap-3 border-t border-border pt-3 text-xs"><span className="min-w-0 truncate text-primary">v{revision.version} · {revision.title}</span><span className="shrink-0 text-muted">{new Date(revision.createdAt).toLocaleDateString()}</span></div>)}</section> : null}
        {canManage && (form.status === "DRAFT" || form.status === "CHANGES_REQUESTED") ? <button type="button" className="btn-ghost justify-center text-xs text-red-300" onClick={deleteDraft} disabled={isPending}>Delete unpublished draft</button> : null}
        <p className="flex items-start gap-2 px-1 text-xs leading-5 text-muted"><AlertCircle className="mt-0.5 size-4 shrink-0 text-accent" />{canPublish ? "You can publish, schedule, archive, assign another author, or change indexing controls." : "An editorial manager must publish, schedule, archive, assign another author, or change indexing controls."}</p>
      </aside>
    </form>
  );
}
