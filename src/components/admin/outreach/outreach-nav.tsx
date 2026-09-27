import Link from "next/link";

/**
 * Shared outreach sub-navigation presentational pieces. The tab strip itself is
 * a client component because it needs the live pathname.
 */

export function OutreachPager({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-sm text-muted">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-primary transition-colors hover:border-accent"
          >
            ← Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            href={buildHref(page + 1)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-primary transition-colors hover:border-accent"
          >
            Next →
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function OutreachStatusBanner({
  sendingEnabled,
  environment,
  reason,
  googlePlaces,
  emailProvider,
}: {
  sendingEnabled: boolean;
  environment: string;
  reason: string;
  googlePlaces: boolean;
  emailProvider: boolean;
}) {
  const bannerClass = sendingEnabled
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
    : "border-amber-500/40 bg-amber-500/10 text-amber-200";

  return (
    <div role="status" className={`rounded-[1.25rem] border px-4 py-3 text-sm ${bannerClass}`}>
      <p className="font-bold uppercase tracking-[0.16em]">Outreach sending: {sendingEnabled ? "enabled" : "disabled"}</p>
      <p className="mt-1 leading-6 opacity-90">{reason}</p>
      <p className="mt-2 text-xs opacity-80">
        Environment: {environment} · Google Places: {googlePlaces ? "configured" : "not configured"} · Email provider:{" "}
        {emailProvider ? "configured" : "not configured"}
      </p>
    </div>
  );
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}
