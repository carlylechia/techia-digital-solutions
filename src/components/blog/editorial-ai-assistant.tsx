"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2, Image as ImageIcon, Languages, ClipboardCheck, Check, X } from "lucide-react";
import type { BlogLocale } from "@/lib/blog/constants";
import type {
  EditorialArticlePackage,
  EditorialEditAction,
  EditorialLanguage,
} from "@/lib/ai/editorial-types";
import {
  editorialContentTypeOptions,
  editorialEditActionSchema,
  editorialLanguageOptions,
  editorialToneOptions,
} from "@/lib/ai/editorial-types";

type Props = {
  locale: BlogLocale;
  disabled?: boolean;
  onInsert: (article: EditorialArticlePackage, image?: { url: string; publicId: string; altText: string }) => void;
  hasExistingContent?: boolean;
};

type ImageResult = { url: string; publicId: string; altText: string; width: number; height: number; model: string };

const editActionLabels: Record<EditorialEditAction, string> = {
  improve_clarity: "Improve clarity",
  improve_grammar: "Improve grammar",
  make_natural: "Make more natural",
  make_professional: "Make more professional",
  simplify: "Simplify",
  expand: "Expand",
  shorten: "Shorten",
  remove_repetition: "Remove repetition",
  strengthen_introduction: "Strengthen introduction",
  improve_conclusion: "Improve conclusion",
  make_cta_persuasive: "Make CTA persuasive",
  improve_heading_structure: "Improve heading structure",
  improve_meta_description: "Improve meta description",
  identify_keyword_stuffing: "Identify keyword stuffing",
  identify_missing_topics: "Identify missing topics",
  review_internal_links: "Review internal links",
  seo_checklist: "SEO checklist",
};

