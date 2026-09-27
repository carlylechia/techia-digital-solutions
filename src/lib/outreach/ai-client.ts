import "server-only";

import { z } from "zod";
import { estimateCost, estimateTokens } from "@/lib/ai/token-estimation";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { OUTREACH_AI, OUTREACH_AI_USAGE_REQUEST_TYPE, OUTREACH_TIMEBOX } from "./config";

/**
 * Minimal OpenAI client for the outreach engine.
 *
 * It follows the same shape as the public AI agent route — native fetch, no SDK —
 * but adds the guarantees the outreach pipeline needs:
 *   - structured output requested explicitly
 *   - raw output is never trusted; it is parsed and validated with Zod
 *   - a token ceiling per call and a hard payload ceiling
 *   - usage recorded on the existing AIUsage table under a distinct
 *     requestType, so outreach cost is separable from public traffic
 */

export class OutreachAiError extends Error {
  readonly category: "not_configured" | "timeout" | "quota" | "rate_limit" | "api" | "malformed_output" | "payload_too_large";
  readonly status: number | null;

  constructor(category: OutreachAiError["category"], message: string, status: number | null = null) {
    super(message);
    this.name = "OutreachAiError";
    this.category = category;
    this.status = status;
  }
}

const MAX_PAYLOAD_CHARS = 60_000;

function truncatePayload(value: string) {
  if (value.length <= MAX_PAYLOAD_CHARS) return value;
  return `${value.slice(0, MAX_PAYLOAD_CHARS)}\n[evidence truncated]`;
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const candidates = [trimmed];
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  const brace = /\{[\s\S]*\}/.exec(trimmed);
  if (brace?.[0]) candidates.push(brace[0]);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as unknown;
    } catch {
      continue;
    }
  }
  throw new OutreachAiError("malformed_output", "Model did not return parsable JSON.");
}

export type AiCallResult<T> = {
  data: T;
  model: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
};

export async function callOutreachAi<T>(input: {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  requestType: string;
  promptVersion: string;
  conversationId?: string | null;
}): Promise<AiCallResult<T>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new OutreachAiError("not_configured", "OPENAI_API_KEY is not configured.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OUTREACH_TIMEBOX.openAiMs);

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: OUTREACH_AI.model,
        temperature: OUTREACH_AI.temperature,
        max_tokens: OUTREACH_AI.maxOutputTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: truncatePayload(input.user) },
        ],
      }),
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new OutreachAiError("timeout", "Outreach AI request timed out.");
    }
    throw new OutreachAiError("api", `Outreach AI request failed: ${getErrorMessage(error)}`);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const status = response.status;
    if (status === 429) {
      throw new OutreachAiError("quota", "OpenAI reported a quota problem for the outreach engine.", status);
    }
    if (status === 401 || status === 403) {
      throw new OutreachAiError("not_configured", "OpenAI rejected the configured credentials.", status);
    }
    // Provider bodies can echo the prompt and key material, so only the status
    // is surfaced and the raw body is discarded.
    throw new OutreachAiError("api", `OpenAI returned HTTP ${status} for the outreach engine.`, status);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const content = payload.choices?.[0]?.message?.content ?? "";
  if (!content.trim()) {
    throw new OutreachAiError("malformed_output", "Model returned an empty response.");
  }

  const parsedJson = extractJson(content);
  const parsed = input.schema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new OutreachAiError(
      "malformed_output",
      `Model output failed validation: ${parsed.error.issues.map((issue) => issue.path.join(".")).slice(0, 5).join(", ")}`
    );
  }

  const inputTokens = payload.usage?.prompt_tokens ?? estimateTokens(input.system + input.user);
  const outputTokens = payload.usage?.completion_tokens ?? estimateTokens(content);
  const estimatedCost = estimateCost(inputTokens, outputTokens);

  const prisma = getPrisma();
  if (prisma) {
    await prisma.aIUsage
      .create({
        data: {
          model: OUTREACH_AI.model,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          estimatedCost,
          requestType: input.requestType,
          conversationId: input.conversationId ?? null,
        },
      })
      .catch((error) => {
        console.warn("[outreach-ai] usage_record_failed", getErrorMessage(error));
      });
  }

  return {
    data: parsed.data,
    model: OUTREACH_AI.model,
    promptVersion: input.promptVersion,
    inputTokens,
    outputTokens,
    estimatedCost,
  };
}

/**
 * Daily outreach token spend across every request type. Cost control runs before
 * the model is called, not after.
 */
export async function getOutreachDailyTokenUsage() {
  const prisma = getPrisma();
  if (!prisma) return 0;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const result = await prisma.aIUsage
    .aggregate({
      _sum: { totalTokens: true },
      where: { requestType: { startsWith: "OUTREACH_" }, createdAt: { gte: startOfDay } },
    })
    .catch(() => null);
  return result?._sum.totalTokens ?? 0;
}

export const OUTREACH_AI_REQUEST_TYPES = OUTREACH_AI_USAGE_REQUEST_TYPE;
