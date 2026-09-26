"use client";

import Image from "next/image";
import { Check, FolderOpen, ImagePlus, LoaderCircle, Search, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type SelectedMedia = {
  url: string;
  publicId: string;
  altText?: string;
  format?: string;
  width?: number | null;
  height?: number | null;
  bytes?: number;
};

type LibraryMedia = SelectedMedia & { id: string; format: string; width: number | null; height: number | null; bytes: number; altText: string; createdAt: string };

/**
 * Featured image source for the article editor. An author either reuses an
 * image that is already in the editorial media library or uploads a new file,
 * because the same asset is often needed on several articles and re-uploading
 * it wastes storage and fragments the library.
 */
export function BlogMediaUploader({
  onUploaded,
  onCleared,
  selectedUrl,
  disabled = false,
}: {
  onUploaded: (media: SelectedMedia) => void;
  onCleared?: () => void;
  selectedUrl?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<"library" | "upload">("library");
  const [media, setMedia] = useState<LibraryMedia[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const loading = source === "library" && media === null && loadError === null;

  // The library is only fetched when it is actually opened, so the editor page
  // itself stays cheap to load.
  useEffect(() => {
    if (source !== "library" || media !== null || disabled) return;
    let cancelled = false;
    fetch("/api/editorial/media", { credentials: "same-origin" })
      .then(async (response) => {
        const result = (await response.json()) as { ok: boolean; media?: LibraryMedia[]; error?: string };
        if (cancelled) return;
        if (!response.ok || !result.ok || !result.media) {
          setLoadError(result.error || "The media library could not be loaded.");
          return;
        }
        setMedia(result.media);
      })
      .catch(() => {
        if (!cancelled) setLoadError("The media library could not be loaded. Check your connection and try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [source, media, disabled]);

  const filtered = useMemo(() => {
    if (!media) return [];
    const term = search.trim().toLowerCase();
    if (!term) return media;
    return media.filter((item) => `${item.altText} ${item.format} ${item.publicId}`.toLowerCase().includes(term));
  }, [media, search]);

  async function upload(file: File) {
    setBusy(true);
    setMessage(null);
    const data = new FormData();
    data.set("file", file);
    try {
      const response = await fetch("/api/editorial/media", { method: "POST", body: data, credentials: "same-origin" });
      const result = (await response.json()) as { ok: boolean; media?: SelectedMedia; error?: string };
      if (!response.ok || !result.ok || !result.media) {
        setMessage(result.error || "Upload failed.");
        return;
      }
      onUploaded(result.media);
      setMessage("Image uploaded and attached.");
    } catch {
      setMessage("Upload failed. Check your connection and try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-strong/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary"><ImagePlus className="size-4 text-accent" />Featured image</div>
        <span className="text-xs text-muted">JPEG, PNG, WebP, AVIF · max 10 MB</span>
      </div>

      <div className="mt-3 inline-flex rounded-xl border border-border bg-background p-1" role="tablist" aria-label="Featured image source">
        <button
          type="button"
          role="tab"
          aria-selected={source === "library"}
          onClick={() => { setSource("library"); setLoadError(null); setMessage(null); }}
          disabled={disabled}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${source === "library" ? "bg-accent/10 text-accent" : "text-muted hover:text-primary"}`}
        >
          <FolderOpen className="size-3.5" />Media library
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={source === "upload"}
          onClick={() => { setSource("upload"); setMessage(null); }}
          disabled={disabled}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${source === "upload" ? "bg-accent/10 text-accent" : "text-muted hover:text-primary"}`}
        >
          <UploadCloud className="size-3.5" />Upload file
        </button>
      </div>

      {source === "upload" ? (
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-4 text-sm font-semibold text-primary transition hover:border-accent">
          <UploadCloud className="size-4" />{busy ? "Uploading securely…" : "Choose image from this device"}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            disabled={busy || disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
        </label>
      ) : (
        <div className="mt-3 grid gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <label htmlFor="media-picker-search" className="sr-only">Search the media library</label>
            <input
              id="media-picker-search"
              className="form-input pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by description, format, or file name"
              disabled={loading || disabled}
            />
          </div>
          {loading ? <p className="inline-flex items-center gap-2 text-xs text-muted"><LoaderCircle className="size-3.5 animate-spin" />Loading the media library…</p> : null}
          {!loading && loadError ? <p className="text-xs text-red-400" role="alert">{loadError}</p> : null}
          {!loading && !loadError && media?.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted">
              The media library is empty. Upload an image first, and it will be available for every article.
            </p>
          ) : null}
          {!loading && filtered.length ? (
            <ul className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
              {filtered.map((item) => {
                const isSelected = Boolean(selectedUrl && selectedUrl === item.url);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onUploaded({ url: item.url, publicId: item.publicId, altText: item.altText, format: item.format, width: item.width, height: item.height, bytes: item.bytes })}
                      disabled={disabled}
                      aria-pressed={isSelected}
                      className={`relative block w-full overflow-hidden rounded-xl border text-left transition ${isSelected ? "border-accent" : "border-border hover:border-accent/60"}`}
                    >
                      <span className="relative block aspect-[4/3] bg-surface-strong">
                        <Image src={item.url} alt="" fill sizes="(min-width: 640px) 30vw, 45vw" className="object-cover" />
                        {isSelected ? <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-accent text-[#001018]"><Check className="size-3.5" aria-hidden="true" /></span> : null}
                      </span>
                      <span className="block p-2 text-[11px] leading-4 text-muted">
                        <span className="block truncate font-semibold text-primary">{item.altText || "No description yet"}</span>
                        {item.format.toUpperCase()} · {item.width || "?"}×{item.height || "?"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {!loading && !loadError && media?.length && !filtered.length ? <p className="text-xs text-muted">No image in the library matches “{search.trim()}”.</p> : null}
        </div>
      )}

      {busy ? <p className="mt-2 inline-flex items-center gap-2 text-xs text-muted"><LoaderCircle className="size-3.5 animate-spin" />Validating and uploading…</p> : null}
      {message ? <p className="mt-2 text-xs text-muted" role="status">{message}</p> : null}
      {selectedUrl ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
          <p className="min-w-0 truncate text-xs text-muted">Attached: <span className="font-semibold text-primary">{selectedUrl.split("/").slice(-1)[0]}</span></p>
          {onCleared ? (
            <button type="button" className="btn-secondary text-xs" onClick={onCleared} disabled={disabled || busy}>
              <Trash2 className="size-3.5" />Remove image
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
