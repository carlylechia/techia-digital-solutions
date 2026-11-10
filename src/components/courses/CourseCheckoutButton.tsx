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
}: {
  pack: CheckoutTarget;
  label: string;
  sourcePage: string;
  className?: string;
  itemType?: "pack" | "course";
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
          "inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-border bg-surface px-5 py-3 text-center text-sm font-medium text-muted dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400 sm:w-auto",
          className,
        )}
      >
        Price and checkout coming soon
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
        "btn-primary w-full justify-center px-5 py-3 sm:w-auto",
        className,
      )}
    >
      {label}
      {priceMinor ? (
        <span className="ml-1 text-sm font-semibold opacity-90">
          · {formatMoney(priceMinor, currency)}
        </span>
      ) : null}
    </CourseTrackedAnchor>
  );
}
