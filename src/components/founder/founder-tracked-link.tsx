"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { emitFounderAnalytics, type FounderAnalyticsParams } from "./founder-analytics";

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:");
}

export function FounderTrackedLink({
  href,
  children,
  className,
  eventName,
  eventParams,
  ariaLabel,
  external,
  download = false
}: {
  href: string;
  children: ReactNode;
  className?: string;
  eventName?: string;
  eventParams?: FounderAnalyticsParams;
  ariaLabel?: string;
  external?: boolean;
  download?: boolean;
}) {
  const shouldOpenExternal = external ?? isExternalHref(href);
  const handleClick = () => emitFounderAnalytics(eventName, eventParams);

  if (shouldOpenExternal || download) {
    return (
      <a
        href={href}
        className={className}
        aria-label={ariaLabel}
        onClick={handleClick}
        {...(shouldOpenExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...(download ? { download: true } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} aria-label={ariaLabel} onClick={handleClick}>
      {children}
    </Link>
  );
}
