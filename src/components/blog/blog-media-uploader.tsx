"use client";

import { ImagePlus, LoaderCircle, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

type UploadedMedia = { url: string; publicId: string; width?: number | null; height?: number | null; bytes: number };

export function BlogMediaUploader({ onUploaded }: { onUploaded: (media: UploadedMedia) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setMessage(null);
    const data = new FormData();
    data.set("file", file);
    try {
      const response = await fetch("/api/editorial/media", { method: "POST", body: data, credentials: "same-origin" });
      const result = (await response.json()) as { ok: boolean; media?: UploadedMedia; error?: string };
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
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-semibold text-primary"><ImagePlus className="size-4 text-accent" />Upload an image</div><span className="text-xs text-muted">JPEG, PNG, WebP, AVIF · max 10 MB</span></div>
      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-4 text-sm font-semibold text-primary transition hover:border-accent"><UploadCloud className="size-4" />{busy ? "Uploading securely…" : "Choose image"}<input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} /></label>
      {busy ? <p className="mt-2 inline-flex items-center gap-2 text-xs text-muted"><LoaderCircle className="size-3.5 animate-spin" />Validating and uploading…</p> : null}
      {message ? <p className="mt-2 text-xs text-muted" role="status">{message}</p> : null}
    </div>
  );
}
