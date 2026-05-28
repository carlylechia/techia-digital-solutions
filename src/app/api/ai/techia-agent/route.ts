import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { AI_CONFIG } from "@/lib/ai/config";
import { hashIp } from "@/lib/ai/ip-hash";
import { estimateTokens, estimateRequestTokens, estimateCost } from "@/lib/ai/token-estimation";
import { TECHIA_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { requestIp } from "@/lib/rate-limit";
import { notifyAdminOfAILead, notifyAdminOfAIDemoRequest } from "@/lib/ai/notifications";
import { getErrorMessage, isPrismaSchemaDriftError } from "@/lib/prisma-errors";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface OpenAIChatResponse {
  choices: Array<{
    message: { content: string | null };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIErrorResponse {
  error?: {
    message?: string;
    type?: string;
    param?: string | null;
    code?: string | null;
  };
}

interface SaveLeadPayload {
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  industry?: string;
  serviceInterest: string;
  budgetRange?: string;
  timeline?: string;
  projectSummary: string;
  leadScore: "HOT" | "WARM" | "COLD";
}

interface SaveDemoRequestPayload {
  demoType: string;
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  preferredDate?: string;
  preferredContactMethod?: string;
  notes?: string;
}

const AI_STORAGE_OBJECTS = [
  "AIConversation",
  "AIMessage",
  "AILead",
  "AIDemoRequest",
  "AIUsage",
  "AIAbuseEvent",
] as const;

const OPENAI_RATE_LIMIT_BACKOFF_MS = 60_000;
const OPENAI_QUOTA_BACKOFF_MS = 30 * 60_000;

let openAIUnavailableUntil = 0;
let openAIUnavailableReason: "quota" | "rate_limit" | null = null;
let aiStorageUnavailableLogged = false;

class OpenAIProviderError extends Error {
  kind: "quota" | "rate_limit" | "config" | "api";
  status?: number;
  code?: string | null;

  constructor(
    kind: "quota" | "rate_limit" | "config" | "api",
    message: string,
    status?: number,
    code?: string | null
  ) {
    super(message);
    this.name = "OpenAIProviderError";
    this.kind = kind;
    this.status = status;
    this.code = code;
  }
}

// ─── OpenAI via native fetch (no SDK dependency) ───────────────────────────────

async function callOpenAI(
  messages: Array<{ role: string; content: string }>
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new OpenAIProviderError("config", "OPENAI_API_KEY is not configured");
  }
  if (openAIUnavailableUntil > Date.now() && openAIUnavailableReason) {
    throw new OpenAIProviderError(
      openAIUnavailableReason,
      `OpenAI provider temporarily unavailable: ${openAIUnavailableReason}`
    );
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.model,
      messages,
      max_tokens: AI_CONFIG.maxOutputTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "unknown error");
    let parsed: OpenAIErrorResponse | null = null;

    try {
      parsed = JSON.parse(errText) as OpenAIErrorResponse;
    } catch {
      parsed = null;
    }

    const providerMessage = parsed?.error?.message || errText || "unknown error";
    const providerCode = parsed?.error?.code ?? null;

    if (response.status === 429 && providerCode === "insufficient_quota") {
      openAIUnavailableUntil = Date.now() + OPENAI_QUOTA_BACKOFF_MS;
      openAIUnavailableReason = "quota";
      throw new OpenAIProviderError("quota", providerMessage, response.status, providerCode);
    }

    if (response.status === 429) {
      openAIUnavailableUntil = Date.now() + OPENAI_RATE_LIMIT_BACKOFF_MS;
      openAIUnavailableReason = "rate_limit";
      throw new OpenAIProviderError("rate_limit", providerMessage, response.status, providerCode);
    }

    throw new OpenAIProviderError("api", providerMessage, response.status, providerCode);
  }

  const data = (await response.json()) as OpenAIChatResponse;
  openAIUnavailableUntil = 0;
  openAIUnavailableReason = null;
  const content = data.choices[0]?.message?.content?.trim() ?? "";
  const inputTokens = data.usage?.prompt_tokens ?? 0;
  const outputTokens = data.usage?.completion_tokens ?? estimateTokens(content);

  return { content, inputTokens, outputTokens };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function friendlyError(message: string, status = 200): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

type PrismaClient = NonNullable<ReturnType<typeof getPrisma>>;

function isAIStorageUnavailableError(error: unknown): boolean {
  return isPrismaSchemaDriftError(error, [...AI_STORAGE_OBJECTS]);
}

function logAIStorageIssue(label: string, error: unknown) {
  if (aiStorageUnavailableLogged) return;
  aiStorageUnavailableLogged = true;
  console.warn(`[ai-agent] ${label}`, getErrorMessage(error));
}

function getProviderUnavailableMessage(error: unknown): string {
  if (error instanceof OpenAIProviderError) {
    if (error.kind === "quota") {
      return "The AI assistant is temporarily offline while we restore service capacity. Please try again later or contact teChia directly.";
    }

    if (error.kind === "rate_limit") {
      return "The AI assistant is handling a high volume of requests right now. Please try again in a moment or contact teChia directly.";
    }
  }

  return "The AI assistant is temporarily unavailable. Please try again later or contact teChia directly.";
}

async function logAbuseEvent(
  prisma: PrismaClient | null,
  data: {
    ipHash?: string;
    sessionId?: string;
    reason: string;
    metadata?: Record<string, unknown>;
  }
) {
  if (!prisma) return;
  try {
    await prisma.aIAbuseEvent.create({
      data: {
        ipHash: data.ipHash,
        sessionId: data.sessionId,
        reason: data.reason,
        metadata: data.metadata ? (data.metadata as import("@prisma/client").Prisma.InputJsonValue) : {},
      },
    });
  } catch (err) {
    if (!isAIStorageUnavailableError(err)) {
      console.error("[ai-agent] abuse_event_save_failed", getErrorMessage(err));
    }
  }
}

async function getDailyTokenUsage(prisma: PrismaClient | null): Promise<number> {
  if (!prisma) return 0;
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const result = await prisma.aIUsage.aggregate({
      _sum: { totalTokens: true },
      where: { requestType: "PUBLIC_AGENT", createdAt: { gte: startOfDay } },
    });
    return result._sum.totalTokens ?? 0;
  } catch {
    return 0;
  }
}

async function getSessionDailyCount(prisma: PrismaClient | null, sessionId: string): Promise<number> {
  if (!prisma) return 0;
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return await prisma.aIUsage.count({
      where: { sessionId, requestType: "PUBLIC_AGENT", createdAt: { gte: startOfDay } },
    });
  } catch {
    return 0;
  }
}

