"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { updateBlogMediaAltAction } from "@/lib/blog/actions";
import { BlogMediaUploader } from "./blog-media-uploader";

type Media = { id: string; publicId: string; url: string; format: string; mimeType: string; width: number | null; height: number | null; bytes: number; altText: string; createdAt: string; uploadedBy: string | null };

export function MediaLibrary({ initialMedia }: { initialMedia: Media[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  return <div className="grid gap-6"><BlogMediaUploader onUploaded={() => { setMessage("Upload complete. Refresh to see the new asset in the library."); }} /><div className="premium-card p-5 sm:p-6"><p className="eyebrow">Controlled library</p><h2 className="mt-2 text-xl font-semibold text-primary">Editorial media</h2><p className="mt-2 text-sm text-muted">Only validated images uploaded through this studio appear here. Add descriptive alt text before using an image publicly.</p></div>{message ? <p className="rounded-xl bg-accent/10 p-3 text-sm text-accent" role="status">{message}</p> : null}<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{initialMedia.map((media) => <MediaCard key={media.id} media={media} isPending={isPending} onSave={(altText) => { const data = new FormData(); data.set("id", media.id); data.set("altText", altText); startTransition(async () => { const result = await updateBlogMediaAltAction(data); setMessage(result.ok ? result.message : result.error); }); }} />)}</div></div>;
}

function MediaCard({ media, onSave, isPending }: { media: Media; onSave: (value: string) => void; isPending: boolean }) {
  const [altText, setAltText] = useState(media.altText);
  return <article className="premium-card overflow-hidden"><div className="relative aspect-[4/3] bg-surface-strong"><Image src={media.url} alt={media.altText || ""} fill sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw" className="object-cover" /></div><div className="grid gap-3 p-4"><p className="truncate text-xs text-muted">{media.format.toUpperCase()} · {media.width || "?"}×{media.height || "?"} · {Math.round(media.bytes / 1024)} KB</p><form onSubmit={(event) => { event.preventDefault(); onSave(altText); }} className="grid gap-2"><label className="sr-only" htmlFor={`alt-${media.id}`}>Alt text</label><input id={`alt-${media.id}`} className="form-input" value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Describe the image" maxLength={300} /><button className="btn-secondary" type="submit" disabled={isPending}>Save alt text</button></form></div></article>;
}
