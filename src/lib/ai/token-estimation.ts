export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateCost(inputTokens: number, outputTokens: number): number {
  const costPerInput = 0.00000015;
  const costPerOutput = 0.0000006;
  return inputTokens * costPerInput + outputTokens * costPerOutput;
}

export function estimateRequestTokens(messages: Array<{ role: string; content: string }>): number {
  return messages.reduce((total, msg) => total + estimateTokens(msg.content) + 4, 0);
}
