"use client";

import { useState, useTransition } from "react";
import { saveWriterProfileAction } from "@/lib/blog/actions";
import { BlogMediaUploader } from "./blog-media-uploader";

type Profile = { displayName: string; bio: string; jobTitle: string; imageUrl: string; imagePublicId: string; websiteUrl: string; linkedinUrl: string; xUrl: string };

export function WriterProfileForm({ profile }: { profile: Profile }) {
  const [form, setForm] = useState(profile);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  function update(key: keyof Profile, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  return <form action={(data) => { Object.entries(form).forEach(([key, value]) => data.set(key, value)); startTransition(async () => { const result = await saveWriterProfileAction(data); setMessage(result.ok ? result.message : result.error); }); }} className="grid gap-5"><div className="grid gap-5 md:grid-cols-2"><label className="form-label">Display name<input className="form-input" value={form.displayName} onChange={(event) => update("displayName", event.target.value)} required maxLength={120} /></label><label className="form-label">Job title / role<input className="form-input" value={form.jobTitle} onChange={(event) => update("jobTitle", event.target.value)} maxLength={140} /></label></div><label className="form-label">Bio<textarea className="form-input min-h-40" value={form.bio} onChange={(event) => update("bio", event.target.value)} required minLength={40} maxLength={3000} /><span className="text-xs text-muted">{form.bio.length}/3000 · Write a genuine professional biography.</span></label><BlogMediaUploader onUploaded={(media) => { update("imageUrl", media.url); update("imagePublicId", media.publicId); }} /><div className="grid gap-5 md:grid-cols-3"><label className="form-label">Profile image URL<input className="form-input" value={form.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} /></label><label className="form-label">Website<input className="form-input" value={form.websiteUrl} onChange={(event) => update("websiteUrl", event.target.value)} /></label><label className="form-label">LinkedIn<input className="form-input" value={form.linkedinUrl} onChange={(event) => update("linkedinUrl", event.target.value)} /></label></div><label className="form-label">X / Twitter<input className="form-input" value={form.xUrl} onChange={(event) => update("xUrl", event.target.value)} /></label>{message ? <p className="rounded-xl bg-accent/10 p-3 text-sm text-accent" role="status">{message}</p> : null}<div><button className="btn-primary" type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save author profile"}</button></div></form>;
}
