"use client";

import { LockKeyhole, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import type { Locale } from "@/content/site";

const copy = {
  en: {
    email: "Admin email",
    password: "Password",
    button: "Sign in",
    loading: "Signing in...",
    error: "The credentials could not be verified.",
    setup: "Use your database-backed admin account. The configured ADMIN_EMAIL and ADMIN_PASSWORD_SEED can bootstrap the first super admin."
  },
  fr: {
    email: "E-mail admin",
    password: "Mot de passe",
    button: "Se connecter",
    loading: "Connexion...",
    error: "Les identifiants n’ont pas pu être vérifiés.",
    setup: "Utilisez votre compte admin lié à la base de données. Les variables ADMIN_EMAIL et ADMIN_PASSWORD_SEED permettent d’amorcer le premier super admin."
  }
} as const;

export function AdminLoginForm({ locale }: { locale: Locale }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const formCopy = copy[locale];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      redirect: false,
      callbackUrl: `/${locale}/admin`
    });

    if (result?.ok) {
      window.location.assign(result.url || `/${locale}/admin`);
      return;
    }

    setStatus("error");
  }

  return (
    <form onSubmit={submit} className="premium-card mx-auto grid w-full max-w-lg gap-4 p-5 sm:p-6 md:p-8">
      <p className="text-sm leading-6 text-muted">{formCopy.setup}</p>
      <label className="form-label">
        {formCopy.email}
        <span className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input className="form-input pl-10" name="email" type="email" autoComplete="username" required />
        </span>
      </label>
      <label className="form-label">
        {formCopy.password}
        <span className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input className="form-input pl-10" name="password" type="password" autoComplete="current-password" required />
        </span>
      </label>
      <button className="btn-primary justify-center" type="submit" disabled={status === "loading"}>
        {status === "loading" ? formCopy.loading : formCopy.button}
      </button>
      {status === "error" ? <p className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-400">{formCopy.error}</p> : null}
    </form>
  );
}
