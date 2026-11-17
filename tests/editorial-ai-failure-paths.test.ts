import { expect, describe, it } from "vitest";
import { isPotentiallyBillable } from "@/lib/ai/editorial-service";
import { EditorialAiError } from "@/lib/ai/editorial-service";
import { estimateEditorialTextCost, estimateEditorialImageCost } from "@/lib/ai/editorial-pricing";

describe("isPotentiallyBillable", () => {
  it("returns true for non-EditorialAiError", () => {
    const dummy: Record<string, unknown> = {};
    expect(isPotentiallyBillable(dummy)).toBe(true);
  });

  it("returns true when providerState is 'started'", () => {
    expect(isPotentiallyBillable(new EditorialAiError("quota", "Rate limited", { providerState: "started" }))).toBe(true);
  });

  it("returns true when providerState is 'responded' with HTTP 5xx", () => {
    expect(isPotentiallyBillable(new EditorialAiError("api", "Server error", { providerState: "responded", httpStatus: 500 }))).toBe(true);
  });

  it("returns true when providerState is 'responded' with HTTP 408", () => {
    expect(isPotentiallyBillable(new EditorialAiError("api", "Timeout", { providerState: "responded", httpStatus: 408 }))).toBe(true);
  });

  it("returns true when providerState is 'responded' with HTTP 2xx", () => {
    expect(isPotentiallyBillable(new EditorialAiError("api", "OK", { providerState: "responded", httpStatus: 200 }))).toBe(true);
  });

  it("returns false when providerState is 'responded' with HTTP 401", () => {
    expect(isPotentiallyBillable(new EditorialAiError("auth", "Unauthorized", { providerState: "responded", httpStatus: 401 }))).toBe(false);
  });

  it("returns false when providerState is 'responded' with HTTP 403", () => {
    expect(isPotentiallyBillable(new EditorialAiError("auth", "Forbidden", { providerState: "responded", httpStatus: 403 }))).toBe(false);
  });

  it("returns false when providerState is 'responded' with HTTP 429", () => {
    expect(isPotentiallyBillable(new EditorialAiError("quota", "Rate limited", { providerState: "responded", httpStatus: 429 }))).toBe(false);
  });
});

describe("estimateEditorialTextCost text failures", () => {
  it("returns null for unknown model", () => {
    expect(estimateEditorialTextCost("unknown-model", 10, 10)).toBeNull();
  });

  it("calculates GPT-5.4 correctly with corrected pricing", () => {
    expect(estimateEditorialTextCost("gpt-5.4", 1_000_000, 1_000_000)).toBe(17.5);
  });

  it("calculates GPT-5.4-mini correctly", () => {
    expect(estimateEditorialTextCost("gpt-5.4-mini", 1_000_000, 1_000_000)).toBe(5.25);
  });

  it("calculates GPT-6-Luna correctly", () => {
    expect(estimateEditorialTextCost("gpt-6-luna", 1_000_000, 1_000_000)).toBe(0.6);
  });

  it("applies cached token discount", () => {
    expect(estimateEditorialTextCost("gpt-4o-mini", 1_000_000, 0, 500_000)).toBeCloseTo(0.0825, 6);
  });

  it("handles zero input tokens", () => {
    expect(estimateEditorialTextCost("gpt-5.4", 0, 1_000_000)).toBeCloseTo(15, 2);
  });

  it("handles zero output tokens", () => {
    expect(estimateEditorialTextCost("gpt-5.4", 1_000_000, 0)).toBeCloseTo(2.5, 2);
  });
});

describe("estimateEditorialImageCost no complete cost", () => {
  it("returns null when only output pricing is known", () => {
    expect(estimateEditorialImageCost("gpt-image-1.5", "1536x1024", "high")).toBeNull();
  });
});
