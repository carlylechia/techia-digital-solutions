import "server-only";

import { timingSafeEqual } from "node:crypto";

/**
 * Cron authentication.
 *
 * The existing blog cron route validates `Authorization: Bearer <CRON_SECRET>`
 * with a constant-time comparison. This module is the shared, reusable form of
 * that same check so every new outreach endpoint behaves identically instead of
 * re-inventing the check.
 *
 * It also enforces a non-GET method requirement, so a cron job can never be
 * triggered by a link, a prefetch or an image tag in a page.
 */

export type CronAuthResult = { ok: true } | { ok: false; status: 401 | 405 | 503; error: string };

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyCronAuthorization(request: Request): CronAuthResult {
  if (request.method !== "GET" && request.method !== "POST") {
    return { ok: false, status: 405, error: "Method not allowed." };
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return { ok: false, status: 503, error: "Scheduled jobs are not configured." };
  }

  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const provided = header.slice("Bearer ".length);
  if (!constantTimeEqual(provided, secret)) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true };
}

export const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;
