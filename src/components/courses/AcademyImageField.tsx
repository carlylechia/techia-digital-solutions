"use client";

import Image from "next/image";
import { ImagePlus, Link2, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition placeholder:text-muted/70 focus:border-accent/60 focus:ring-2 focus:ring-accent/25";

/**
 * Cover image picker for academy courses and packs in the admin. Accepts either
 * a device upload (signed Cloudinary upload through /api/courses/admin-media)
 * or a direct external image URL. Always reports its value through a single
 * hidden input so it can drop straight into the existing server-action forms.
 */
export function AcademyImageField({
  name = "imageUrl",
  defaultValue = "",
  label = "Cover image",
  disabled = false,
}: {
  name?: string;
  defaultValue?: string;
  label?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    setMessage(null);
    const data = new FormData();
    data.set("file", file);
    try {
      const response = await fetch("/api/courses/admin-media", {
        method: "POST",
        body: data,
        credentials: "same-origin",
      });
      const result = (await response.json()) as { ok: boolean; image?: { url: string }; error?: string };
      if (!response.ok || !result.ok || !result.image) {
        setError(result.error || "Upload failed. Try again or use a direct URL.");
        return;
      }
      setUrl(result.image.url);
      setMessage("Image uploaded.");
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-strong/40 p-4">
      <input type="hidden" name={name} value={url} disabled={disabled} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">
          <ImagePlus className="size-4 text-accent" />
          {label}
        </p>
        <div className="inline-flex rounded-lg border border-border bg-background p-0.5" role="tablist" aria-label={`${label} source`}>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "upload"}
            disabled={disabled || busy}
            onClick={() => { setMode("upload"); setError(null); setMessage(null); }}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${mode === "upload" ? "bg-accent text-[#001018]" : "text-muted hover:text-primary"}`}
          >
            <UploadCloud className="size-3.5" /> Upload
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "url"}
            disabled={disabled || busy}
            onClick={() => { setMode("url"); setError(null); setMessage(null); }}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${mode === "url" ? "bg-accent text-[#001018]" : "text-muted hover:text-primary"}`}
          >
            <Link2 className="size-3.5" /> Direct URL
          </button>
        </div>
      </div>

      {mode === "upload" ? (
        <label className={`mt-3 grid cursor-pointer place-items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-6 text-center text-sm text-muted transition hover:border-accent/50 ${disabled || busy ? "pointer-events-none opacity-60" : ""}`}>
          {busy ? <LoaderCircle className="size-5 animate-spin text-accent" /> : <UploadCloud className="size-5 text-accent" />}
          <span className="font-semibold text-primary">{busy ? "Uploading…" : "Choose an image from your device"}</span>
          <span className="text-xs">JPEG, PNG, WebP, AVIF · max 10 MB</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            disabled={disabled || busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
        </label>
      ) : (
        <div className="mt-3">
          <input
            type="url"
            value={url}
            disabled={disabled || busy}
            placeholder="https://res.cloudinary.com/… or any https image URL"
            onChange={(event) => { setUrl(event.target.value); setError(null); setMessage(null); }}
            className={inputClass}
          />
        </div>
      )}

      <div className="mt-3 flex items-start gap-3">
        <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
          {url ? (
            <Image src={url} alt="Selected cover image preview" fill unoptimized sizes="128px" className="object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">No image</div>
          )}
        </div>
        <div className="min-w-0 flex-1 text-xs">
          {error ? <p className="font-semibold text-rose-400">{error}</p> : null}
          {message && !error ? <p className="font-semibold text-emerald-500">{message}</p> : null}
          {!error && !message ? <p className="text-muted">The image is saved with the course when you submit the form.</p> : null}
          {url ? (
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => { setUrl(""); setError(null); setMessage(null); }}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 font-semibold text-muted transition hover:border-rose-400/50 hover:text-rose-400"
            >
              <Trash2 className="size-3.5" /> Remove image
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
