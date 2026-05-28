"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function pageView(url: string) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId || typeof window.gtag !== "function") return;
  window.gtag("config", gaId, { page_path: url });
}

function AnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    const query = searchParams.toString();
    pageView(query ? `${pathname}?${query}` : pathname);
  }, [pathname, searchParams]);
  return null;
}

export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") window.gtag("event", name, params || {});
}

export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ name: string; params?: Record<string, string | number | boolean> }>;
      if (custom.detail?.name) trackEvent(custom.detail.name, custom.detail.params);
    };
    window.addEventListener("techia:analytics", handler);
    return () => window.removeEventListener("techia:analytics", handler);
  }, []);

  if (!gaId) {
    return (
      <Suspense fallback={null}>
        <AnalyticsRouteTracker />
      </Suspense>
    );
  }

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}', { anonymize_ip: true });`}
      </Script>
      <Suspense fallback={null}>
        <AnalyticsRouteTracker />
      </Suspense>
    </>
  );
}
