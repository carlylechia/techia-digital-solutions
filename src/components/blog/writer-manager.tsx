"use client";

import { useState, useTransition } from "react";
import { inviteWriterAction, resetWriterPasswordAction, setWriterStatusAction, updateWriterRoleAction } from "@/lib/blog/actions";

type Writer = { id: string; name: string | null; email: string; status: string; lastLoginAt: string | null; author: { displayName: string; slug: string; isActive: boolean } | null; articles: number };
type Role = { id: string; name: string; label: string; level: number };

type ActionResult = { ok: true; message: string } | { ok: false; error: string };

export function WriterManager({ writers, roles }: { writers: Writer[]; roles: Role[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  function run(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? result.message : result.error);
    });
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={(event) => { event.preventDefault(); run(() => inviteWriterAction(new FormData(event.currentTarget))); }} className="premium-card grid gap-4 p-5 sm:p-6">
        <div><p className="eyebrow">Writer onboarding</p><h2 className="mt-2 text-xl font-semibold text-primary">Invite a writer</h2><p className="mt-2 text-sm leading-6 text-muted">A temporary password is emailed directly to the writer. It is never displayed or stored in this dashboard.</p></div>
        <div className="grid gap-4 md:grid-cols-2"><label className="form-label">Account name<input className="form-input" name="name" required maxLength={120} /></label><label className="form-label">Work email<input className="form-input" type="email" name="email" required maxLength={180} /></label><label className="form-label">Public author name<input className="form-input" name="authorDisplayName" required maxLength={120} /></label><label className="form-label">Author slug<input className="form-input" name="authorSlug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="jane-doe" /></label></div>
        <label className="form-label">Professional role<input className="form-input" name="jobTitle" maxLength={140} /></label>
        <label className="form-label">Author bio<textarea className="form-input min-h-28" name="bio" required minLength={40} maxLength={3000} /></label>
        <button className="btn-primary justify-start" type="submit" disabled={isPending}>{isPending ? "Creating…" : "Create and email invitation"}</button>
      </form>

      <div className="premium-card overflow-hidden"><div className="border-b border-border p-5"><p className="eyebrow">Writer accounts</p><h2 className="mt-2 text-xl font-semibold text-primary">Access and attribution</h2></div>{writers.length ? <div className="divide-y divide-border">{writers.map((writer) => <WriterRow key={writer.id} writer={writer} roles={roles} run={run} isPending={isPending} />)}</div> : <p className="p-8 text-sm text-muted">No writer accounts yet.</p>}</div>
      {message ? <p className="rounded-xl bg-accent/10 p-3 text-sm text-accent" role="status">{message}</p> : null}
    </div>
  );
}

function WriterRow({ writer, roles, run, isPending }: { writer: Writer; roles: Role[]; run: (action: () => Promise<ActionResult>) => void; isPending: boolean }) {
  return <div className="grid gap-4 p-5 md:grid-cols-[1fr_12rem_10rem] md:items-center"><div><p className="font-semibold text-primary">{writer.author?.displayName || writer.name || "Unlinked writer"}</p><p className="mt-1 text-xs text-muted">{writer.email} · {writer.articles} articles · {writer.lastLoginAt ? `Last active ${new Date(writer.lastLoginAt).toLocaleDateString()}` : "Not signed in yet"}</p></div><form onSubmit={(event) => { event.preventDefault(); run(() => updateWriterRoleAction(new FormData(event.currentTarget))); }}><input type="hidden" name="id" value={writer.id} /><label className="sr-only" htmlFor={`role-${writer.id}`}>Role</label><select id={`role-${writer.id}`} name="roleId" className="form-input" defaultValue={roles.find((role) => role.name === "writer")?.id}>{roles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}</select><button className="btn-secondary mt-2 w-full" type="submit" disabled={isPending}>Update role</button></form><div className="grid gap-2"><form onSubmit={(event) => { event.preventDefault(); run(() => setWriterStatusAction(new FormData(event.currentTarget))); }}><input type="hidden" name="id" value={writer.id} /><input type="hidden" name="status" value={writer.status === "DISABLED" ? "ACTIVE" : "DISABLED"} /><button className={`btn-secondary w-full ${writer.status === "DISABLED" ? "text-emerald-300" : "text-amber-300"}`} type="submit" disabled={isPending}>{writer.status === "DISABLED" ? "Reactivate" : "Deactivate"}</button></form><form onSubmit={(event) => { event.preventDefault(); run(() => resetWriterPasswordAction(new FormData(event.currentTarget))); }}><input type="hidden" name="id" value={writer.id} /><button className="btn-ghost w-full text-xs" type="submit" disabled={isPending}>Email temporary reset</button></form></div></div>;
}
