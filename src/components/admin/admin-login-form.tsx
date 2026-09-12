"use client";

import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import type { Locale } from "@/content/site";

const copy = {
  en: {
    badge: "Restricted workspace",
    title: "Sign in to the admin workspace",
    intro:
      "Use your approved teChia admin credentials to access operations, delivery, and account controls.",
    email: "Work email",
    emailPlaceholder: "name@techiadigital.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    button: "Continue",
    loading: "Signing in...",
    error:
      "We couldn't verify those credentials. Check your email and password and try again.",
    help: "Only authorized team members can access this workspace.",
  },
  fr: {
    badge: "Espace restreint",
    title: "Connexion à l’espace admin",
    intro:
      "Utilisez vos identifiants admin teChia approuvés pour accéder aux opérations, à la livraison et aux contrôles d’accès.",
    email: "E-mail professionnel",
    emailPlaceholder: "nom@techiadigital.com",
    password: "Mot de passe",
    passwordPlaceholder: "Saisissez votre mot de passe",
    button: "Continuer",
    loading: "Connexion...",
    error:
      "Nous n’avons pas pu vérifier ces identifiants. Vérifiez votre e-mail et votre mot de passe puis réessayez.",
    help: "L’accès à cet espace est réservé aux membres d’équipe autorisés.",
  },
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
      callbackUrl: "/admin",
    });

    if (result?.ok) {
      window.location.assign(result.url || "/admin");
      return;
    }

    setStatus("error");
  }

  return (
    <form
      onSubmit={submit}
      className="premium-card mx-auto grid w-full max-w-xl gap-5 p-5 sm:p-6 md:p-8 xl:max-w-none"
    >
      <div className="grid gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface-strong px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
          <ShieldCheck className="size-4 text-accent" />
          {formCopy.badge}
        </span>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-primary sm:text-[2rem]">
            {formCopy.title}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-[0.95rem]">
            {formCopy.intro}
          </p>
        </div>
      </div>

      <label className="form-label">
        {formCopy.email}
        <span className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            className="form-input pl-10"
            name="email"
            type="email"
            autoComplete="username"
            placeholder={formCopy.emailPlaceholder}
            required
          />
        </span>
      </label>
      <label className="form-label">
        {formCopy.password}
        <span className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            className="form-input pl-10"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder={formCopy.passwordPlaceholder}
            required
          />
        </span>
      </label>
      <button
        className="btn-primary justify-center"
        type="submit"
        disabled={status === "loading"}
      >
        {status === "loading" ? formCopy.loading : formCopy.button}
      </button>
      {status === "error" ? (
        <p className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-400">
          {formCopy.error}
        </p>
      ) : null}
      <p className="text-xs leading-6 text-muted">{formCopy.help}</p>
    </form>
  );
}