async function getIpDailyCount(prisma: PrismaClient | null, ipHash: string): Promise<number> {
  if (!prisma) return 0;
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return await prisma.aIUsage.count({
      where: { ipHash, requestType: "PUBLIC_AGENT", createdAt: { gte: startOfDay } },
    });
  } catch {
    return 0;
  }
}

async function getConversationMessageCount(prisma: PrismaClient | null, conversationId: string): Promise<number> {
  if (!prisma) return 0;
  try {
    const conv = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
      select: { messageCount: true },
    });
    return conv?.messageCount ?? 0;
  } catch {
    return 0;
  }
}

function buildContextMessages(history: ChatMessage[], summary: string | null): ChatMessage[] {
  const maxHistory = 6;
  const recent = history.slice(-maxHistory);
  if (summary && history.length > maxHistory) {
    return [{ role: "assistant", content: `[Conversation summary: ${summary}]` }, ...recent];
  }
  return recent;
}

// ─── POST /api/ai/techia-agent ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = requestIp(request.headers);
  const ipHash = hashIp(ip);
  const prisma = getPrisma();

  // 1. Check agent enabled
  if (!AI_CONFIG.enabled) {
    await logAbuseEvent(prisma, { ipHash, reason: "AI_AGENT_DISABLED" });
    return friendlyError("The AI assistant is temporarily unavailable. Please contact teChia directly.");
  }

  // 2. Parse body safely
  let body: Record<string, unknown> | null = null;
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 32_000) {
      await logAbuseEvent(prisma, { ipHash, reason: "INVALID_REQUEST", metadata: { contentLength } });
      return friendlyError("Your message is too long. Please shorten it and try again.");
    }
    body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return friendlyError("Invalid request format.");
    }
  } catch {
    return friendlyError("Invalid request format.");
  }

  const userMessage = typeof body.message === "string" ? body.message.trim() : "";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : "";
  const conversationId =
    typeof body.conversationId === "string" ? body.conversationId.slice(0, 64) : null;
  const history: ChatMessage[] = Array.isArray(body.history)
    ? (body.history as unknown[])
        .filter(
          (m): m is ChatMessage =>
            typeof m === "object" &&
            m !== null &&
            ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
            typeof (m as ChatMessage).content === "string"
        )
        .slice(-8)
    : [];

  // 3. Validate message
  if (!userMessage) {
    await logAbuseEvent(prisma, { ipHash, sessionId, reason: "EMPTY_MESSAGE" });
    return friendlyError("Please enter a message.");
  }
  if (userMessage.length > AI_CONFIG.maxUserMessageChars) {
    await logAbuseEvent(prisma, {
      ipHash,
      sessionId,
      reason: "MESSAGE_TOO_LONG",
      metadata: { length: userMessage.length },
    });
    return friendlyError("Your message is too long. Please shorten it and try again.");
  }
  if (!sessionId) {
    return friendlyError("Invalid session. Please refresh the page.");
  }

  // 4. Rate limit checks
  const [sessionCount, ipCount] = await Promise.all([
    getSessionDailyCount(prisma, sessionId),
    getIpDailyCount(prisma, ipHash),
  ]);

  if (sessionCount >= AI_CONFIG.maxMessagesPerDay) {
    await logAbuseEvent(prisma, {
      ipHash,
      sessionId,
      reason: "SESSION_DAILY_LIMIT_REACHED",
      metadata: { count: sessionCount },
    });
    return friendlyError(
      "You've reached today's free AI assistant limit. Please contact teChia directly or try again tomorrow."
    );
  }
  if (ipCount >= AI_CONFIG.maxMessagesPerIpPerDay) {
    await logAbuseEvent(prisma, {
      ipHash,
      sessionId,
      reason: "IP_DAILY_LIMIT_REACHED",
      metadata: { count: ipCount },
    });
    return friendlyError(
      "We're receiving too many AI requests from this network. Please try again later or contact teChia directly."
    );
  }

  // 5. Conversation limit check
  if (conversationId) {
    const msgCount = await getConversationMessageCount(prisma, conversationId);
    if (msgCount >= AI_CONFIG.maxMessagesPerConversation * 2) {
      await logAbuseEvent(prisma, {
        ipHash,
        sessionId,
        reason: "CONVERSATION_LIMIT_REACHED",
        metadata: { count: msgCount },
      });
      return friendlyError(
        "This conversation has reached its message limit. Please start a new conversation or contact teChia directly."
      );
    }
  }

  // 6. Daily token budget check
  const dailyTokens = await getDailyTokenUsage(prisma);
  if (dailyTokens >= AI_CONFIG.dailyTokenBudget) {
    await logAbuseEvent(prisma, {
      ipHash,
      sessionId,
      reason: "DAILY_TOKEN_BUDGET_REACHED",
      metadata: { dailyTokens },
    });
    return friendlyError(
      "The AI assistant is temporarily unavailable due to high usage. Please contact teChia directly."
    );
  }

  // 7. Estimate tokens before calling OpenAI
  const contextMessages = buildContextMessages(history, null);
  const allMessages = [
    { role: "system", content: TECHIA_SYSTEM_PROMPT },
    ...contextMessages,
    { role: "user", content: userMessage },
  ];
  const estimatedInputTokens = estimateRequestTokens(
    allMessages as Array<{ role: string; content: string }>
  );
  const estimatedTotal = estimatedInputTokens + AI_CONFIG.maxOutputTokens;
  if (estimatedTotal + dailyTokens > AI_CONFIG.dailyTokenBudget * 1.05) {
    await logAbuseEvent(prisma, {
      ipHash,
      sessionId,
      reason: "ESTIMATED_REQUEST_TOO_LARGE",
      metadata: { estimatedTotal },
    });
    return friendlyError(
      "The AI assistant is temporarily unavailable due to high usage. Please contact teChia directly."
    );
  }

  // 8. Get or create conversation
  let activeConversationId = conversationId;
  if (!activeConversationId && prisma) {
    try {
      const conv = await prisma.aIConversation.create({
        data: { sessionId, status: "ACTIVE" },
      });
      activeConversationId = conv.id;
    } catch (err) {
      if (isAIStorageUnavailableError(err)) {
        logAIStorageIssue("conversation_create_skipped", err);
      } else {
        console.error("[ai-agent] conversation_create_failed", getErrorMessage(err));
      }
    }
  }

  // 9. Call OpenAI
  let assistantMessage = "";
  let actualInputTokens = estimatedInputTokens;
  let actualOutputTokens = 0;

  try {
    const result = await callOpenAI(allMessages);
    assistantMessage = result.content;
    if (result.inputTokens > 0) actualInputTokens = result.inputTokens;
    actualOutputTokens = result.outputTokens;
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    if (err instanceof OpenAIProviderError && (err.kind === "quota" || err.kind === "rate_limit")) {
      console.warn("[ai-agent] openai_call_failed", errorMessage);
    } else {
      console.error("[ai-agent] openai_call_failed", errorMessage);
    }
    return friendlyError(getProviderUnavailableMessage(err), 503);
  }

  if (!assistantMessage) {
    return friendlyError("The AI assistant did not return a response. Please try again.");
  }

  const totalTokens = actualInputTokens + actualOutputTokens;
  const cost = estimateCost(actualInputTokens, actualOutputTokens);

  // 10. Save conversation messages + usage (best-effort)
  if (prisma && activeConversationId) {
    try {
      await prisma.$transaction([
        prisma.aIMessage.create({
          data: { conversationId: activeConversationId, role: "user", content: userMessage },
        }),
        prisma.aIMessage.create({
          data: {
            conversationId: activeConversationId,
            role: "assistant",
            content: assistantMessage,
          },
        }),
        prisma.aIConversation.update({
          where: { id: activeConversationId },
          data: {
            messageCount: { increment: 2 },
            totalTokens: { increment: totalTokens },
          },
        }),
      ]);
    } catch (err) {
      if (isAIStorageUnavailableError(err)) {
        logAIStorageIssue("message_save_skipped", err);
      } else {
        console.error("[ai-agent] message_save_failed", getErrorMessage(err));
      }
    }
  }

  // 11. Save usage record
  if (prisma) {
    try {
      await prisma.aIUsage.create({
        data: {
          ipHash,
          sessionId,
          conversationId: activeConversationId,
          model: AI_CONFIG.model,
          inputTokens: actualInputTokens,
          outputTokens: actualOutputTokens,
          totalTokens,
          estimatedCost: cost,
          requestType: "PUBLIC_AGENT",
        },
      });
    } catch (err) {
      if (isAIStorageUnavailableError(err)) {
        logAIStorageIssue("usage_save_skipped", err);
      } else {
        console.error("[ai-agent] usage_save_failed", getErrorMessage(err));
      }
    }
  }

  return NextResponse.json({
    message: assistantMessage,
    conversationId: activeConversationId,
    usage: {
      inputTokens: actualInputTokens,
      outputTokens: actualOutputTokens,
      totalTokens,
    },
  });
}

