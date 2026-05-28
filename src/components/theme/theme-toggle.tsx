"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";
import { getDictionary, type Locale } from "@/content/site";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

export function ThemeToggle({
  locale,
  label,
  className
}: {
  locale?: Locale;
  label?: string;
  className?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const fallbackLabel = locale ? getDictionary(locale).ui.toggleTheme : "Toggle theme";
  const isDark = resolvedTheme !== "light";

  useEffect(() => {
    // This is a safe use of setState in an effect to prevent hydration mismatches
    // by ensuring the component only renders interactive content on the client
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn("icon-button", className)}
        aria-label={label || fallbackLabel}
        disabled
      >
        <MoonStar className="size-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cn("icon-button", className)}
      aria-label={label || fallbackLabel}
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
    </button>
  );
}
