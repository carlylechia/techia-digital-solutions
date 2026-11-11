import { describe, expect, it } from "vitest";
import { currencyExponent, formatMoney, majorToMinor, majorStringToMinor } from "@/lib/payments/money";
import { createChariowSignature, createMonerooSignature, verifyChariowSignature, verifyMonerooSignature } from "@/lib/payments/signatures";
import { getCheckoutReturnUrl } from "@/lib/payments/providers";

describe("academy money helpers", () => {
  it("handles XAF as zero-decimal minor units", () => {
    expect(currencyExponent("XAF")).toBe(0);
    expect(majorToMinor(1000, "XAF")).toBe(1000);
    expect(majorStringToMinor("1000", "XAF")).toBe(1000);
    expect(formatMoney(1000, "XAF", "en")).toContain("1");
  });

  it("handles two-decimal currencies", () => {
    expect(currencyExponent("USD")).toBe(2);
    expect(majorToMinor(12.34, "USD")).toBe(1234);
    expect(majorStringToMinor("12.34", "USD")).toBe(1234);
  });

  it("rejects invalid amounts", () => {
    expect(majorStringToMinor("-1", "XAF")).toBeNull();
    expect(majorStringToMinor("12.345", "USD")).toBeNull();
  });
});

describe("academy payment signatures", () => {
  it("verifies Chariow sha256-prefixed HMAC signatures", () => {
    const body = JSON.stringify({ id: "sale_123", event: "sale.completed" });
    const secret = "whsec_test";
    const sig = createChariowSignature(body, secret);
    expect(sig.startsWith("sha256=")).toBe(true);
    expect(verifyChariowSignature(body, sig, secret)).toBe(true);
    expect(verifyChariowSignature(body, "sha256=deadbeef", secret)).toBe(false);
    expect(verifyChariowSignature(body, null, secret)).toBe(false);
  });

  it("verifies Moneroo bare-hex HMAC signatures", () => {
    const body = JSON.stringify({ event: "payment.success", data: { id: "pay_123" } });
    const secret = "whsec_test";
    const sig = createMonerooSignature(body, secret);
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
    expect(verifyMonerooSignature(body, sig, secret)).toBe(true);
    expect(verifyMonerooSignature(body, "nothex", secret)).toBe(false);
  });
});

describe("academy provider helpers", () => {
  it("builds provider return URLs with order and provider context", () => {
    const previousSite = process.env.NEXT_PUBLIC_SITE_URL;
    const previousAuth = process.env.NEXTAUTH_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://techia.test";
    delete process.env.NEXTAUTH_URL;
    const url = getCheckoutReturnUrl("ORDER123", "MONEROO");
    expect(url).toBe("https://techia.test/courses/checkout/return?order=ORDER123&provider=MONEROO");
    process.env.NEXT_PUBLIC_SITE_URL = previousSite;
    if (previousAuth) process.env.NEXTAUTH_URL = previousAuth;
  });
});
