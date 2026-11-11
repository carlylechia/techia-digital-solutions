"use client";

import { CourseTrackedAnchor } from "@/components/courses/course-analytics";
import type { CoursePack } from "@/lib/courses/coursePacks";
import { formatMoney } from "@/lib/payments/money";
import { cn } from "@/lib/utils";

type CheckoutTarget =
  | Pick<
      CoursePack,
      "id" | "slug" | "title" | "checkoutUrl" | "priceMinor" | "priceCurrency"
    >
  | {
      id: string;
      slug: string;
      title: string;
      checkoutUrl?: string | null;
      priceMinor?: number | null;
      priceCurrency?: string;
    };

export function CourseCheckoutButton({
  pack,
  label,
  sourcePage,
  className,
  itemType = "pack",
  showPrice = true,
}: {
  pack: CheckoutTarget;
  label: string;
  sourcePage: string;
  className?: string;
  itemType?: "pack" | "course";
  /** Cards pass false and render the price themselves; the button stays short. */
  showPrice?: boolean;
}) {
  const priceMinor =
    typeof pack.priceMinor === "number" && pack.priceMinor > 0
      ? pack.priceMinor
      : null;
  const currency = pack.priceCurrency || "XAF";
  const checkoutHref = priceMinor
    ? `/courses/checkout?item=${itemType}:${encodeURIComponent(pack.slug)}`
    : pack.checkoutUrl;

  if (!checkoutHref) {
    return (
      <span
        aria-disabled="true"
        className={cn(
          "inline-flex min-w-0 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-center text-sm font-medium text-muted dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400",
          className,
        )}
      >
        <span className="min-w-0 truncate">Price and checkout coming soon</span>
      </span>
    );
  }

  const isInternal = Boolean(priceMinor);

  return (
    <CourseTrackedAnchor
      href={checkoutHref}
      target={isInternal ? undefined : "_blank"}
      rel={isInternal ? undefined : "noreferrer"}
      eventName={isInternal ? "academy_checkout_click" : "chariow_checkout_click"}
      eventParams={{
        pack_id: pack.id,
        pack_slug: pack.slug,
        pack_title: pack.title,
        item_type: itemType,
        source_page: sourcePage,
      }}
      className={cn(
        "btn-primary min-w-0 w-full justify-center px-5 py-3 sm:w-auto",
        className,
      )}
    >
      <span className="min-w-0 truncate">{label}</span>
      {showPrice && priceMinor ? (
        <span className="ml-1 shrink-0 text-sm font-semibold opacity-90">
          · {formatMoney(priceMinor, currency)}
        </span>
      ) : null}
    </CourseTrackedAnchor>
  );
}
