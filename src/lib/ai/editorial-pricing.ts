import "server-only";

export type EditorialTextCost = number | null;

// Verified against OpenAI pricing documentation on 2026-11-16.
// Values are USD per 1,000,000 tokens.
const TEXT_PRICING_USD_PER_MILLION: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4.1": { input: 2, output: 8 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-5.4": { input: 2.5, output: 10 },
  "gpt-5.4-mini": { input: 0.4, output: 1.6 },
  "gpt-6-luna": { input: 0.1, output: 0.5 },
};

export function estimateEditorialTextCost(model: string, inputTokens: number, outputTokens: number, cachedInputTokens = 0): EditorialTextCost {
  const pricing = TEXT_PRICING_USD_PER_MILLION[model];
  if (!pricing) return null;
  const cached = Math.min(Math.max(cachedInputTokens, 0), inputTokens);
  const uncachedInput = inputTokens - cached;
  return (uncachedInput * pricing.input + cached * pricing.input * 0.1 + outputTokens * pricing.output) / 1_000_000;
}

// Verified against OpenAI pricing documentation on 2026-11-16.
// Values are USD per generated image for the configured request settings.
const IMAGE_PRICING_USD: Record<string, Record<string, number>> = {
  "gpt-image-1.5": { "1536x1024:high": 0.2 },
  "gpt-image-2": { "1536x1024:high": 0.165 },
};

export function estimateEditorialImageCost(model: string, size: string, quality = "high"): number | null {
  const pricing = IMAGE_PRICING_USD[model];
  if (!pricing) return null;
  return pricing[`${size}:${quality}`] ?? null;
}
