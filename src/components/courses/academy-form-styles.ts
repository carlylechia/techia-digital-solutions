export const ACADEMY_CURRENCY_OPTIONS = ["XAF", "USD", "CAD", "EUR"] as const;

export type AcademyCurrencyOption =
  (typeof ACADEMY_CURRENCY_OPTIONS)[number];

export const academyInputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition placeholder:text-muted/70 focus:border-accent/60 focus:ring-2 focus:ring-accent/25";

export const academyLabelClass =
  "grid gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted";

export const academyHintClass =
  "text-xs font-medium normal-case tracking-normal text-muted";
