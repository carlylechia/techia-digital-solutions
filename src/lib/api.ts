import { NextResponse, type NextRequest } from "next/server";
import { isLocale, type Locale } from "@/content/site";

type ApiErrorCode = "invalid_payload" | "rate_limited" | "server_error";

const messages = {
  en: {
    invalid_payload: "Invalid payload",
    rate_limited: "Too many requests",
    server_error: "We could not process the request right now"
  },
  fr: {
    invalid_payload: "Données invalides",
    rate_limited: "Trop de requêtes",
    server_error: "Impossible de traiter la demande pour le moment"
  }
} satisfies Record<Locale, Record<ApiErrorCode, string>>;

export async function readRequestJson(request: NextRequest, maxBytes = 24_000) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxBytes) return null;
  const raw = await request.json().catch(() => null);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

export function payloadLocale(raw: Record<string, unknown> | null): Locale {
  const locale = typeof raw?.locale === "string" ? raw.locale : "";
  return isLocale(locale) ? locale : "en";
}

export function apiError(code: ApiErrorCode, status: number, locale: Locale, init?: ResponseInit) {
  return NextResponse.json({ error: messages[locale][code], code }, { status, ...init });
}

export function apiOk(payload: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: true, ...payload });
}
