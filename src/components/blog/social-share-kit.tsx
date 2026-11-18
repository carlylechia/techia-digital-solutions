"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Copy, Check, Download, Share2, Sparkles, RefreshCw, Link as LinkIcon } from "lucide-react";
import { ProfessionalLoader } from "@/components/ui/professional-loader";
import type { BlogLocale } from "@/lib/blog/constants";
import type { SocialPlatform, SocialGraphicFormat } from "@/lib/ai/social-share-types";

type Post = {
  id: string;
  title: string;
  slug: string;
  status: string;
  featuredImageUrl?: string | null;
  author?: { displayName?: string } | null;
  category?: { name?: string } | null;
};

type Variant = {
  id: string;
  platform: SocialPlatform;
  generatedCaption: string;
  editedCaption: string | null;
  shortCaption: string | null;
  statusCaption: string | null;
  directCaption: string | null;
  publishStatus: string;
  publishedAt: string | null;
};

type Graphic = {
  id: string;
  format: SocialGraphicFormat;
  url: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
};

type Kit = {
  id: string;
  postId: string;
  variants: Variant[];
  graphics: Graphic[];
};

const PLATFORMS: SocialPlatform[] = ["FACEBOOK", "INSTAGRAM", "WHATSAPP"];
const platformLabel: Record<SocialPlatform, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp",
};

const refinementOptions = [
  "Make it shorter",
  "Make it more engaging",
  "Make it more professional",
  "Use a stronger opening hook",
  "Make it more conversational",
  "Focus more on conversions",
  "Add a stronger call to action",
];

