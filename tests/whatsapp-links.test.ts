import { afterEach, describe, expect, it, vi } from "vitest";
import { getCoursesWhatsappUrl } from "../src/lib/courses/chariowLinks";
import { normalizeWhatsappUrl, whatsappLink } from "../src/lib/whatsapp";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("whatsappLink", () => {
  it("builds an absolute wa.me link from a formatted phone number", () => {
    expect(whatsappLink("+237 653 262 837", "Hello there")).toBe(
      "https://wa.me/237653262837?text=Hello%20there",
    );
  });

  it("extracts the recipient from a scheme-less wa.me link", () => {
    expect(whatsappLink("wa.me/237653262837")).toBe(
      "https://wa.me/237653262837",
    );
  });

  it("extracts the recipient from a click-to-chat link", () => {
    expect(whatsappLink("https://api.whatsapp.com/send?phone=237653262837")).toBe(
      "https://wa.me/237653262837",
    );
  });

  it("returns an empty string when no number can be found", () => {
    expect(whatsappLink("no number here")).toBe("");
  });
});

describe("normalizeWhatsappUrl", () => {
  it("normalizes a bare phone number", () => {
    expect(normalizeWhatsappUrl("+237 653 262 837", "Hello")).toBe(
      "https://wa.me/237653262837?text=Hello",
    );
  });

  it("normalizes a scheme-less wa.me link", () => {
    expect(normalizeWhatsappUrl("wa.me/237653262837", "Hello")).toBe(
      "https://wa.me/237653262837?text=Hello",
    );
  });

  it("keeps an existing prefilled message", () => {
    expect(
      normalizeWhatsappUrl(
        "https://wa.me/237653262837?text=Existing",
        "Replacement",
      ),
    ).toBe("https://wa.me/237653262837?text=Existing");
  });

  it("normalizes a plus-prefixed number in a wa.me path", () => {
    expect(normalizeWhatsappUrl("https://wa.me/+237653262837")).toBe(
      "https://wa.me/237653262837",
    );
  });

  it("returns null for a malformed value", () => {
    expect(normalizeWhatsappUrl("not a url")).toBeNull();
  });

  it("returns null for a non-http protocol", () => {
    expect(normalizeWhatsappUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects a relative path so it can never resolve to a 404 page", () => {
    expect(normalizeWhatsappUrl("/courses/claim-bonus")).toBeNull();
  });

  it("returns null for a wa.me link without a recipient", () => {
    expect(normalizeWhatsappUrl("https://wa.me/?text=Hello")).toBeNull();
  });
});

describe("getCoursesWhatsappUrl", () => {
  it("normalizes a bare configured number instead of returning a relative href", () => {
    vi.stubEnv("NEXT_PUBLIC_COURSES_WHATSAPP_URL", "+237 653 262 837");

    const url = getCoursesWhatsappUrl("Ask about the course");

    expect(url).toBe(
      "https://wa.me/237653262837?text=Ask%20about%20the%20course",
    );
  });

  it("normalizes a scheme-less configured wa.me link", () => {
    vi.stubEnv("NEXT_PUBLIC_COURSES_WHATSAPP_URL", "wa.me/237653262837");

    expect(getCoursesWhatsappUrl("Hello")).toBe(
      "https://wa.me/237653262837?text=Hello",
    );
  });

  it("falls back to the official number when the configured URL is malformed", () => {
    vi.stubEnv("NEXT_PUBLIC_COURSES_WHATSAPP_URL", "not a url");
    vi.stubEnv("NEXT_PUBLIC_OFFICIAL_WHATSAPP", "+237 653 262 837");
    vi.stubEnv("OFFICIAL_WHATSAPP", "");

    expect(getCoursesWhatsappUrl("Hello")).toBe(
      "https://wa.me/237653262837?text=Hello",
    );
  });

  it("adds the message to an absolute WhatsApp URL", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_COURSES_WHATSAPP_URL",
      "https://wa.me/237653262837",
    );

    expect(getCoursesWhatsappUrl("Hello")).toBe(
      "https://wa.me/237653262837?text=Hello",
    );
  });

  it("honours an absolute custom destination without making it relative", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_COURSES_WHATSAPP_URL",
      "https://example.com/whatsapp",
    );

    expect(getCoursesWhatsappUrl("Hello")).toBe(
      "https://example.com/whatsapp",
    );
  });

  it("returns an empty string when nothing is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_COURSES_WHATSAPP_URL", "");
    vi.stubEnv("NEXT_PUBLIC_OFFICIAL_WHATSAPP", "");
    vi.stubEnv("OFFICIAL_WHATSAPP", "");

    expect(getCoursesWhatsappUrl("Hello")).toBe("");
  });
});
