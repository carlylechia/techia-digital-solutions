/**
 * WhatsApp link helpers.
 *
 * Configuration values are entered by hand in environment files and hosting
 * dashboards, so they show up in many shapes: `+237 653 262 837`,
 * `wa.me/237653262837`, `https://api.whatsapp.com/send?phone=...`, or a quoted
 * copy/paste of any of those. Every helper here returns either an absolute
 * `http(s)` URL or an empty string — never a relative href, which browsers
 * would resolve against the current site and land on a 404 page.
 */

function cleanValue(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

/** Extract the recipient number from a bare number or any WhatsApp URL. */
export function whatsappDigits(value: string) {
  const candidate = cleanValue(value);
  if (!candidate) return "";

  // Full or scheme-less canonical links: wa.me/<number>, www.wa.me/<number>.
  const waMeMatch = candidate.match(/(?:^|\/\/)(?:www\.)?wa\.me\/(\d+)/i);
  if (waMeMatch) return waMeMatch[1];

  // Click-to-chat links: api.whatsapp.com/send?phone=<number>.
  const phoneMatch = candidate.match(/[?&]phone=([^&#]+)/i);
  if (phoneMatch) {
    try {
      return decodeURIComponent(phoneMatch[1]).replace(/\D/g, "");
    } catch {
      return phoneMatch[1].replace(/\D/g, "");
    }
  }

  return candidate.replace(/\D/g, "");
}

/**
 * Build a canonical `https://wa.me/<digits>` link.
 *
 * Returns an empty string when no usable recipient can be found, so callers
 * can hide the CTA or fall back to another destination.
 */
export function whatsappLink(numberOrUrl: string, message?: string) {
  const digits = whatsappDigits(numberOrUrl);
  if (!digits) return "";
  const encoded = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${encoded}`;
}

function isWhatsappHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return (
    host === "wa.me" ||
    host === "whatsapp.com" ||
    host.endsWith(".whatsapp.com")
  );
}

/**
 * Normalize any configured WhatsApp destination into an absolute URL.
 *
 * Returns `null` when the value cannot be understood, allowing callers to fall
 * back to the configured official number instead of emitting a broken href.
 */
export function normalizeWhatsappUrl(
  value: string,
  message?: string,
): string | null {
  const candidate = cleanValue(value);
  if (!candidate) return null;

  // A bare phone number (with or without +, spaces, dots, dashes, parentheses)
  // is the most common hosting-dashboard misconfiguration.
  if (/^\+?[\d\s().-]+$/.test(candidate)) {
    return whatsappLink(candidate, message) || null;
  }

  // Accept scheme-less links such as `wa.me/237653262837`.
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)
    ? candidate
    : `https://${candidate}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!url.hostname.includes(".")) return null;

  if (isWhatsappHostname(url.hostname)) {
    const phone = url.searchParams.get("phone");
    if (phone) {
      const text = url.searchParams.get("text") || message;
      return whatsappLink(phone, text ?? undefined) || null;
    }

    if (url.hostname === "wa.me") {
      // Canonical links put the number in the path; normalize `+`, spaces and
      // separators so the resulting href always starts with https://wa.me/.
      let pathValue = url.pathname.replace(/^\/+|\/+$/g, "");
      try {
        pathValue = decodeURIComponent(pathValue);
      } catch {
        // Keep the raw path when it contains malformed percent-encoding.
      }

      if (pathValue && /^\+?[\d\s().-]+$/.test(pathValue)) {
        const text = url.searchParams.get("text") || message;
        return whatsappLink(pathValue, text ?? undefined) || null;
      }

      // `https://wa.me/?text=...` has no recipient. Treat it as unusable so
      // the configured number can take over and the CTA still reaches WhatsApp.
      if (!pathValue) return null;
    }

    if (message && !url.searchParams.has("text")) {
      url.searchParams.set("text", message);
    }
    return url.toString();
  }

  // A non-WhatsApp absolute URL is still honoured as an explicit override, but
  // it must remain absolute so the CTA can never resolve to a route on this site.
  return url.toString();
}