export function SocialShareKit({ locale }: { locale: BlogLocale }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [article, setArticle] = useState<{ title: string; slug: string; canonicalUrl: string; status: string; categories: string[] } | null>(null);
  const [kit, setKit] = useState<Kit | null>(null);
  const [kitLoading, setKitLoading] = useState(false);
  const [activePlatform, setActivePlatform] = useState<SocialPlatform>("FACEBOOK");
  const [captionDrafts, setCaptionDrafts] = useState<Record<SocialPlatform, string>>({
    FACEBOOK: "",
    INSTAGRAM: "",
    WHATSAPP: "",
  });
  const [shortDraft, setShortDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState("");
  const [directDraft, setDirectDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [graphicFormat, setGraphicFormat] = useState<SocialGraphicFormat>("SQUARE");
  const [graphicPrompt, setGraphicPrompt] = useState("");
  const [graphicLogo, setGraphicLogo] = useState("logo-horizontal-white");
  const [customRefinement, setCustomRefinement] = useState("");

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      params.set("locale", locale);
      const res = await fetch(`/api/editorial/social/posts?${params.toString()}`, { credentials: "same-origin" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to load articles.");
      setPosts(json.posts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load articles.");
    } finally {
      setPostsLoading(false);
    }
  }, [search, statusFilter, locale]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPosts();
  }, [loadPosts]);

  const selectPost = useCallback(async (postId: string) => {
    setSelectedPostId(postId);
    setKitLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/editorial/social/kit?postId=${encodeURIComponent(postId)}`, { credentials: "same-origin" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to load kit.");
      setArticle(json.article);
      const k = json.kit as Kit | null;
      setKit(k);
      // init drafts
      const drafts: Record<SocialPlatform, string> = { FACEBOOK: "", INSTAGRAM: "", WHATSAPP: "" };
      let short = "";
      let status = "";
      let direct = "";
      if (k) {
        for (const v of k.variants) {
          const caption = v.editedCaption || v.generatedCaption;
          if (v.platform === "FACEBOOK") drafts.FACEBOOK = caption;
          if (v.platform === "INSTAGRAM") {
            drafts.INSTAGRAM = caption;
            short = v.shortCaption || "";
          }
          if (v.platform === "WHATSAPP") {
            drafts.WHATSAPP = v.directCaption || caption;
            status = v.statusCaption || "";
            direct = v.directCaption || caption;
          }
        }
      }
      setCaptionDrafts(drafts);
      setShortDraft(short);
      setStatusDraft(status);
      setDirectDraft(direct);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load kit.");
    } finally {
      setKitLoading(false);
    }
  }, []);

  const variantFor = (p: SocialPlatform) => kit?.variants.find((v) => v.platform === p) || null;
  const graphicFor = (f: SocialGraphicFormat) => kit?.graphics.find((g) => g.format === f) || null;

  async function generateCaption(platform: SocialPlatform, refinement?: string) {
    if (!selectedPostId) return;
    setBusy(`caption-${platform}`);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/editorial/social/captions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: selectedPostId, platform, refinement: refinement || customRefinement || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Generation failed.");
      await selectPost(selectedPostId);
      setNotice(`${platformLabel[platform]} caption generated.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(null);
    }
  }

  async function saveCaption(platform: SocialPlatform) {
    if (!selectedPostId) return;
    setBusy(`save-${platform}`);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        postId: selectedPostId,
        platform,
        editedCaption: captionDrafts[platform],
      };
      if (platform === "INSTAGRAM") body.shortCaption = shortDraft;
      if (platform === "WHATSAPP") {
        body.statusCaption = statusDraft;
        body.directCaption = directDraft;
        body.editedCaption = directDraft || captionDrafts[platform];
      }
      const res = await fetch("/api/editorial/social/captions/edit", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Save failed.");
      setNotice("Caption saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(null);
    }
  }

  async function generateGraphic(format: SocialGraphicFormat) {
    if (!selectedPostId) return;
    setBusy(`graphic-${format}`);
    setError(null);
    try {
      const res = await fetch("/api/editorial/social/graphics", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: selectedPostId, format, prompt: graphicPrompt || undefined, logo: graphicLogo || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Graphic generation failed.");
      await selectPost(selectedPostId);
      setNotice(`${format === "SQUARE" ? "Square" : "Vertical"} graphic generated.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Graphic generation failed.");
    } finally {
      setBusy(null);
    }
  }

  async function updateStatus(platform: SocialPlatform, status: "NOT_STARTED" | "READY" | "PUBLISHED") {
    if (!selectedPostId) return;
    setBusy(`status-${platform}`);
    setError(null);
    try {
      const res = await fetch("/api/editorial/social/publish", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: selectedPostId, platform, status }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Status update failed.");
      await selectPost(selectedPostId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status update failed.");
    } finally {
      setBusy(null);
    }
  }

  async function copyText(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
      setNotice("Copied to clipboard.");
    } catch {
      setError("Clipboard not available. Please copy manually.");
    }
  }

  async function downloadGraphic(graphic: Graphic, platform: SocialPlatform) {
    const pngUrl = graphic.url.replace("/upload/", "/upload/f_png/");
    try {
      const res = await fetch(pngUrl);
      if (!res.ok) throw new Error("Download failed.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${article?.slug || "article"}-${platform.toLowerCase()}-${graphic.format.toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    }
  }

  async function shareNative(platform: SocialPlatform) {
    const caption = captionDrafts[platform];
    const link = article?.canonicalUrl || "";
    const graphic = graphicFor(graphicFormat);
    const shareData: { title?: string; text: string; files?: File[] } = { title: article?.title, text: `${caption}\n\n${link}` };
    if (graphic) {
      try {
        const pngUrl = graphic.url.replace("/upload/", "/upload/f_png/");
        const res = await fetch(pngUrl);
        const blob = await res.blob();
        const file = new File([blob], `${article?.slug || "graphic"}.png`, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          shareData.files = [file];
        }
      } catch {
        // ignore file share errors
      }
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e: unknown) {
        const err = e as { name?: string; message?: string };
        if (err?.name !== "AbortError") {
          setError(err?.message || "Sharing failed.");
        }
      }
    } else {
      setError("Native sharing is not supported on this device. Use copy/download instead.");
    }
  }


  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      {/* Article selection */}
      <aside className="premium-card p-4 grid gap-3 content-start">
        <h2 className="text-sm font-semibold text-primary">Select article</h2>
        <input
          className="form-input text-sm"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="form-input text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="IN_REVIEW">In review</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button type="button" onClick={() => void loadPosts()} disabled={postsLoading} className="btn-secondary text-xs">
          {postsLoading ? <Loader2 className="size-3.5 animate-spin" /> : "Refresh"}
        </button>
        {postsLoading ? <ProfessionalLoader label="Loading articles" size="sm" /> : null}
        <div className="grid gap-2 max-h-[60vh] overflow-auto">
          {posts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => void selectPost(p.id)}
              className={`text-left rounded-lg border p-3 transition ${selectedPostId === p.id ? "border-accent bg-accent/10" : "border-border hover:border-accent/40"}`}
            >
              <p className="text-sm font-semibold text-primary line-clamp-2">{p.title}</p>
              <p className="text-[11px] text-muted mt-1">{p.status} · {p.category?.name || "Uncategorised"}</p>
            </button>
          ))}
          {!postsLoading && posts.length === 0 ? <p className="text-xs text-muted">No articles found.</p> : null}
        </div>
      </aside>

      {/* Workspace */}
      <section className="grid gap-4">
        {error ? <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p> : null}
        {notice ? <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{notice}</p> : null}
        {busy ? <ProfessionalLoader label="Processing social share task" size="md" /> : null}

        {!selectedPostId ? (
          <div className="premium-card p-8 text-center text-sm text-muted">Select an article to begin.</div>
        ) : kitLoading ? (
          <div className="premium-card p-8 flex items-center justify-center"><Loader2 className="size-6 animate-spin text-accent" /></div>
        ) : (
          <>
            {/* Article header */}
            <div className="premium-card p-5 grid gap-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-lg font-semibold text-primary">{article?.title}</h1>
                  <p className="text-xs text-muted mt-1">
                    {article?.status} · {article?.categories?.join(", ") || "Uncategorised"}
                  </p>
                  <a href={article?.canonicalUrl} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline break-all">
                    {article?.canonicalUrl}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => article?.canonicalUrl && window.open(article.canonicalUrl, "_blank")}
                  className="btn-secondary text-xs"
                >
                  Open article
                </button>
              </div>
            </div>

            {/* Platform tabs */}
            <div className="flex gap-2 border-b border-border">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setActivePlatform(p)}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activePlatform === p ? "border-accent text-accent" : "border-transparent text-muted hover:text-primary"}`}
                >
                  {platformLabel[p]}
                </button>
              ))}
            </div>

            {/* Caption editor */}
            <div className="premium-card p-5 grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-primary">{platformLabel[activePlatform]} caption</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void generateCaption(activePlatform)}
                    disabled={busy !== null}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-[#001018] disabled:opacity-50"
                  >
                    {busy === `caption-${activePlatform}` ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                    {variantFor(activePlatform) ? "Regenerate" : "Generate"}
                  </button>
                </div>
              </div>

              <textarea
                className="form-input text-sm min-h-40"
                value={captionDrafts[activePlatform]}
                onChange={(e) => setCaptionDrafts((d) => ({ ...d, [activePlatform]: e.target.value }))}
                placeholder={`Generate ${platformLabel[activePlatform]} caption...`}
              />
              <p className="text-[11px] text-muted">{captionDrafts[activePlatform].length} characters</p>

              {activePlatform === "INSTAGRAM" ? (
                <label className="form-label text-xs">Short caption
                  <textarea className="form-input text-sm min-h-20" value={shortDraft} onChange={(e) => setShortDraft(e.target.value)} />
                </label>
              ) : null}

              {activePlatform === "WHATSAPP" ? (
                <>
                  <label className="form-label text-xs">Status caption
                    <textarea className="form-input text-sm min-h-20" value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} />
                  </label>
                  <label className="form-label text-xs">Direct message caption
                    <textarea className="form-input text-sm min-h-20" value={directDraft} onChange={(e) => setDirectDraft(e.target.value)} />
                  </label>
                </>
              ) : null}

              {/* Refinement */}
              <div className="grid gap-2 border-t border-border pt-3">
                <p className="text-xs font-semibold text-primary">Refine</p>
                <div className="flex flex-wrap gap-2">
                  {refinementOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => void generateCaption(activePlatform, opt)}
                      disabled={busy !== null}
                      className="rounded-full border border-border px-3 py-1 text-[11px] text-muted hover:border-accent/40 hover:text-primary disabled:opacity-50"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="form-input text-sm flex-1"
                    placeholder="Custom refinement instruction..."
                    value={customRefinement}
                    onChange={(e) => setCustomRefinement(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => { if (customRefinement.trim()) void generateCaption(activePlatform, customRefinement.trim()); }}
                    disabled={busy !== null || !customRefinement.trim()}
                    className="btn-secondary text-xs"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                <button type="button" onClick={() => void saveCaption(activePlatform)} disabled={busy !== null} className="btn-secondary text-xs">
                  {busy === `save-${activePlatform}` ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Save edits
                </button>
                <button type="button" onClick={() => void copyText(captionDrafts[activePlatform], `caption-${activePlatform}`)} className="btn-secondary text-xs">
                  {copied === `caption-${activePlatform}` ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} Copy caption
                </button>
                <button type="button" onClick={() => void copyText(article?.canonicalUrl || "", "link")} className="btn-secondary text-xs">
                  {copied === "link" ? <Check className="size-3.5" /> : <LinkIcon className="size-3.5" />} Copy link
                </button>
                <button type="button" onClick={() => void shareNative(activePlatform)} className="btn-secondary text-xs">
                  <Share2 className="size-3.5" /> Share
                </button>
              </div>
            </div>

            {/* Graphics */}
            <div className="premium-card p-5 grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-primary">Branded graphics</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGraphicFormat("SQUARE")}
                    className={`px-3 py-1.5 text-xs rounded-lg border ${graphicFormat === "SQUARE" ? "border-accent text-accent" : "border-border text-muted"}`}
                  >
                    Square
                  </button>
                  <button
                    type="button"
                    onClick={() => setGraphicFormat("VERTICAL")}
                    className={`px-3 py-1.5 text-xs rounded-lg border ${graphicFormat === "VERTICAL" ? "border-accent text-accent" : "border-border text-muted"}`}
                  >
                    Vertical
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="form-label text-xs">Graphic prompt (optional)
                  <textarea className="form-input text-sm min-h-20" value={graphicPrompt} onChange={(e) => setGraphicPrompt(e.target.value)} placeholder="Describe the image or edits you want..." />
                </label>
                <label className="form-label text-xs">Logo
                  <select className="form-input text-sm" value={graphicLogo} onChange={(e) => setGraphicLogo(e.target.value)}>
                    <option value="logo-horizontal-white">Horizontal white</option>
                    <option value="logo-horizontal-dark">Horizontal dark</option>
                    <option value="logo-horizontal-light">Horizontal light</option>
                    <option value="logo-horizontal-black">Horizontal black</option>
                    <option value="logo-mark">Mark only</option>
                    <option value="logo-full">Full logo</option>
                  </select>
                </label>
              </div>

              {graphicFor(graphicFormat) ? (
                <div className="grid gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={graphicFor(graphicFormat)!.url.replace("/upload/", "/upload/f_png/")}
                    alt="Social graphic preview"
                    className={`rounded-lg border border-border ${graphicFormat === "SQUARE" ? "max-w-sm" : "max-w-xs"} w-full`}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void downloadGraphic(graphicFor(graphicFormat)!, activePlatform)}
                      className="btn-secondary text-xs"
                    >
                      <Download className="size-3.5" /> Download
                    </button>
                    <button
                      type="button"
                      onClick={() => void generateGraphic(graphicFormat)}
                      disabled={busy !== null}
                      className="btn-secondary text-xs"
                    >
                      {busy === `graphic-${graphicFormat}` ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2">
                  <p className="text-xs text-muted">No {graphicFormat.toLowerCase()} graphic yet.</p>
                  <button
                    type="button"
                    onClick={() => void generateGraphic(graphicFormat)}
                    disabled={busy !== null}
                    className="inline-flex w-fit items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-[#001018] disabled:opacity-50"
                  >
                    {busy === `graphic-${graphicFormat}` ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                    Generate {graphicFormat === "SQUARE" ? "square" : "vertical"} graphic
                  </button>
                </div>
              )}
            </div>

            {/* Publishing status */}
            <div className="premium-card p-5 grid gap-3">
              <h2 className="text-sm font-semibold text-primary">Manual publishing status</h2>
              <p className="text-xs text-muted">Mark as published only after you have published manually.</p>
              <div className="flex flex-wrap gap-2">
                {(["NOT_STARTED", "READY", "PUBLISHED"] as const).map((s) => {
                  const v = variantFor(activePlatform);
                  const active = v?.publishStatus === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void updateStatus(activePlatform, s)}
                      disabled={busy !== null}
                      className={`px-3 py-1.5 text-xs rounded-lg border ${active ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:border-accent/40"}`}
                    >
                      {s === "NOT_STARTED" ? "Not started" : s === "READY" ? "Ready to publish" : "Published"}
                    </button>
                  );
                })}
              </div>
              {variantFor(activePlatform)?.publishedAt ? (
                <p className="text-[11px] text-muted">
                  Published at {new Date(variantFor(activePlatform)!.publishedAt!).toLocaleString()}
                </p>
              ) : null}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
