import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

const TOKEN_PATTERN =
  /\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<]+)|(\/(?:courses|cours)\/[^\s<),]+)/g;
const TRAILING_PUNCTUATION = /[.,;:!?)\]}\u2019'\"*]+$/;

function trimBareHref(value: string) {
  return value.replace(TRAILING_PUNCTUATION, "");
}

function isSafeHref(href: string) {
  return (
    (href.startsWith("/") && !href.startsWith("//")) ||
    href.startsWith("https://") ||
    href.startsWith("http://") ||
    href.startsWith("mailto:")
  );
}

function isCheckoutHref(href: string) {
  return href.includes("/courses/checkout?item=");
}

function MessageLink({ href, label }: { href: string; label: string }) {
  if (!isSafeHref(href)) return <>{label}</>;

  if (isCheckoutHref(href)) {
    return (
      <Link
        href={href}
        className="mx-0.5 my-1 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {label}
        <ArrowUpRight className="size-3.5" aria-hidden="true" />
      </Link>
    );
  }

  if (href.startsWith("/")) {
    return (
      <Link
        href={href}
        className="font-semibold text-accent underline decoration-accent/40 underline-offset-2 transition hover:text-accent/80"
      >
        {label}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel={href.startsWith("mailto:") ? undefined : "noreferrer noopener"}
      className="font-semibold text-accent underline decoration-accent/40 underline-offset-2 transition hover:text-accent/80"
    >
      {label}
    </a>
  );
}

function renderLine(line: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of line.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(line.slice(lastIndex, index));
    }

    const [full, markdownLabel, markdownHref, bareHttp, bareInternal] = match;
    const rawHref = markdownHref ?? bareHttp ?? bareInternal ?? "";
    const href = markdownHref ? rawHref : trimBareHref(rawHref);
    const label = markdownLabel?.trim() || href;

    if (href) {
      nodes.push(
        <MessageLink key={`${index}-${href}`} href={href} label={label} />,
      );
    }

    lastIndex = index + (markdownHref ? full.length : href.length);
  }

  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }

  return nodes;
}

/**
 * Assistant replies are Markdown-ish text from the model. Rendering links as
 * real anchors is essential: a recommendation or checkout URL must always be
 * clickable, never shown as raw bracket text.
 */
export function AIMessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <>
      {lines.map((line, index) => (
        <span key={index}>
          {renderLine(line)}
          {index < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </>
  );
}
