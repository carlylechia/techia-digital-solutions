import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function InfiniteMarquee({
  items,
  direction = "left",
  speed = "32s",
  className,
  itemClassName
}: {
  items: string[];
  direction?: "left" | "right";
  speed?: string;
  className?: string;
  itemClassName?: string;
}) {
  const repeatedItems = [...items, ...items];

  return (
    <div className={cn("marquee-shell", className)}>
      <div
        className="marquee-track"
        data-mode="auto"
        data-direction={direction}
        style={{ "--marquee-duration": speed } as CSSProperties}
      >
        {repeatedItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className={cn(
              "marquee-item inline-flex items-center gap-3 rounded-full border border-border bg-surface-strong px-4 py-2 text-sm font-medium text-foreground shadow-[0_16px_34px_rgba(8,20,36,0.08)] backdrop-blur-xl",
              itemClassName
            )}
            aria-hidden={index >= items.length}
          >
            <span className="size-1.5 rounded-full bg-accent-2" aria-hidden="true" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
