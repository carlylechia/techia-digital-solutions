import "server-only";

export type EditorialTextCost = number | null;

const TEXT_PRICING_USD_PER_MILLION: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4.1": { input: 2, output: 8 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-5.4": { input: 2.5, output: 10 },
  "gpt-5.4-mini": { input: 0.4, output: 1.6 },
  "gpt-6-luna": { input: 2, output: 8 },
};

export function estimateEditorialTextCost(model: string, inputTokens: number, outputTokens: number): EditorialTextCost {
  const pricing = TEXT_PRICING_USD_PER_MILLION[model];
  if (!pricing) return null;
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

const IMAGE_PRICING_USD: Record<string, Record<string, number>> = {
  "gpt-image-1.5": { "1024x1024": 0.034, "1536x1024": 0.05, "1024x1536": 0.05 },
  "gpt-image-2": { "1024x1024": 0.04, "1536x1024": 0.06, "1024x1536": 0.06 },
};

export function estimateEditorialImageCost(model: string, size: string): number | null {
  const pricing = IMAGE_PRICING_USD[model];
  if (!pricing) return null;
  return pricing[size] ?? null;
}
