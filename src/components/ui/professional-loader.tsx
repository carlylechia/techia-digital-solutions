import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A brand-forward, futuristic loading indicator.
 *
 * Built from the teChia palette (tech blue, electric cyan, soft violet, neon
 * mint) with layered orbital rings, a pulsing core and a shimmering label.
 * Drop-in replacement for the previous indicator — same props, richer visuals.
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
  const dimensions = size === "sm" ? "size-16" : size === "lg" ? "size-40" : "size-24";
  const coreSize = size === "sm" ? "size-2" : size === "lg" ? "size-6" : "size-4";
  const labelTextSize = size === "sm" ? "text-[10px]" : size === "lg" ? "text-base" : "text-xs";

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <style>{`
        @keyframes techia-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes techia-orbit-rev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes techia-pulse-glow { 0%,100% { opacity: .55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.18); } }
        @keyframes techia-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .techia-ring { transform-origin: 50% 50%; }
        .techia-ring-1 { animation: techia-orbit 2.6s linear infinite; }
        .techia-ring-2 { animation: techia-orbit-rev 1.9s linear infinite; }
        .techia-ring-3 { animation: techia-orbit 1.3s linear infinite; }
        .techia-core { animation: techia-pulse-glow 1.6s ease-in-out infinite; }
        .techia-shimmer-text {
          background: linear-gradient(90deg, var(--muted) 0%, var(--accent-2) 35%, var(--accent-3) 65%, var(--muted) 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: techia-shimmer 2.4s linear infinite;
        }
      `}</style>

      <div className={cn("relative", dimensions)}>
        {/* ambient glow */}
        <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-accent-2/20 blur-2xl techia-core" />
        <div className="absolute inset-0 -z-10 scale-125 rounded-full bg-accent-3/10 blur-xl" />

        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="techia-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
            <linearGradient id="techia-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>

          {/* outer ring */}
          <g className="techia-ring techia-ring-1">
            <circle cx="50" cy="50" r="46" fill="none" stroke="url(#techia-grad-1)" strokeWidth="1.6" strokeDasharray="40 60 20 200" strokeLinecap="round" />
          </g>
          {/* mid ring */}
          <g className="techia-ring techia-ring-2">
            <circle cx="50" cy="50" r="34" fill="none" stroke="url(#techia-grad-2)" strokeWidth="1.4" strokeDasharray="24 40 12 180" strokeLinecap="round" />
          </g>
          {/* inner ring */}
          <g className="techia-ring techia-ring-3">
            <circle cx="50" cy="50" r="22" fill="none" stroke="#fb7185" strokeWidth="1.2" strokeDasharray="14 30 8 120" strokeLinecap="round" opacity="0.85" />
          </g>
        </svg>

        {/* orbiting node */}
        <div className="techia-ring techia-ring-1 absolute inset-0">
          <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 size-2 rounded-full bg-accent-2 shadow-[0_0_12px_#22d3ee]" />
        </div>

        {/* core */}
        <div className="absolute inset-0 grid place-items-center">
          <div className={cn(coreSize, "rounded-full bg-gradient-to-br from-accent via-accent-2 to-accent-3 shadow-[0_0_24px_rgba(34,211,238,0.55)] techia-core")} />
        </div>
      </div>

      {label ? (
        <p className={cn("techia-shimmer-text font-semibold tracking-wide", labelTextSize)}>{label}</p>
      ) : null}
    </div>
  );

  if (variant === "fullScreen") {
    return (
      <div className="fixed inset-0 z-[100] grid place-items-center bg-background/85 backdrop-blur-md">
        {content}
      </div>
    );
  }
  if (variant === "overlay") {
    return (
      <div className="absolute inset-0 z-20 grid place-items-center rounded-[inherit] bg-background/70 backdrop-blur-md">
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
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium backdrop-blur-sm",
        tone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 shadow-[0_0_24px_rgba(45,212,191,0.12)]",
        tone === "error" && "border-red-500/30 bg-red-500/10 text-red-200 shadow-[0_0_24px_rgba(251,113,133,0.12)]",
        tone === "info" && "border-cyan-500/30 bg-cyan-500/10 text-accent shadow-[0_0_24px_rgba(34,211,238,0.12)]",
        className
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "info" && "animate-spin")} />
      <span className="break-words">{message}</span>
    </div>
  );
}
