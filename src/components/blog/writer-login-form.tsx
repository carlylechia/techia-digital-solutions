"use client";

import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import type { Locale } from "@/content/site";

export function WriterLoginForm({ locale }: { locale: Locale }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    const data = new FormData(event.currentTarget);
    const result = await signIn("credentials", { email: String(data.get("email") || ""), password: String(data.get("password") || ""), redirect: false, callbackUrl: `/${locale}/writer` });
    if (result?.ok) { window.location.assign(result.url || `/${locale}/writer`); return; }
    setStatus("error");
  }
  const fr = locale === "fr";
  return <form onSubmit={submit} className="premium-card mx-auto grid w-full max-w-md gap-5 p-6 sm:p-8"><div><span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-strong px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted"><ShieldCheck className="size-4 text-accent" />{fr ? "Espace rédacteur" : "Writer access"}</span><h1 className="mt-5 text-3xl font-semibold tracking-tight text-primary">{fr ? "Connectez-vous pour écrire" : "Sign in to write"}</h1><p className="mt-3 text-sm leading-6 text-muted">{fr ? "Votre espace est réservé à vos brouillons, articles et profil d’auteur." : "Your space is limited to your own drafts, articles, and author profile."}</p></div><label className="form-label">{fr ? "E-mail professionnel" : "Work email"}<span className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><input className="form-input pl-10" type="email" name="email" autoComplete="username" required /></span></label><label className="form-label">{fr ? "Mot de passe" : "Password"}<span className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><input className="form-input pl-10" type="password" name="password" autoComplete="current-password" required /></span></label><button className="btn-primary justify-center" type="submit" disabled={status === "loading"}>{status === "loading" ? (fr ? "Connexion…" : "Signing in…") : (fr ? "Continuer" : "Continue")}</button>{status === "error" ? <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300" role="alert">{fr ? "Identifiants invalides ou compte désactivé." : "Those credentials are invalid or the account is disabled."}</p> : null}<p className="text-xs leading-5 text-muted">{fr ? "Les comptes sont créés par un administrateur teChia. Aucun inscription publique." : "Accounts are created by a teChia administrator. There is no public writer registration."}</p></form>;
}
