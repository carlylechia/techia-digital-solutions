import { describe, expect, it } from "vitest";
import { estimateTokens, estimateRequestTokens, estimateCost } from "../src/lib/ai/token-estimation";
import { hashIp } from "../src/lib/ai/ip-hash";
import { AI_CONFIG } from "../src/lib/ai/config";

describe("AI token estimation", () => {
  it("estimates tokens from text length", () => {
    expect(estimateTokens("hello world")).toBe(Math.ceil("hello world".length / 4));
  });

  it("returns 0 for empty text", () => {
    expect(estimateTokens("")).toBe(0);
  });

  it("estimates cost correctly for known token counts", () => {
    const cost = estimateCost(1000, 500);
    expect(cost).toBeCloseTo(1000 * 0.00000015 + 500 * 0.0000006, 10);
  });

  it("returns 0 cost for 0 tokens", () => {
    expect(estimateCost(0, 0)).toBe(0);
  });

  it("estimates total request tokens from message array", () => {
    const messages = [
      { role: "system", content: "You are an assistant." },
      { role: "user", content: "Hello!" },
    ];
    const total = estimateRequestTokens(messages);
    const expected =
      Math.ceil("You are an assistant.".length / 4) +
      4 +
      Math.ceil("Hello!".length / 4) +
      4;
    expect(total).toBe(expected);
  });
});

describe("AI IP hashing", () => {
  it("produces a 32-character hex string", () => {
    const hash = hashIp("127.0.0.1");
    expect(hash).toHaveLength(32);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it("produces the same hash for the same IP", () => {
    expect(hashIp("192.168.1.1")).toBe(hashIp("192.168.1.1"));
  });

  it("produces different hashes for different IPs", () => {
    expect(hashIp("1.1.1.1")).not.toBe(hashIp("8.8.8.8"));
  });
});

describe("AI config defaults", () => {
  it("has expected default values", () => {
    expect(AI_CONFIG.model).toBe("gpt-4o-mini");
    expect(AI_CONFIG.maxOutputTokens).toBeGreaterThan(0);
    expect(AI_CONFIG.maxUserMessageChars).toBeGreaterThan(0);
    expect(AI_CONFIG.dailyTokenBudget).toBeGreaterThan(0);
  });

  it("cost per token values are positive", () => {
    expect(AI_CONFIG.costPerInputToken).toBeGreaterThan(0);
    expect(AI_CONFIG.costPerOutputToken).toBeGreaterThan(0);
  });
});
