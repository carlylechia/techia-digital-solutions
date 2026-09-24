import { siteConfig, type Locale } from "@/content/site";
import type { BlogLocale } from "./constants";

export type { BlogLocale } from "./constants";

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

export function isSafeInternalPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return false;
  try {
    const url = new URL(value, siteConfig.url);
    return url.origin === new URL(siteConfig.url).origin;
  } catch {
    return false;
  }
}

export function normalizeCtaHref(value: string) {
  const clean = value.trim();
  if (!clean) return null;
  if (clean.startsWith("/")) return isSafeInternalPath(clean) ? clean : null;
  try {
    const url = new URL(clean);
    return url.protocol === "https:" || url.protocol === "mailto:" || url.protocol === "tel:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function normalizeCanonicalUrl(value: string) {
  const clean = value.trim();
  if (!clean) return null;
  try {
    const url = new URL(clean);
    if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.protocol === "http:")) return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function getBlogIndexPath(locale: BlogLocale) {
  return `/${locale}/blog`;
}

export function getBlogPostPath(locale: BlogLocale, slug: string) {
  return `/${locale}/blog/${encodeURIComponent(slug)}`;
}

export function getBlogCategoryPath(locale: BlogLocale, slug: string) {
  return `/${locale}/blog/category/${encodeURIComponent(slug)}`;
}

export function getBlogAuthorPath(locale: BlogLocale, slug: string) {
  return `/${locale}/blog/author/${encodeURIComponent(slug)}`;
}

export function isBlogLocale(value: string): value is BlogLocale {
  return value === "en" || value === "fr";
}

export function toBlogLocale(locale: Locale): BlogLocale {
  return locale;
}

export function getAbsoluteBlogPostUrl(locale: BlogLocale, slug: string) {
  return `${siteConfig.url}${getBlogPostPath(locale, slug)}`;
}
