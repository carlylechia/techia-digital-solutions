"use client";

import { useEffect } from "react";
import { trackEvent } from "@/components/analytics/analytics";

export function BlogArticleView({ slug, category }: { slug: string; category?: string }) {
  useEffect(() => {
    trackEvent("blog_article_view", { content_group: "blog", post_slug: slug, category: category || "uncategorized" });
  }, [slug, category]);
  return null;
}
