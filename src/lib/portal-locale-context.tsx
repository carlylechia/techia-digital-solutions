"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getPortalDict, type PortalLocale, type PortalDict } from "@/lib/portal-i18n";

type PortalLocaleContextValue = {
  locale: PortalLocale;
  t: PortalDict;
};

const PortalLocaleContext = createContext<PortalLocaleContextValue | null>(null);

export function PortalLocaleProvider({
  locale,
  children,
}: {
  locale: PortalLocale;
  children: ReactNode;
}) {
  return (
    <PortalLocaleContext.Provider value={{ locale, t: getPortalDict(locale) }}>
      {children}
    </PortalLocaleContext.Provider>
  );
}

export function usePortalLocale(): PortalLocaleContextValue {
  const ctx = useContext(PortalLocaleContext);
  if (!ctx) {
    // Graceful fallback — component rendered outside provider
    const locale: PortalLocale = "en";
    return { locale, t: getPortalDict(locale) };
  }
  return ctx;
}
