"use client";

import { useEffect } from "react";
import type { Locale } from "@/content/site";
import { emitFounderAnalytics } from "./founder-analytics";

export function FounderPageAnalytics({ locale }: { locale: Locale }) {
  useEffect(() => {
    emitFounderAnalytics("founder_page_view", { locale });
  }, [locale]);

  return null;
}
