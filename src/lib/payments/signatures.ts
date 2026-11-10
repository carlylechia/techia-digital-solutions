import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Chariow signs the raw request body with an HMAC-SHA256 digest prefixed with
 * `sha256=`. The prefix is part of the contract and unsupported schemes must be
 * rejected rather than compared.
 */
export function createChariowSignature(rawBody: string, secret: string) {
  return `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
}

export function verifyChariowSignature(
  rawBody: string,
  headerValue: string | null,
  secret: string,
) {
  if (!headerValue || !headerValue.startsWith("sha256=")) return false;
  const received = headerValue.slice("sha256=".length);
  if (!/^[a-f0-9]{64}$/i.test(received)) return false;
  return safeEqual(createChariowSignature(rawBody, secret), headerValue);
}

/**
 * Moneroo sends a bare lowercase HMAC-SHA256 hex digest in
 * `X-Moneroo-Signature`.
 */
export function createMonerooSignature(rawBody: string, secret: string) {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function verifyMonerooSignature(
  rawBody: string,
  headerValue: string | null,
  secret: string,
) {
  if (!headerValue || !/^[a-f0-9]{64}$/i.test(headerValue)) return false;
  return safeEqual(createMonerooSignature(rawBody, secret), headerValue);
}

export function sha256Hex(rawBody: string) {
  return createHash("sha256").update(rawBody).digest("hex");
}

function safeEqual(expected: string, received: string) {
  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(received, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