export function EditorialAiAssistant({ locale, disabled, onInsert, hasExistingContent }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<EditorialArticlePackage | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageResult, setImageResult] = useState<ImageResult | null>(null);
  const [imagePending, setImagePending] = useState(false);
  const [inserted, setInserted] = useState(false);

  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [language, setLanguage] = useState<EditorialLanguage>(locale === "fr" ? "fr" : "en");
  const [workingTitle, setWorkingTitle] = useState("");
  const [businessObjective, setBusinessObjective] = useState("");
  const [contentType, setContentType] = useState<(typeof editorialContentTypeOptions)[number]>("educational_article");
  const [tone, setTone] = useState<(typeof editorialToneOptions)[number]>("professional");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [secondaryKeywords, setSecondaryKeywords] = useState("");
  const [desiredLength, setDesiredLength] = useState<"short" | "standard" | "long">("standard");
  const [service, setService] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [sourceNotes, setSourceNotes] = useState("");

  const [refineAction, setRefineAction] = useState<EditorialEditAction>("improve_clarity");
  const [refineContent, setRefineContent] = useState("");
  const [refinePending, setRefinePending] = useState(false);
  const [refineResult, setRefineResult] = useState<string | null>(null);
  const [refineNotes, setRefineNotes] = useState<string[]>([]);

  const [translateDirection, setTranslateDirection] = useState<"en_to_fr" | "fr_to_en" | "improve_translation">("en_to_fr");
  const [translateContent, setTranslateContent] = useState("");
  const [translatePending, setTranslatePending] = useState(false);
  const [translateResult, setTranslateResult] = useState<string | null>(null);
  const [translateNotes, setTranslateNotes] = useState<string[]>([]);

  const [reviewContent, setReviewContent] = useState("");
  const [reviewPending, setReviewPending] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<string | null>(null);
  const [reviewIssues, setReviewIssues] = useState<Array<{ category: string; severity: string; message: string; suggestion?: string }>>([]);
  const [reviewChecklist, setReviewChecklist] = useState<string[]>([]);

  async function postJson<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await response.json()) as T & { ok?: boolean; error?: string };
    if (!response.ok || (json as { ok?: boolean }).ok === false) {
      throw new Error((json as { error?: string }).error || "Request failed.");
    }
    return json;
  }

  async function generate() {
    if (!topic.trim() || !audience.trim()) {
      setError("Topic and target audience are required.");
      return;
    }
    setPending("generate");
    setError(null);
    setInserted(false);
    try {
      const result = await postJson<{ ok: true; article: EditorialArticlePackage; model: string }>(
        "/api/editorial/ai/generate",
        {
          topic,
          audience,
          language,
          workingTitle: workingTitle || undefined,
          businessObjective: businessObjective || undefined,
          contentType,
          tone,
          focusKeyword: focusKeyword || undefined,
          secondaryKeywords: secondaryKeywords.split(",").map((s) => s.trim()).filter(Boolean),
          desiredLength,
          service: service || undefined,
          callToAction: callToAction || undefined,
          additionalInstructions: additionalInstructions || undefined,
          sourceNotes: sourceNotes || undefined,
        },
      );
      setArticle(result.article);
      setModel(result.model);
      setImagePrompt(result.article.imagePrompt);
      setImageAlt(result.article.imageAltText);
      setImageResult(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Generation failed.");
    } finally {
      setPending(null);
    }
  }

  async function runImageGeneration() {
    if (!imagePrompt.trim()) {
      setError("Image prompt is required.");
      return;
    }
    setImagePending(true);
    setError(null);
    try {
      const result = await postJson<{ ok: true } & ImageResult>("/api/editorial/ai/image", {
        imagePrompt,
        altText: imageAlt || undefined,
        articleTitle: article?.title,
      });
      setImageResult({
        url: result.url,
        publicId: result.publicId,
        altText: result.altText,
        width: result.width,
        height: result.height,
        model: result.model,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Image generation failed.");
    } finally {
      setImagePending(false);
    }
  }

  async function runRefine() {
    if (!refineContent.trim()) {
      setError("Content to refine is required.");
      return;
    }
    setRefinePending(true);
    setError(null);
    try {
      const result = await postJson<{ ok: true; result: string; notes: string[] }>(
        "/api/editorial/ai/edit",
        {
          action: refineAction,
          language,
          content: refineContent,
          focusKeyword: focusKeyword || undefined,
        },
      );
      setRefineResult(result.result);
      setRefineNotes(result.notes || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Refinement failed.");
    } finally {
      setRefinePending(false);
    }
  }

  async function runTranslate() {
    if (!translateContent.trim()) {
      setError("Content to translate is required.");
      return;
    }
    setTranslatePending(true);
    setError(null);
    try {
      const result = await postJson<{ ok: true; translatedContent: string; notes: string[] }>(
        "/api/editorial/ai/translate",
        {
          direction: translateDirection,
          content: translateContent,
          context: additionalInstructions || undefined,
        },
      );
      setTranslateResult(result.translatedContent);
      setTranslateNotes(result.notes || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Translation failed.");
    } finally {
      setTranslatePending(false);
    }
  }

  async function runReview() {
    if (!reviewContent.trim()) {
      setError("Content to review is required.");
      return;
    }
    setReviewPending(true);
    setError(null);
    try {
      const result = await postJson<{
        ok: true;
        summary: string;
        issues: Array<{ category: string; severity: string; message: string; suggestion?: string }>;
        checklist: string[];
      }>("/api/editorial/ai/review", {
        language,
        content: reviewContent,
        focusKeyword: focusKeyword || undefined,
      });
      setReviewSummary(result.summary);
      setReviewIssues(result.issues || []);
      setReviewChecklist(result.checklist || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Review failed.");
    } finally {
      setReviewPending(false);
    }
  }

  function applyRefineToArticle() {
    if (!refineResult || !article) return;
    setArticle({ ...article, articleContent: refineResult });
    setRefineResult(null);
  }

  function applyTranslateToArticle() {
    if (!translateResult || !article) return;
    setArticle({ ...article, articleContent: translateResult });
    setTranslateResult(null);
  }

  function handleInsert() {
    if (!article) return;
    if (hasExistingContent && !window.confirm("The editor already contains content. Replace it with the generated article?")) return;
    onInsert(article, imageResult ? { url: imageResult.url, publicId: imageResult.publicId, altText: imageResult.altText } : undefined);
    setInserted(true);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-50"
      >
        <Sparkles className="size-3.5" />
        Generate with AI
      </button>
    );
  }

  const inputClass = "form-input text-sm";

  return (
    <div className="premium-card grid gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="size-4 text-accent" />
          teChia AI Editorial Assistant
        </p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted hover:text-primary">
          Hide
        </button>
      </div>

      {error ? <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p> : null}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="form-label text-xs">Topic or idea (required)
          <input className={inputClass} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="How small businesses can use dashboards to grow" />
        </label>
        <label className="form-label text-xs">Target audience (required)
          <input className={inputClass} value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Small business owners" />
        </label>
        <label className="form-label text-xs">Language
          <select className={inputClass} value={language} onChange={(e) => setLanguage(e.target.value as EditorialLanguage)}>
            {editorialLanguageOptions.map((l) => <option key={l} value={l}>{l === "en" ? "English" : "French"}</option>)}
          </select>
        </label>
        <label className="form-label text-xs">Working title
          <input className={inputClass} value={workingTitle} onChange={(e) => setWorkingTitle(e.target.value)} />
        </label>
        <label className="form-label text-xs">Content type
          <select className={inputClass} value={contentType} onChange={(e) => setContentType(e.target.value as typeof contentType)}>
            {editorialContentTypeOptions.map((t) => <option key={t} value={t}>{t.replaceAll("_", " ")}</option>)}
          </select>
        </label>
        <label className="form-label text-xs">Tone
          <select className={inputClass} value={tone} onChange={(e) => setTone(e.target.value as typeof tone)}>
            {editorialToneOptions.map((t) => <option key={t} value={t}>{t.replaceAll("_", " ")}</option>)}
          </select>
        </label>
        <label className="form-label text-xs">Focus keyword
          <input className={inputClass} value={focusKeyword} onChange={(e) => setFocusKeyword(e.target.value)} />
        </label>
        <label className="form-label text-xs">Secondary keywords (comma separated)
          <input className={inputClass} value={secondaryKeywords} onChange={(e) => setSecondaryKeywords(e.target.value)} />
        </label>
        <label className="form-label text-xs">Desired length
          <select className={inputClass} value={desiredLength} onChange={(e) => setDesiredLength(e.target.value as typeof desiredLength)}>
            <option value="short">Short</option>
            <option value="standard">Standard</option>
            <option value="long">Long</option>
          </select>
        </label>
        <label className="form-label text-xs">Relevant teChia service
          <input className={inputClass} value={service} onChange={(e) => setService(e.target.value)} />
        </label>
        <label className="form-label text-xs md:col-span-2">Business objective
          <input className={inputClass} value={businessObjective} onChange={(e) => setBusinessObjective(e.target.value)} />
        </label>
        <label className="form-label text-xs md:col-span-2">Desired call to action
          <input className={inputClass} value={callToAction} onChange={(e) => setCallToAction(e.target.value)} />
        </label>
        <label className="form-label text-xs md:col-span-2">Additional instructions
          <textarea className={`${inputClass} min-h-20`} value={additionalInstructions} onChange={(e) => setAdditionalInstructions(e.target.value)} />
        </label>
        <label className="form-label text-xs md:col-span-2">Source notes (untrusted reference)
          <textarea className={`${inputClass} min-h-24`} value={sourceNotes} onChange={(e) => setSourceNotes(e.target.value)} />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void generate()}
          disabled={pending !== null || disabled}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-[#001018] transition hover:opacity-90 disabled:opacity-50"
        >
          {pending === "generate" ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
          Generate article
        </button>
        {model ? <span className="text-[11px] text-muted">via {model}</span> : null}
      </div>

      {article ? (
        <div className="grid gap-4 border-t border-border pt-4">
          <div className="grid gap-3">
            <h3 className="text-sm font-semibold text-primary">Generated package</h3>
            <label className="form-label text-xs">Title
              <input className={inputClass} value={article.title} onChange={(e) => setArticle({ ...article, title: e.target.value })} />
            </label>
            <label className="form-label text-xs">Suggested slug
              <input className={inputClass} value={article.suggestedSlug} onChange={(e) => setArticle({ ...article, suggestedSlug: e.target.value })} />
            </label>
            <label className="form-label text-xs">Excerpt
              <textarea className={`${inputClass} min-h-20`} value={article.excerpt} onChange={(e) => setArticle({ ...article, excerpt: e.target.value })} />
            </label>
            <label className="form-label text-xs">Article content
              <textarea className={`${inputClass} min-h-48`} value={article.articleContent} onChange={(e) => setArticle({ ...article, articleContent: e.target.value })} />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="form-label text-xs">SEO title
                <input className={inputClass} value={article.seoTitle} onChange={(e) => setArticle({ ...article, seoTitle: e.target.value })} />
              </label>
              <label className="form-label text-xs">Meta description
                <textarea className={`${inputClass} min-h-20`} value={article.metaDescription} onChange={(e) => setArticle({ ...article, metaDescription: e.target.value })} />
              </label>
              <label className="form-label text-xs">Focus keyword
                <input className={inputClass} value={article.focusKeyword} onChange={(e) => setArticle({ ...article, focusKeyword: e.target.value })} />
              </label>
              <label className="form-label text-xs">Suggested category
                <input className={inputClass} value={article.suggestedCategory} onChange={(e) => setArticle({ ...article, suggestedCategory: e.target.value })} />
              </label>
              <label className="form-label text-xs">Suggested tags (comma)
                <input className={inputClass} value={article.suggestedTags.join(", ")} onChange={(e) => setArticle({ ...article, suggestedTags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
              </label>
              <label className="form-label text-xs">Suggested internal links
                <textarea className={`${inputClass} min-h-20`} value={article.suggestedInternalLinks.join("\n")} onChange={(e) => setArticle({ ...article, suggestedInternalLinks: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} />
              </label>
            </div>
            <label className="form-label text-xs">Suggested call to action
              <textarea className={`${inputClass} min-h-20`} value={article.suggestedCallToAction} onChange={(e) => setArticle({ ...article, suggestedCallToAction: e.target.value })} />
            </label>
            {article.editorialNotes.length ? (
              <div className="rounded-lg border border-border bg-surface-strong/60 p-3 text-xs">
                <p className="font-semibold text-primary">Editorial notes</p>
                <ul className="mt-1 list-disc pl-4 text-muted">{article.editorialNotes.map((n, i) => <li key={i}>{n}</li>)}</ul>
              </div>
            ) : null}
            {article.claimsToVerify.length ? (
              <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs">
                <p className="font-semibold text-amber-300">Claims to verify</p>
                <ul className="mt-1 list-disc pl-4 text-muted">{article.claimsToVerify.map((n, i) => <li key={i}>{n}</li>)}</ul>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 border-t border-border pt-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
              <ImageIcon className="size-4 text-accent" />
              Featured image
            </h3>
            <label className="form-label text-xs">Image prompt
              <textarea className={`${inputClass} min-h-24`} value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} />
            </label>
            <label className="form-label text-xs">Alt text
              <input className={inputClass} value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void runImageGeneration()}
                disabled={imagePending}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-primary transition hover:border-accent/40 disabled:opacity-60"
              >
                {imagePending ? <Loader2 className="size-3.5 animate-spin" /> : <ImageIcon className="size-3.5" />}
                Generate featured image
              </button>
              {imageResult ? <span className="text-[11px] text-muted">Generated {imageResult.width}×{imageResult.height}</span> : null}
            </div>
            {imageResult ? (
              <div className="grid gap-2">
                <img src={imageResult.url} alt={imageResult.altText} className="max-h-64 w-full rounded-lg object-cover" />
                <p className="text-[11px] text-muted">Cloudinary: {imageResult.publicId}</p>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-primary">Refine content</h3>
            <label className="form-label text-xs">Action
              <select className={inputClass} value={refineAction} onChange={(e) => setRefineAction(e.target.value as EditorialEditAction)}>
                {editorialEditActionSchema.options.map((a) => <option key={a} value={a}>{editActionLabels[a as EditorialEditAction]}</option>)}
              </select>
            </label>
            <label className="form-label text-xs">Content to refine
              <textarea className={`${inputClass} min-h-24`} value={refineContent} onChange={(e) => setRefineContent(e.target.value)} placeholder="Paste a section or the full article" />
            </label>
            <button type="button" onClick={() => void runRefine()} disabled={refinePending} className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-primary transition hover:border-accent/40 disabled:opacity-60">
              {refinePending ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
              Run refinement
            </button>
            {refineResult ? (
              <div className="grid gap-2">
                <textarea className={`${inputClass} min-h-32`} value={refineResult} onChange={(e) => setRefineResult(e.target.value)} />
                {refineNotes.length ? <ul className="list-disc pl-4 text-xs text-muted">{refineNotes.map((n, i) => <li key={i}>{n}</li>)}</ul> : null}
                <button type="button" onClick={applyRefineToArticle} className="inline-flex w-fit items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-[#001018]">
                  <Check className="size-3.5" /> Apply to article
                </button>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 border-t border-border pt-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Languages className="size-4 text-accent" />
              Translate
            </h3>
            <label className="form-label text-xs">Direction
              <select className={inputClass} value={translateDirection} onChange={(e) => setTranslateDirection(e.target.value as typeof translateDirection)}>
                <option value="en_to_fr">English to French</option>
                <option value="fr_to_en">French to English</option>
                <option value="improve_translation">Improve translation</option>
              </select>
            </label>
            <label className="form-label text-xs">Content to translate
              <textarea className={`${inputClass} min-h-24`} value={translateContent} onChange={(e) => setTranslateContent(e.target.value)} />
            </label>
            <button type="button" onClick={() => void runTranslate()} disabled={translatePending} className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-primary transition hover:border-accent/40 disabled:opacity-60">
              {translatePending ? <Loader2 className="size-3.5 animate-spin" /> : <Languages className="size-3.5" />}
              Translate
            </button>
            {translateResult ? (
              <div className="grid gap-2">
                <textarea className={`${inputClass} min-h-32`} value={translateResult} onChange={(e) => setTranslateResult(e.target.value)} />
                {translateNotes.length ? <ul className="list-disc pl-4 text-xs text-muted">{translateNotes.map((n, i) => <li key={i}>{n}</li>)}</ul> : null}
                <button type="button" onClick={applyTranslateToArticle} className="inline-flex w-fit items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-[#001018]">
                  <Check className="size-3.5" /> Apply to article
                </button>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 border-t border-border pt-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
              <ClipboardCheck className="size-4 text-accent" />
              Editorial review
            </h3>
            <label className="form-label text-xs">Content to review
              <textarea className={`${inputClass} min-h-24`} value={reviewContent} onChange={(e) => setReviewContent(e.target.value)} />
            </label>
            <button type="button" onClick={() => void runReview()} disabled={reviewPending} className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-primary transition hover:border-accent/40 disabled:opacity-60">
              {reviewPending ? <Loader2 className="size-3.5 animate-spin" /> : <ClipboardCheck className="size-3.5" />}
              Run review
            </button>
            {reviewSummary ? (
              <div className="grid gap-2 text-xs">
                <p className="text-muted">{reviewSummary}</p>
                {reviewIssues.map((issue, i) => (
                  <div key={i} className="rounded-lg border border-border bg-surface-strong/60 p-2">
                    <p className="font-semibold text-primary">{issue.category} · {issue.severity}</p>
                    <p className="text-muted">{issue.message}</p>
                    {issue.suggestion ? <p className="text-accent">Suggestion: {issue.suggestion}</p> : null}
                  </div>
                ))}
                {reviewChecklist.length ? (
                  <ul className="list-disc pl-4 text-muted">{reviewChecklist.map((c, i) => <li key={i}>{c}</li>)}</ul>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleInsert}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-[#001018] transition hover:opacity-90"
            >
              <Check className="size-3.5" />
              Insert into editor
            </button>
            {inserted ? <span className="text-[11px] text-emerald-400">Inserted into editor. Review before publishing.</span> : null}
            <button
              type="button"
              onClick={() => { setArticle(null); setImageResult(null); setInserted(false); }}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted transition hover:text-primary"
            >
              <X className="size-3.5" />
              Discard preview
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
