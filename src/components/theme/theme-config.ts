export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "techia-theme";
export const DEFAULT_THEME: Theme = "dark";
export const ENABLE_SYSTEM_THEME = true;

export function getInitialThemeScript({
  storageKey = THEME_STORAGE_KEY,
  defaultTheme = DEFAULT_THEME,
  enableSystem = ENABLE_SYSTEM_THEME
}: {
  storageKey?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
}) {
  return `(function(){try{var key=${JSON.stringify(storageKey)};var stored=localStorage.getItem(key);var theme=stored==="light"||stored==="dark"||stored==="system"?stored:${JSON.stringify(defaultTheme)};var system=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";var resolved=theme==="system"&&${enableSystem ? "true" : "false"}?system:(theme==="light"?"light":"dark");var root=document.documentElement;root.classList.toggle("dark",resolved==="dark");root.style.colorScheme=resolved;}catch(error){var fallback=document.documentElement;fallback.classList.toggle("dark",${defaultTheme === "dark" ? "true" : "false"});fallback.style.colorScheme=${JSON.stringify(defaultTheme === "light" ? "light" : "dark")};}})();`;
}
