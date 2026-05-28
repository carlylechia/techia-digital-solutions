import { randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import type { PortalLocale } from "@/lib/portal-i18n";

const COOKIE_NAME = "techia_portal_session";
const LOCALE_COOKIE = "techia-portal-locale";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const raw = process.env.PORTAL_JWT_SECRET || process.env.NEXTAUTH_SECRET || "portal-fallback-secret-change-in-production";
  return new TextEncoder().encode(raw);
}

export type PortalSession = {
  clientId: string;
  clientEmail: string;
  clientName: string;
  clientSlug: string;
};

export async function signPortalToken(session: PortalSession) {
  const secret = getSecret();
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret);
}

export async function verifyPortalToken(token: string): Promise<PortalSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.clientId === "string" &&
      typeof payload.clientEmail === "string" &&
      typeof payload.clientName === "string" &&
      typeof payload.clientSlug === "string"
    ) {
      return {
        clientId: payload.clientId,
        clientEmail: payload.clientEmail,
        clientName: payload.clientName,
        clientSlug: payload.clientSlug,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getPortalSession(): Promise<PortalSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyPortalToken(token);
}

/** Read the client's portal locale from the locale cookie, defaulting to "en". */
export async function getPortalLocale(): Promise<PortalLocale> {
  const cookieStore = await cookies();
  const c = cookieStore.get(LOCALE_COOKIE)?.value;
  if (c === "en" || c === "fr") return c;
  return "en";
}

/** Build cookie options for the portal locale preference cookie. */
export function setPortalLocaleCookie(locale: PortalLocale) {
  return {
    name: LOCALE_COOKIE,
    value: locale,
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  };
}

export function setPortalSessionCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    // Cookie must be visible to /api/portal/* endpoints (upload/auth actions).
    path: "/",
    maxAge: MAX_AGE,
  };
}

export function clearPortalSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

/** Generate a random 8-char uppercase portal access code */
export function generatePortalCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = randomBytes(8);
  for (const byte of bytes) {
    code += chars[byte % chars.length];
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

function normalizePortalCode(value: string): string {
  const cleaned = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length <= 4) return cleaned;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
}

function compactPortalCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Validate client email + code, return client data if valid */
export async function validatePortalCredentials(email: string, code: string) {
  const prisma = getPrisma();
  if (!prisma) return null;

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = normalizePortalCode(code);
  const compactCode = compactPortalCode(code);

  const client = await prisma.client.findFirst({
    where: {
      email: { equals: normalizedEmail, mode: "insensitive" },
    },
    include: {
      portalAccess: true,
    },
  });

  if (!client || !client.portalAccess) return null;
  if (!client.portalAccess.isActive) return null;
  if (client.portalAccess.expiresAt && client.portalAccess.expiresAt < new Date()) return null;
  const storedCode = normalizePortalCode(client.portalAccess.code);
  const storedCompactCode = compactPortalCode(client.portalAccess.code);
  if (storedCode !== normalizedCode && storedCompactCode !== compactCode) return null;

  // Update lastUsedAt
  await prisma.clientPortalAccess.update({
    where: { id: client.portalAccess.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    session: {
      clientId: client.id,
      clientEmail: client.email ?? normalizedEmail,
      clientName: client.contactName || client.name,
      clientSlug: client.slug ?? client.id,
    } satisfies PortalSession,
    preferredLocale: (client.preferredLocale as PortalLocale) ?? "en",
  };
}
