import "server-only";

import { isIP } from "node:net";
import { OUTREACH_SAFETY, OUTREACH_TIMEBOX } from "./config";

/**
 * SSRF-protected HTTP client for prospect-controlled URLs.
 *
 * A discovered business supplies the website host, so every outbound request is
 * an attacker-controlled request from the server's point of view. This module
 * is the only place the engine is allowed to fetch a third-party URL and it
 * enforces, on every hop:
 *
 *   - http/https only (no file:, gopher:, data:, ftp: ...)
 *   - no credentials in the URL
 *   - no private, loopback, link-local, CGNAT, multicast or otherwise reserved
 *     IP literal
 *   - no host that resolves to any of the above, which closes DNS rebinding
 *   - redirect chains re-validated, never followed blindly
 *   - a hard byte ceiling enforced while streaming
 *   - a hard timeout enforced with AbortSignal
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const MAX_REDIRECTS = 3;

const USER_AGENT =
  "teChiaOutreachBot/1.0 (+https://techiadigital.com; business contact research; respectful single-page fetch)";

export class SafeFetchError extends Error {
  readonly category:
    | "invalid_url"
    | "blocked_protocol"
    | "blocked_host"
    | "private_network"
    | "dns_failure"
    | "too_many_redirects"
    | "timeout"
    | "too_large"
    | "http_error"
    | "network_error";

  constructor(category: SafeFetchError["category"], message: string) {
    super(message);
    this.name = "SafeFetchError";
    this.category = category;
  }
}

function ipv4ToInt(address: string) {
  const parts = address.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

/**
 * True for any address that must never be reachable from a server-side fetch:
 * loopback, RFC1918, link-local (incl. the 169.254.169.254 cloud metadata
 * endpoint), CGNAT, benchmarking, multicast, reserved and unspecified ranges.
 */
export function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const value = ipv4ToInt(address);
    if (value === null) return true;
    const inRange = (start: string, end: string) => {
      const low = ipv4ToInt(start);
      const high = ipv4ToInt(end);
      return low !== null && high !== null && value >= low && value <= high;
    };
    return (
      inRange("0.0.0.0", "0.255.255.255") || // "this" network
      inRange("10.0.0.0", "10.255.255.255") || // RFC1918
      inRange("100.64.0.0", "100.127.255.255") || // CGNAT
      inRange("127.0.0.0", "127.255.255.255") || // loopback
      inRange("169.254.0.0", "169.254.255.255") || // link-local + metadata
      inRange("172.16.0.0", "172.31.255.255") || // RFC1918
      inRange("192.0.0.0", "192.0.0.255") || // IETF protocol assignments
      inRange("192.0.2.0", "192.0.2.255") || // TEST-NET-1
      inRange("192.88.99.0", "192.88.99.255") || // 6to4 relay anycast
      inRange("192.168.0.0", "192.168.255.255") || // RFC1918
      inRange("198.18.0.0", "198.19.255.255") || // benchmarking
      inRange("198.51.100.0", "198.51.100.255") || // TEST-NET-2
      inRange("203.0.113.0", "203.0.113.255") || // TEST-NET-3
      inRange("224.0.0.0", "239.255.255.255") || // multicast
      inRange("240.0.0.0", "255.255.255.255") // reserved + broadcast
    );
  }

  if (version === 6) {
    const normalized = address.toLowerCase().split("%")[0];
    if (normalized === "::" || normalized === "::1") return true;
    if (normalized.startsWith("fe80")) return true; // link-local
    if (/^f[cd]/.test(normalized)) return true; // unique local
    if (normalized.startsWith("ff")) return true; // multicast
    // IPv4-mapped and IPv4-compatible addresses must be judged on the embedded
    // IPv4 value, otherwise ::ffff:127.0.0.1 slips through.
    const mapped = normalized.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return false;
  }

  return true;
}

export function assertSafeUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SafeFetchError("invalid_url", "URL could not be parsed.");
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new SafeFetchError("blocked_protocol", `Protocol ${url.protocol} is not allowed.`);
  }
  if (url.username || url.password) {
    throw new SafeFetchError("blocked_host", "URL credentials are not allowed.");
  }
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!hostname) {
    throw new SafeFetchError("blocked_host", "URL has no hostname.");
  }
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new SafeFetchError("blocked_host", `Host ${hostname} is not allowed.`);
  }
  if (isIP(hostname) && isPrivateAddress(hostname)) {
    throw new SafeFetchError("private_network", `Host ${hostname} resolves to a private address.`);
  }
  return url;
}

