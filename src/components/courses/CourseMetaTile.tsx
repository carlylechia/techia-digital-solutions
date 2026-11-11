import type { ReactNode } from "react";

/**
 * Uniform info tile for course/pack cards: small icon chip on the left,
 * tiny uppercase label and a truncated value on the right. Every tile in a
 * grid is the same height so card layouts stay aligned.
 */
export function CourseMetaTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-[0.9rem] border border-border bg-background/60 px-3 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-[0.65rem] bg-cyan-500/10 text-cyan-700 transition-colors group-hover:bg-cyan-500/15 dark:bg-cyan-400/10 dark:text-cyan-400">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
          {label}
        </span>
        <span className="block truncate text-sm font-semibold text-primary">
          {value}
        </span>
      </span>
    </div>
  );
}
