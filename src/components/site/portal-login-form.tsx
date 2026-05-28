"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { getPortalDict, type PortalLocale } from "@/lib/portal-i18n";

export function PortalLoginForm({ locale = "en" }: { locale?: PortalLocale }) {
  const t = getPortalDict(locale).login;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function formatCode(value: string) {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (cleaned.length > 4) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
    }
    return cleaned;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      const data = await res.json() as { error?: string; success?: boolean };

      if (!res.ok || !data.success) {
        setError(data.error || t.errors.invalidCredentials);
        setLoading(false);
        return;
      }

      router.push("/client-portal");
      router.refresh();
    } catch {
      setError(t.errors.networkError);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <label className="grid gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t.emailLabel}
        </span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-cyan-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t.codeLabel}
        </span>
        <div className="relative">
          <input
            type={showCode ? "text" : "password"}
            name="code"
            autoComplete="one-time-code"
            required
            placeholder="XXXX-XXXX"
            value={code}
            onChange={(e) => setCode(formatCode(e.target.value))}
            maxLength={9}
            disabled={loading}
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-3 pr-12 font-mono text-sm uppercase tracking-[0.16em] text-white placeholder:text-slate-600 placeholder:tracking-normal outline-none transition focus:border-cyan-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50 sm:px-4 sm:tracking-[0.2em]"
          />
          <button
            type="button"
            onClick={() => setShowCode((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 transition hover:text-slate-300"
            aria-label={showCode ? t.hideCode : t.showCode}
            tabIndex={-1}
          >
            {showCode ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </label>

      <button
        type="submit"
        disabled={loading || !email || !code}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-cyan-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t.submitting}
          </>
        ) : (
          <>
            <LogIn className="size-4" />
            {t.submit}
          </>
        )}
      </button>
    </form>
  );
}
