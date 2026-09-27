import { describe, expect, it } from "vitest";
import { buildOutreachHtml, sendOutreachEmail } from "@/lib/outreach/email-service";
import { backoffMs, buildDedupeKey } from "@/lib/outreach/jobs";

/**
 * A model-generated or page-scraped body must never be able to inject markup into
 * an outbound email, and a provider failure must not leak a secret.
 */

describe("outreach email rendering", () => {
  it("escapes a script payload in the body", () => {
    const html = buildOutreachHtml({
      subject: "Hello",
      bodyText: "<script>alert('xss')</script>\n\nReal content.",
      unsubscribeUrl: null,
      complianceNote: null,
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("neutralises an img onerror payload and quote breakouts", () => {
    const html = buildOutreachHtml({
      subject: '" onload="alert(1)',
      bodyText: '<img src=x onerror="alert(1)"> and a "quoted" value & an ampersand',
      unsubscribeUrl: null,
      complianceNote: null,
    });
    // The payload survives only as inert escaped text: the tag can never be
    // parsed as markup, and no attribute context is ever created.
    expect(html).not.toMatch(/<img/i);
    expect(html).not.toMatch(/onload="alert/i);
    expect(html).toContain("&lt;img");
    expect(html).toContain("&quot;");
    expect(html).toContain("&amp;");
  });

  it("refuses a javascript: unsubscribe URL entirely rather than escaping it", () => {
    const html = buildOutreachHtml({
      subject: "Hello",
      bodyText: "Body",
      unsubscribeUrl: 'javascript:alert(1)"><script>alert(1)</script>',
      complianceNote: null,
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toMatch(/href="javascript:/i);
    expect(html).not.toContain("javascript:");
    // The link is dropped entirely rather than rendered unsafely.
    expect(html).not.toContain("Unsubscribe from teChia business messages");
  });

  it("refuses a data: unsubscribe URL", () => {
    const html = buildOutreachHtml({
      subject: "Hello",
      bodyText: "Body",
      unsubscribeUrl: "data:text/html,<script>alert(1)</script>",
      complianceNote: null,
    });
    expect(html).not.toMatch(/href="data:/i);
    expect(html).not.toContain("Unsubscribe from teChia business messages");
  });

  it("flattens a CRLF subject so it cannot inject a header", () => {
    const html = buildOutreachHtml({
      subject: "Hello\r\nBcc: victim@example.com",
      bodyText: "Body",
      unsubscribeUrl: null,
      complianceNote: null,
    });
    // The CRLF pair is the actual attack. Once collapsed, "Bcc:" can no longer
    // start a new header no matter what text follows it.
    expect(html).not.toContain("\r");
    expect(html).toContain("Hello Bcc: victim@example.com");
  });

  it("converts plain-text line breaks into paragraphs", () => {
    const html = buildOutreachHtml({ subject: "Hi", bodyText: "Line one\n\nLine two", unsubscribeUrl: null, complianceNote: null });
    expect(html).toContain("</p><p>");
  });

  it("always includes sender identity, address and the unsubscribe link", () => {
    const html = buildOutreachHtml({
      subject: "Hi",
      bodyText: "Body",
      unsubscribeUrl: "https://techiadigital.com/api/outreach/unsubscribe?p=abc&m=def",
      complianceNote: "You can ask us to delete your details at any time.",
    });
    expect(html).toContain("Chia Carlyle");
    expect(html).toContain("teChia Digital Solutions");
    expect(html).toContain("Unsubscribe from teChia business messages");
    expect(html).toContain("p=abc&amp;m=def");
    expect(html).toContain("You can ask us to delete your details at any time.");
  });

  it("omits the unsubscribe link only when no URL is available", () => {
    const html = buildOutreachHtml({ subject: "Hi", bodyText: "Body", unsubscribeUrl: null, complianceNote: null });
    expect(html).not.toContain("Unsubscribe from teChia business messages");
  });
});

describe("outreach send without provider configuration", () => {
  it("reports a skipped send instead of throwing a secret to the caller", async () => {
    const originalKey = process.env.RESEND_API_KEY;
    const originalOverride = process.env.OUTREACH_RESEND_API_KEY;
    process.env.RESEND_API_KEY = "re_placeholder";
    delete process.env.OUTREACH_RESEND_API_KEY;

    try {
      const result = await sendOutreachEmail({
        to: "hello@example.com",
        subject: "Hello",
        bodyText: "Body",
        idempotencyKey: "outreach:test:test",
      });
      expect(result.sent).toBe(false);
      expect(result.skipped).toBe("not_configured");
      expect(result.error).toBe("Email provider is not configured.");
    } finally {
      if (originalKey === undefined) delete process.env.RESEND_API_KEY;
      else process.env.RESEND_API_KEY = originalKey;
      if (originalOverride !== undefined) process.env.OUTREACH_RESEND_API_KEY = originalOverride;
    }
  });
});

describe("job queue helpers", () => {
  it("builds a stable dedupe key per type and target", () => {
    expect(buildDedupeKey("SEND_EMAIL", { campaignId: "c1", prospectId: "p1" })).toBe("SEND_EMAIL:c1:p1:-");
    expect(buildDedupeKey("SEND_EMAIL", { campaignId: "c1", prospectId: "p1" })).toBe(buildDedupeKey("SEND_EMAIL", { campaignId: "c1", prospectId: "p1" }));
    expect(buildDedupeKey("ENRICH", { campaignId: "c1", prospectId: "p1" })).not.toBe(buildDedupeKey("ASSESS", { campaignId: "c1", prospectId: "p1" }));
  });

  it("includes a discriminator so a legitimate repeat run is not blocked", () => {
    const first = buildDedupeKey("DISCOVER", { campaignId: "c1", discriminator: "2026-09-26" });
    const second = buildDedupeKey("DISCOVER", { campaignId: "c1", discriminator: "2026-09-27" });
    expect(first).not.toBe(second);
  });

  it("grows the retry backoff and then caps it", () => {
    expect(backoffMs(1)).toBe(60_000);
    expect(backoffMs(2)).toBe(120_000);
    expect(backoffMs(3)).toBe(240_000);
    expect(backoffMs(10)).toBe(3_600_000);
    expect(backoffMs(50)).toBe(3_600_000);
  });
});
