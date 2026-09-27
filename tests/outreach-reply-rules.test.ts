import { describe, expect, it } from "vitest";
import { decideReply } from "../src/lib/outreach/reply-rules";
import { OUTREACH_ESCALATION_CATEGORIES } from "../src/lib/outreach/constants";

const decide = (body: string, modelCategory: Parameters<typeof decideReply>[0]["modelCategory"] = "OTHER", confidence = 0.9) =>
  decideReply({ modelCategory, modelConfidence: confidence, inboundSubject: "Re: hello", inboundBody: body });

describe("reply classification rules", () => {
  it("treats an explicit opt-out as an unsubscribe and suppresses", () => {
    for (const body of [
      "Please unsubscribe me.",
      "Remove me from your list.",
      "Stop emailing me.",
      "Do not contact me again.",
      "I do not wish to be contacted.",
    ]) {
      const result = decide(body, "NOT_INTERESTED");
      expect(result.category, body).toBe("UNSUBSCRIBE");
      expect(result.suppress).toBe(true);
      expect(result.stopAutomation).toBe(true);
    }
  });

  it("stops automation and escalates a meeting request", () => {
    const result = decide("Can we book a call next Tuesday?");
    expect(result.category).toBe("MEETING_REQUEST");
    expect(result.stopAutomation).toBe(true);
    expect(result.requiresHumanReply).toBe(true);
  });

  it("stops automation and requires a human for any pricing question", () => {
    for (const body of ["What does this cost?", "Send me a quote.", "How much is the website?", "Quel est le devis ?"]) {
      const result = decide(body);
      expect(result.category, body).toBe("PRICE_REQUEST");
      expect(result.stopAutomation).toBe(true);
      expect(result.requiresHumanReply).toBe(true);
    }
  });

  it("never lets a price request be softened to interested", () => {
    const result = decide("Yes I am interested, how much does it cost?", "INTERESTED", 0.99);
    expect(result.category).toBe("PRICE_REQUEST");
    expect(result.markInterested).toBe(false);
  });

  it("escalates a genuine question", () => {
    const result = decide("Do you also handle French-language sites?", "QUESTION");
    expect(result.category).toBe("QUESTION");
    expect(result.requiresHumanReply).toBe(true);
    expect(result.stopAutomation).toBe(true);
  });

  it("accepts interest only when a positive signal is actually present", () => {
    const positive = decide("Yes, sounds good. We would like to discuss this.", "INTERESTED");
    expect(positive.category).toBe("INTERESTED");
    expect(positive.markInterested).toBe(true);
    expect(positive.requiresHumanReply).toBe(true);
  });

  it("refuses to call an ambiguous reply interested even when the model insists", () => {
    const result = decide("Received.", "INTERESTED", 0.99);
    expect(result.category).toBe("OTHER");
    expect(result.markInterested).toBe(false);
    expect(result.ruleApplied).toMatch(/ambiguous_guard|interest_requires_evidence/);
  });

  it("refuses interest when positive wording appears only after the truncation point", () => {
    const result = decideReply({
      modelCategory: "INTERESTED",
      modelConfidence: 0.99,
      inboundSubject: null,
      inboundBody: `${"x".repeat(20_000)} sounds good we would like to talk`,
    });
    expect(result.category).toBe("OTHER");
  });

  it("refuses a low-confidence model guess on text with no signal", () => {
    const result = decide("ok", "INTERESTED", 0.2);
    expect(result.category).toBe("OTHER");
  });

  it("classifies undeliverable and auto-reply content as a bounce", () => {
    for (const body of ["", "   ", "Undeliverable: mailbox unavailable", "550 5.1.1 user unknown", "I am out of the office until Monday"]) {
      const result = decide(body, "OTHER");
      expect(result.category, JSON.stringify(body)).toBe("BOUNCE");
      expect(result.stopAutomation).toBe(true);
    }
  });

  it("stops on a polite decline", () => {
    const result = decide("Not interested, thanks.", "OTHER");
    expect(result.category).toBe("NOT_INTERESTED");
    expect(result.stopAutomation).toBe(true);
  });

  it("stops when the business already has a provider", () => {
    const result = decide("We already work with an agency for this.", "OTHER");
    expect(result.category).toBe("ALREADY_HAS_PROVIDER");
  });

  it("flags a wrong contact and stops automation", () => {
    const result = decide("Wrong address, I left that company last year.", "OTHER");
    expect(result.category).toBe("WRONG_CONTACT");
    expect(result.stopAutomation).toBe(true);
  });

  it("marks a later reply as the only non-stopping category", () => {
    const result = decide("Not now, maybe next quarter.", "OTHER");
    expect(result.category).toBe("LATER");
    expect(result.stopAutomation).toBe(false);
  });

  it("escalates exactly the four categories that need a human", () => {
    expect([...OUTREACH_ESCALATION_CATEGORIES].sort()).toEqual(["INTERESTED", "MEETING_REQUEST", "PRICE_REQUEST", "QUESTION"]);
    expect(decide("Yes sounds good we would like to talk", "INTERESTED").requiresHumanReply).toBe(true);
    expect(decide("No thanks", "NOT_INTERESTED").requiresHumanReply).toBe(false);
    expect(decide("Later", "LATER").requiresHumanReply).toBe(false);
  });

  it("bounds a very long hostile reply without throwing", () => {
    const hostile = `please unsubscribe me. ${"A".repeat(50_000)}`;
    const result = decideReply({ modelCategory: "OTHER", modelConfidence: 0.9, inboundSubject: null, inboundBody: hostile });
    expect(result.category).toBe("UNSUBSCRIBE");
  });

  it("ignores content past the truncation point rather than acting on it", () => {
    const buried = `${"A".repeat(20_000)} unsubscribe me`;
    const result = decideReply({ modelCategory: "OTHER", modelConfidence: 0.9, inboundSubject: null, inboundBody: buried });
    expect(result.category).not.toBe("UNSUBSCRIBE");
  });

  it("always records which rule decided the outcome", () => {
    expect(decide("stop emailing me").ruleApplied).toBe("rule:opt_out");
    expect(decide("what's the price?").ruleApplied).toBe("rule:price");
    expect(decide("").ruleApplied).toBe("rule:empty_body");
  });
});
