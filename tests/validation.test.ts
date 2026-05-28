import { describe, expect, it } from "vitest";
import { contactSchema, projectInquirySchema } from "../src/lib/validation";

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
});
