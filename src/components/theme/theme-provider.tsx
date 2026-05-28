"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  DEFAULT_THEME,
  ENABLE_SYSTEM_THEME,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type Theme
} from "./theme-config";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

type ThemeProviderProps = {
  children: ReactNode;
  attribute?: "class";
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(theme: Theme, enableSystem: boolean, systemTheme: ResolvedTheme) {
  if (theme === "system" && enableSystem) return systemTheme;
  return theme === "light" ? "light" : "dark";
}

function applyTheme(attribute: "class", theme: ResolvedTheme) {
  const root = document.documentElement;

  if (attribute === "class") {
    root.classList.toggle("dark", theme === "dark");
  }

  root.style.colorScheme = theme;
}

function readStoredTheme(storageKey: string, defaultTheme: Theme) {
  if (typeof window === "undefined") return defaultTheme;

  const stored = window.localStorage.getItem(storageKey);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }

  return defaultTheme;
}

function temporarilyDisableTransitions() {
  const style = document.createElement("style");
  style.appendChild(document.createTextNode("*{transition:none!important}"));
  document.head.appendChild(style);

  return () => {
    void window.getComputedStyle(document.body);
    window.setTimeout(() => {
      style.remove();
    }, 0);
  };
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = DEFAULT_THEME,
  enableSystem = ENABLE_SYSTEM_THEME,
  disableTransitionOnChange = true,
  storageKey = THEME_STORAGE_KEY
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme(storageKey, defaultTheme));
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      const nextTheme = mediaQuery.matches ? "dark" : "light";
      setSystemTheme((currentTheme) => (currentTheme === nextTheme ? currentTheme : nextTheme));
    };

    mediaQuery.addEventListener("change", syncSystemTheme);

    return () => {
      mediaQuery.removeEventListener("change", syncSystemTheme);
    };
  }, []);

  const resolvedTheme = resolveTheme(theme, enableSystem, systemTheme);

  useEffect(() => {
    const restoreTransitions = disableTransitionOnChange ? temporarilyDisableTransitions() : undefined;
    applyTheme(attribute, resolvedTheme);
    restoreTransitions?.();
  }, [attribute, disableTransitionOnChange, resolvedTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      systemTheme,
      setTheme(nextTheme) {
        setThemeState(nextTheme);
        window.localStorage.setItem(storageKey, nextTheme);
      }
    }),
    [resolvedTheme, storageKey, systemTheme, theme]
  );
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
