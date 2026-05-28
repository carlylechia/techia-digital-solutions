export type FounderAnalyticsParams = Record<string, string | number | boolean>;

export function emitFounderAnalytics(name?: string, params?: FounderAnalyticsParams) {
  if (!name || typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("techia:analytics", {
      detail: { name, params }
    })
  );
}
