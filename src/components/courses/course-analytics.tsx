"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  trackCourseEvent,
  type CourseEventName,
} from "@/lib/analytics/courseEvents";

type AnalyticsParams = Record<string, string | number | boolean | undefined>;

function cleanParams(params?: AnalyticsParams) {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(
      (entry): entry is [string, string | number | boolean] =>
        entry[1] !== undefined &&
        !(typeof entry[1] === "string" && entry[1].length === 0),
    ),
  );
}

export function CoursePageAnalytics({
  name,
  params,
}: {
  name: CourseEventName;
  params?: AnalyticsParams;
}) {
  useEffect(() => {
    trackCourseEvent(name, cleanParams(params));
  }, [name, params]);

  return null;
}

export function CourseTrackedLink({
  eventName,
  eventParams,
  children,
  onClick,
  ...props
}: ComponentPropsWithoutRef<typeof Link> & {
  eventName?: CourseEventName;
  eventParams?: AnalyticsParams;
  children: ReactNode;
}) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        if (eventName) trackCourseEvent(eventName, cleanParams(eventParams));
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}

export function CourseTrackedAnchor({
  eventName,
  eventParams,
  children,
  onClick,
  ...props
}: ComponentPropsWithoutRef<"a"> & {
  eventName?: CourseEventName;
  eventParams?: AnalyticsParams;
  children: ReactNode;
}) {
  return (
    <a
      {...props}
      onClick={(event) => {
        if (eventName) trackCourseEvent(eventName, cleanParams(eventParams));
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
