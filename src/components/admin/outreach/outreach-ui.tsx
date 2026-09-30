import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/outreach/constants";

/**
 * Outreach console primitives.
 *
 * These intentionally mirror the visual language already used by the teChia admin
 * workspace — the same accent colour, panel, border, pill and table treatments —
 * so the new section reads as part of the product rather than a bolt-on. No new UI
 * framework and no new colour tokens are introduced.
 */

export function OutreachPanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("gradient-border rounded-[2rem]", className)}>
      <div className="elevated-panel p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function OutreachPill({ children, tone = "default" }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold break-words whitespace-normal",
        tone === "good" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        tone === "warn" && "border-amber-500/30 bg-amber-500/10 text-amber-300",
        tone === "danger" && "border-red-500/30 bg-red-500/10 text-red-300",
        tone === "quiet" && "border-border bg-background text-muted",
        tone === "default" && "border-cyan-500/30 bg-cyan-500/10 text-accent"
      )}
    >
      {children}
    </span>
  );
}

export function OutreachStatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: Tone;
}) {
  const isLongText = typeof value === "string" && value.length > 20;
  return (
    <div className="subtle-tile rounded-[1.25rem] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p
        className={cn(
          "mt-2 font-semibold tabular-nums",
          isLongText ? "break-all text-lg" : "text-3xl",
          tone === "danger" && "text-red-300",
          tone === "warn" && "text-amber-300",
          tone === "good" && "text-emerald-300",
          tone === "quiet" && "text-muted",
          tone === "default" && "text-primary"
        )}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function OutreachEmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-background p-6 text-center">
      <p className="text-sm font-semibold text-primary">{title}</p>
      {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
    </div>
  );
}

export function OutreachTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-border bg-surface", className)}>
      <table className="w-full min-w-[720px] text-sm">{children}</table>
    </div>
  );
}

export function OutreachTh({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 text-left font-medium text-muted", className)}>{children}</th>;
}

export function OutreachTd({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top text-primary", className)}>{children}</td>;
}

export function OutreachTr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn("border-b border-border/50 last:border-0 hover:bg-surface/50", className)}>{children}</tr>;
}

export function OutreachButton({
  children,
  className,
  tone = "default",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        tone === "danger" && "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
        tone === "good" && "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20",
        tone === "warn" && "border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20",
        tone === "quiet" && "border border-border bg-background text-muted hover:text-primary",
        tone === "default" && "bg-accent text-[#001018] hover:opacity-90",
        className
      )}
    >
      {children}
    </button>
  );
}

export function OutreachField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-semibold text-primary">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const outreachInputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary outline-none focus:border-accent";

export function OutreachBar({ value, max, tone = "default" }: { value: number; max: number; tone?: Tone }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border" role="presentation">
      <div
        className={cn(
          "h-full rounded-full",
          tone === "danger" ? "bg-red-400" : tone === "warn" ? "bg-amber-400" : tone === "good" ? "bg-emerald-400" : "bg-accent"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
