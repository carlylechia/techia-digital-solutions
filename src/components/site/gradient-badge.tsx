import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GradientBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-cyan-300/20 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#07111F] shadow-[0_12px_30px_rgba(37,99,235,0.08)] backdrop-blur",
        "dark:border-white/12 dark:bg-white/[0.08] dark:text-white/85 dark:shadow-none",
        className
      )}
    >
      {children}
    </span>
  );
}
