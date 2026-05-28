import { cn } from "@/lib/utils";

export function GradientOrb({
  className,
  color = "cyan"
}: {
  className?: string;
  color?: "cyan" | "violet" | "mint";
}) {
  const palette =
    color === "violet"
      ? "from-violet-500/28 via-violet-400/12 to-transparent"
      : color === "mint"
        ? "from-emerald-400/28 via-cyan-300/12 to-transparent"
        : "from-cyan-400/28 via-blue-500/12 to-transparent";

  return <div aria-hidden="true" className={cn("pointer-events-none absolute rounded-full bg-gradient-to-br blur-3xl", palette, className)} />;
}