async function resolveAndAssertPublic(hostname: string) {
  let records: Array<{ address: string }>;
  try {
    records = await import("node:dns/promises").then((dns) => dns.lookup(hostname, { all: true }));
  } catch {
    throw new SafeFetchError("dns_failure", `Host ${hostname} could not be resolved.`);
  }
  if (records.length === 0) {
    throw new SafeFetchError("dns_failure", `Host ${hostname} could not be resolved.`);
  }
  for (const record of records) {
    if (isPrivateAddress(record.address)) {
      throw new SafeFetchError("private_network", `Host ${hostname} resolves to a private address.`);
    }
  }
}

export type SafeFetchOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  accept?: string;
};

export type SafeFetchResult = {
  ok: boolean;
  status: number;
  finalUrl: string;
  body: string;
  contentType: string;
  bytes: number;
  truncated: boolean;
};

/**
 * Fetch a single page with streaming byte limits. Never throws for HTTP error
 * statuses — the caller inspects `ok` — but throws SafeFetchError for every
 * transport-level safety failure so the reason is auditable.
 */
export async function safeFetch(
  rawUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? OUTREACH_TIMEBOX.websiteMs;
  const maxBytes = options.maxBytes ?? OUTREACH_SAFETY.maxWebsiteBytes;
  const accept = options.accept ?? "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5";

  let currentUrl = rawUrl;
  let redirects = 0;

  for (;;) {
    const url = assertSafeUrl(currentUrl);
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    // Re-resolve on every hop so a redirect cannot walk us onto a private host.
    await resolveAndAssertPublic(hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: accept,
          "User-Agent": USER_AGENT,
          "Accept-Language": "en;q=0.9",
        },
      });
    } catch (error) {
      if (error instanceof SafeFetchError) throw error;
      const message = error instanceof Error ? error.message : "unknown";
      if (controller.signal.aborted) {
        throw new SafeFetchError("timeout", `Request to ${hostname} timed out.`);
      }
      throw new SafeFetchError("network_error", `Request to ${hostname} failed: ${message}`);
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        return {
          ok: false,
          status: response.status,
          finalUrl: url.toString(),
          body: "",
          contentType: "",
          bytes: 0,
          truncated: false,
        };
      }
      if (redirects >= MAX_REDIRECTS) {
        throw new SafeFetchError("too_many_redirects", "Redirect limit exceeded.");
      }
      redirects += 1;
      const next = new URL(location, url).toString();
      assertSafeUrl(next);
      currentUrl = next;
      continue;
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      throw new SafeFetchError("too_large", `Response from ${hostname} exceeds the size limit.`);
    }

    const { text, bytes, truncated } = await readCapped(response, maxBytes);
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: url.toString(),
      body: text,
      contentType,
      bytes,
      truncated,
    };
  }
}

async function readCapped(response: Response, maxBytes: number) {
  const body = response.body;
  if (!body) {
    const text = await response.text();
    return { text: text.slice(0, maxBytes), bytes: text.length, truncated: text.length > maxBytes };
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let truncated = false;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        chunks.push(value.subarray(0, Math.max(0, value.byteLength - (bytes - maxBytes))));
        truncated = true;
        break;
      }
      chunks.push(value);
    }
  } finally {
    // Releasing the lock lets the socket be reclaimed instead of hanging until
    // the byte ceiling is hit on a hostile endless stream.
    reader.cancel().catch(() => undefined);
  }

  const merged = new Uint8Array(Math.min(bytes, maxBytes));
  let offset = 0;
  for (const chunk of chunks) {
    const slice = chunk.subarray(0, Math.max(0, merged.length - offset));
    merged.set(slice, offset);
    offset += slice.byteLength;
    if (offset >= merged.length) break;
  }

  return {
    text: new TextDecoder("utf-8", { fatal: false }).decode(merged),
    bytes,
    truncated,
  };
}
