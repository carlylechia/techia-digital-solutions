import { cn } from "@/lib/utils";

export function AnimatedGridBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]",
        "[background-image:linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)]",
        "[background-size:46px_46px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]",
        className
      )}
    />
  );
}
