"use client";

import { useState, useTransition } from "react";
import { changeWriterPasswordAction } from "@/lib/blog/actions";

export function WriterPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  return <form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(async () => { const result = await changeWriterPasswordAction(data); setMessage(result.ok ? result.message : result.error); if (result.ok) event.currentTarget.reset(); }); }} className="grid max-w-xl gap-4"><div><p className="eyebrow">Account security</p><h2 className="mt-2 text-xl font-semibold text-primary">Change your password</h2><p className="mt-2 text-sm leading-6 text-muted">Use a unique password of at least 12 characters. Your password is never shown after creation.</p></div><label className="form-label">Current password<input className="form-input" type="password" name="currentPassword" autoComplete="current-password" required /></label><label className="form-label">New password<input className="form-input" type="password" name="newPassword" autoComplete="new-password" minLength={12} required /></label>{message ? <p className="rounded-xl bg-accent/10 p-3 text-sm text-accent" role="status">{message}</p> : null}<div><button className="btn-secondary" type="submit" disabled={isPending}>{isPending ? "Updating…" : "Update password"}</button></div></form>;
}
