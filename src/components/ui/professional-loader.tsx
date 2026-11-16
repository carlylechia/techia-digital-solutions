import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A single, reusable "professional" loading indicator used across the app.
 *
 * Variants:
 *  - `inline`   (default) — sits in the flow, good for buttons/panels.
 *  - `overlay`  — absolutely positioned over a relative parent.
 *  - `fullScreen` — fixed, centered, covers the viewport.
 */
export function ProfessionalLoader({
  label,
  size = "md",
  variant = "inline",
  className,
}: {
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "inline" | "overlay" | "fullScreen";
  className?: string;
}) {
  const ringSize = size === "sm" ? "size-6" : size === "lg" ? "size-12" : "size-8";
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        <div className={cn(ringSize, "rounded-full border-2 border-border/60")} />
        <div
          className={cn(
            ringSize,
            "absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent border-r-accent/60"
          )}
        />
        <Loader2 className={cn("absolute inset-0 m-auto animate-pulse text-accent", size === "sm" ? "size-3" : size === "lg" ? "size-5" : "size-4")} />
      </div>
      {label ? <p className={cn("font-medium text-muted", textSize)}>{label}</p> : null}
    </div>
  );

  if (variant === "fullScreen") {
    return (
      <div className="fixed inset-0 z-[100] grid place-items-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }
  if (variant === "overlay") {
    return (
      <div className="absolute inset-0 z-20 grid place-items-center rounded-[inherit] bg-background/75 backdrop-blur-sm">
        {content}
      </div>
    );
  }
  return content;
}

export function StatusBanner({
  tone,
  message,
  className,
}: {
  tone: "success" | "error" | "info";
  message: string;
  className?: string;
}) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? XCircle : Loader2;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium",
        tone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
        tone === "error" && "border-red-500/30 bg-red-500/10 text-red-200",
        tone === "info" && "border-cyan-500/30 bg-cyan-500/10 text-accent",
        className
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "info" && "animate-spin")} />
      <span className="break-words">{message}</span>
    </div>
  );
}
