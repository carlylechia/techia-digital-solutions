import { describe, expect, it } from "vitest";
import {
  contactSchema,
  courseBonusClaimSchema,
  projectInquirySchema,
  academyCheckoutSchema,
} from "../src/lib/validation";
import { flagEmojiForCountryCode, isValidCountryCode } from "../src/lib/countries";

function checkoutPayload(overrides: Partial<Record<string, string>> = {}) {
  return {
    itemType: "course",
    itemSlug: "digital-marketing-basics",
    provider: "CHARIOW",
    firstName: "Carlyle",
    lastName: "Chia",
    email: "buyer@example.com",
    phone: "677123456",
    countryCode: "CM",
    locale: "en",
    idempotencyKey: "key-0123456789",
    ...overrides,
  };
}

describe("form validation", () => {
  it("accepts a valid contact payload", () => {
    expect(contactSchema.safeParse({ name: "Chia", email: "hello@example.com", message: "I need a new website." }).success).toBe(true);
  });

  it("rejects a project inquiry without consent", () => {
    expect(projectInquirySchema.safeParse({ name: "Chia", email: "hello@example.com", phone: "+237", country: "Cameroon", preferredLanguage: "English", businessType: "SME", need: "Website", budgetRange: "$1,000 - $3,000", timeline: "2-4 weeks", details: "A serious project with enough detail.", consent: false }).success).toBe(false);
  });

  it("allows filled honeypots so spam can be dropped quietly", () => {
    expect(contactSchema.safeParse({ name: "Chia", email: "hello@example.com", message: "I need a new website.", honeypot: "bot-filled" }).success).toBe(true);
  });

  it("requires WhatsApp when a bonus claim requests WhatsApp delivery", () => {
    expect(
      courseBonusClaimSchema.safeParse({
        name: "Chia",
        email: "hello@example.com",
        coursePackId: "complete-digital-skills-pack",
        orderReference: "CH-2026-001",
        preferredDelivery: "WHATSAPP",
        requestedBonusIds: ["course-learning-tracker"],
      }).success,
    ).toBe(false);
  });

  it("accepts a checkout with a known ISO country code (uppercased)", () => {
    const parsed = academyCheckoutSchema.safeParse(checkoutPayload());
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.countryCode).toBe("CM");
    const lowercase = academyCheckoutSchema.safeParse(
      checkoutPayload({ countryCode: "cm" }),
    );
    expect(lowercase.success).toBe(true);
  });

  it("rejects checkout country codes that are not ISO 3166-1 alpha-2", () => {
    expect(
      academyCheckoutSchema.safeParse(checkoutPayload({ countryCode: "XX" }))
        .success,
    ).toBe(false);
    expect(
      academyCheckoutSchema.safeParse(checkoutPayload({ countryCode: "+237" }))
        .success,
    ).toBe(false);
    expect(
      academyCheckoutSchema.safeParse(checkoutPayload({ countryCode: "CAM" }))
        .success,
    ).toBe(false);
  });

  it("validates the country helper and derives flag emoji from the code", () => {
    expect(isValidCountryCode("CM")).toBe(true);
    expect(isValidCountryCode("sn")).toBe(true);
    expect(isValidCountryCode("XX")).toBe(false);
    expect(isValidCountryCode("C M")).toBe(false);
    expect(flagEmojiForCountryCode("CM")).toBe("🇨🇲");
    expect(flagEmojiForCountryCode("FR")).toBe("🇫🇷");
    expect(flagEmojiForCountryCode("X")).toBe("");
  });
});