// ─── PUT /api/ai/techia-agent (Lead & Demo endpoints) ─────────────────────────

export async function PUT(request: NextRequest) {
  let body: Record<string, unknown> | null = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const action = typeof body?.action === "string" ? body.action : "";
  const prisma = getPrisma();

  if (action === "save_lead") {
    const data = body?.data as SaveLeadPayload | undefined;
    if (!data?.serviceInterest || !data?.projectSummary || !data?.leadScore) {
      return NextResponse.json({ error: "Missing required lead fields" }, { status: 400 });
    }
    const validScores: string[] = ["HOT", "WARM", "COLD"];
    if (!validScores.includes(data.leadScore)) {
      return NextResponse.json({ error: "Invalid lead score" }, { status: 400 });
    }

    let leadId: string | null = null;
    if (prisma) {
      try {
        const lead = await prisma.aILead.create({
          data: {
            name: data.name || null,
            email: data.email || null,
            phone: data.phone || null,
            companyName: data.companyName || null,
            industry: data.industry || null,
            serviceInterest: data.serviceInterest,
            budgetRange: data.budgetRange || null,
            timeline: data.timeline || null,
            projectSummary: data.projectSummary,
            leadScore: data.leadScore,
            conversationId:
              typeof body?.conversationId === "string" ? body.conversationId : null,
          },
        });
        leadId = lead.id;
      } catch (err) {
        if (isAIStorageUnavailableError(err)) {
          logAIStorageIssue("lead_save_skipped", err);
        } else {
          console.error("[ai-agent] lead_save_failed", getErrorMessage(err));
          return NextResponse.json(
            { error: "Failed to save lead. Please try again." },
            { status: 500 }
          );
        }
      }
    }

    // Notify admin for HOT/WARM leads
    if (data.leadScore === "HOT" || data.leadScore === "WARM") {
      notifyAdminOfAILead({
        name: data.name,
        email: data.email,
        phone: data.phone,
        companyName: data.companyName,
        serviceInterest: data.serviceInterest,
        leadScore: data.leadScore,
        budgetRange: data.budgetRange,
        timeline: data.timeline,
        projectSummary: data.projectSummary,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, leadId });
  }

  if (action === "save_demo_request") {
    const data = body?.data as SaveDemoRequestPayload | undefined;
    if (!data?.demoType) {
      return NextResponse.json({ error: "Missing demo type" }, { status: 400 });
    }

    let demoId: string | null = null;
    if (prisma) {
      try {
        const demo = await prisma.aIDemoRequest.create({
          data: {
            demoType: data.demoType,
            name: data.name || null,
            email: data.email || null,
            phone: data.phone || null,
            companyName: data.companyName || null,
            preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
            preferredContactMethod: data.preferredContactMethod || null,
            notes: data.notes || null,
            conversationId:
              typeof body?.conversationId === "string" ? body.conversationId : null,
          },
        });
        demoId = demo.id;
      } catch (err) {
        if (isAIStorageUnavailableError(err)) {
          logAIStorageIssue("demo_request_save_skipped", err);
        } else {
          console.error("[ai-agent] demo_request_save_failed", getErrorMessage(err));
          return NextResponse.json(
            { error: "Failed to save demo request. Please try again." },
            { status: 500 }
          );
        }
      }
    }

    notifyAdminOfAIDemoRequest({
      name: data.name,
      email: data.email,
      demoType: data.demoType,
      notes: data.notes,
      companyName: data.companyName,
    }).catch(() => {});

    return NextResponse.json({ ok: true, demoId });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
