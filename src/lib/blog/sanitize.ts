import { siteConfig } from "@/content/site";
import { BLOG_MAX_HTML_BYTES } from "./constants";

const allowedTags = new Set([
  "p", "br", "strong", "b", "em", "i", "s", "blockquote", "h2", "h3", "h4", "ul", "ol", "li", "hr", "pre", "code", "a", "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td", "del",
]);
const voidTags = new Set(["br", "hr", "img"]);
const dropContentTags = new Set(["script", "style", "iframe", "object", "embed", "template", "noscript"]);
const allowedAttributes: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "title"]),
  img: new Set(["src", "alt", "title", "width", "height", "loading"]),
  th: new Set(["colspan", "rowspan", "scope"]),
  td: new Set(["colspan", "rowspan"]),
  code: new Set(["class"]),
};

function escapeText(value: string) {
  return value
    .replace(/&(?!(?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[0-9a-f]+);)/gi, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function decodeForUrl(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);?/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&colon;/gi, ":")
    .replace(/&sol;/gi, "/")
    .replace(/&tab;/gi, "\t")
    .replace(/&newline;/gi, "\n")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function isAllowedImageSource(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const hosts = new Set(["res.cloudinary.com", "techiadigital.com", "www.techiadigital.com"]);
    if (process.env.NODE_ENV !== "production") {
      hosts.add("localhost");
      hosts.add("127.0.0.1");
    }
    return hosts.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function isSafeLink(value: string) {
  const normalized = decodeForUrl(value);
  if (normalized.startsWith("/") && !normalized.startsWith("//")) return !value.includes("\\");
  try {
    const url = new URL(value);
    return ["https:", "mailto:", "tel:"].includes(url.protocol.toLowerCase()) || (process.env.NODE_ENV !== "production" && url.protocol.toLowerCase() === "http:");
  } catch {
    return false;
  }
}

function parseAttributes(source: string) {
  const attributes = new Map<string, string>();
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  for (const match of source.matchAll(pattern)) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if (!attributes.has(name)) attributes.set(name, value);
  }
  return attributes;
}

function safeAttributes(tag: string, source: string) {
  const allowed = allowedAttributes[tag];
  if (!allowed) return "";
  const attributes = parseAttributes(source);
  const output: string[] = [];
  for (const [name, rawValue] of attributes) {
    if (!allowed.has(name)) continue;
    const value = rawValue.replace(/[\u0000-\u001f\u007f]/g, "").trim();
    if (name === "href") {
      if (!isSafeLink(value)) continue;
      output.push(`href="${escapeText(value).replace(/"/g, "&quot;")}"`);
      continue;
    }
    if (name === "src") {
      if (!isAllowedImageSource(value)) continue;
      output.push(`src="${escapeText(value).replace(/"/g, "&quot;")}"`);
      continue;
    }
    if (name === "target") {
      if (value !== "_blank") continue;
      output.push('target="_blank"');
      continue;
    }
    if (name === "rel" && tag === "a") {
      output.push('rel="noopener noreferrer"');
      continue;
    }
    if (name === "loading" && tag === "img") {
      output.push('loading="lazy"');
      continue;
    }
    if (name === "alt" || name === "title" || name === "class") {
      output.push(`${name}="${escapeText(value).replace(/"/g, "&quot;")}"`);
      continue;
    }
    if (["width", "height", "colspan", "rowspan"].includes(name) && /^\d{1,5}$/.test(value)) output.push(`${name}="${value}"`);
    if (name === "scope" && ["row", "col", "rowgroup", "colgroup"].includes(value)) output.push(`scope="${value}"`);
  }
  if (tag === "img" && !attributes.get("alt")?.trim()) return "";
  if (tag === "a" && output.some((item) => item.startsWith("target="))) {
    if (!output.some((item) => item.startsWith("rel="))) output.push('rel="noopener noreferrer"');
  }
  return output.length ? ` ${output.join(" ")}` : "";
}

/**
 * A deliberately small, allowlist-only HTML sanitizer for CMS article bodies.
 * Unknown elements are unwrapped; executable/container elements are discarded
 * together with their contents. It intentionally does not support arbitrary
 * HTML, styles, scripts, embeds, or author-controlled attributes.
 */
export function sanitizeArticleHtml(value: string) {
  if (value.length > BLOG_MAX_HTML_BYTES * 2) throw new Error("Article content is too large.");
  const output: string[] = [];
  const openTags: string[] = [];
  let cursor = 0;
  let dropUntil: string | null = null;

  for (const match of value.matchAll(/<!--[\s\S]*?-->|<!\s*[^>]*>|<\s*\/?\s*([a-zA-Z0-9-]+)([^>]*)>/g)) {
    const start = match.index ?? 0;
    if (start > cursor && !dropUntil) output.push(escapeText(value.slice(cursor, start)));
    cursor = start + match[0].length;
    const token = match[0];
    const rawName = match[1]?.toLowerCase();

    if (token.startsWith("<!--") || /^<!\s*/.test(token)) continue;
    if (!rawName) continue;
    const closing = /^<\s*\//.test(token);

    if (dropUntil) {
      if (closing && rawName === dropUntil) dropUntil = null;
      continue;
    }
    if (dropContentTags.has(rawName)) {
      if (!closing && !voidTags.has(rawName)) dropUntil = rawName;
      continue;
    }
    if (!allowedTags.has(rawName)) continue;

    if (closing) {
      const index = openTags.lastIndexOf(rawName);
      if (index < 0) continue;
      while (openTags.length > index) {
        const tag = openTags.pop();
        if (tag) output.push(`</${tag}>`);
      }
      continue;
    }

    const attrs = safeAttributes(rawName, match[2] || "");
    if (rawName === "img" && !attrs.includes(" src=")) continue;
    if (rawName === "a" && !attrs.includes(" href=")) {
      output.push("<span>");
      openTags.push("span");
      continue;
    }
    output.push(`<${rawName}${attrs}>`);
    if (!voidTags.has(rawName)) openTags.push(rawName);
  }

  if (!dropUntil && cursor < value.length) output.push(escapeText(value.slice(cursor)));
  while (openTags.length) {
    const tag = openTags.pop();
    if (tag && allowedTags.has(tag)) output.push(`</${tag}>`);
  }
  const clean = output.join("").replace(/<span>/g, "").replace(/<\/span>/g, "");
  if (Buffer.byteLength(clean, "utf8") > BLOG_MAX_HTML_BYTES) throw new Error("Article content is too large after sanitization.");
  return clean;
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function htmlToPlainText(value: string) {
  return decodeEntities(sanitizeArticleHtml(value).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

export function calculateReadingTime(html: string) {
  return Math.max(1, Math.ceil(htmlToPlainText(html).split(/\s+/).filter(Boolean).length / 220));
}

export function countArticleInternalLinks(html: string) {
  const safe = sanitizeArticleHtml(html);
  const links = safe.match(/<a\b[^>]*href="([^"]+)"/gi) || [];
  return links.filter((link) => {
    const href = link.match(/href="([^"]+)"/i)?.[1] || "";
    if (href.startsWith("/")) return !href.startsWith("//");
    try {
      return new URL(href).origin === new URL(siteConfig.url).origin;
    } catch {
      return false;
    }
  }).length;
}
