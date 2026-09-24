"use client";

import { AtSign, Check, Copy, Mail, Share2 } from "lucide-react";
import { useState } from "react";
import { trackEvent } from "@/components/analytics/analytics";

export function ShareLinks({ url, title, locale }: { url: string; title: string; locale: "en" | "fr" }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const shareText = locale === "fr" ? "Partager cet article" : "Share this article";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackEvent("blog_share_click", { method: "copy", content_group: "blog" });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={shareText}>
      <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted"><Share2 className="size-3.5" />{shareText}</span>
      <a className="icon-button" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><AtSign className="size-4" /></a>
      <a className="icon-button" href={`https://x.com/intent/post?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noopener noreferrer" aria-label="X"><span className="text-xs font-bold">X</span></a>
      <a className="icon-button" href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`} aria-label="Email"><Mail className="size-4" /></a>
      <button type="button" className="icon-button" onClick={copyLink} aria-label={copied ? "Link copied" : "Copy link"}>
        {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}
