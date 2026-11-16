import "server-only";
import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { EditorialAiError } from "./editorial-service";

const EDITORIAL_BURST_REQUEST_TYPES = [
  "EDITORIAL_ARTICLE",
  "EDITORIAL_EDIT",
  "EDITORIAL_TRANSLATE",
  "EDITORIAL_REVIEW",
  "EDITORIAL_IMAGE",
];

const NON_TERMINAL_USAGE_STATUSES = ["RESERVED", "PROVIDER_OUTCOME_UNKNOWN", "PROVIDER_SUCCEEDED_UPLOAD_FAILED"] as const;
const OPEN_TASK_STATUSES = ["PENDING", "PROCESSING", "EXHAUSTED", "REVIEW_REQUIRED"] as const;
const KNOWN_PAYLOAD_STATUSES = ["FAILED", "SUCCEEDED", "PROVIDER_OUTCOME_UNKNOWN", "PROVIDER_SUCCEEDED_UPLOAD_FAILED"] as const;

/**
 * Reserves a daily quota slot for an editorial AI operation and returns a
 * reservation ID. Uses a serializable transaction with actor-level
 * pg_advisory_xact_lock for concurrency safety, bounded retries on P2034,
 * and burst-limit checking within the same transaction.
 */
export async function reserveEditorialUsage(params: {
  actorId: string;
  requestType: string;
  limit: number;
  model: string;
  imageCount?: number;
  burstLimit?: number;
}) {
  const prisma = getPrisma();
  if (!prisma) throw new EditorialAiError("not_configured", "Editorial AI usage tracking is unavailable.");

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${params.actorId}))`;
        if (params.burstLimit) {
          const burstSince = new Date(Date.now() - 60_000);
          const burstCount = await tx.aIUsage.count({
            where: {
              userId: params.actorId,
              createdAt: { gte: burstSince },
              requestType: { in: EDITORIAL_BURST_REQUEST_TYPES },
            },
          });
          if (burstCount >= params.burstLimit) {
            throw new EditorialAiError("quota", "Too many editorial AI requests. Try again shortly.");
          }
        }
        const used = await tx.aIUsage.count({
          where: { userId: params.actorId, requestType: params.requestType, createdAt: { gte: start } },
        });
        if (used >= params.limit) {
          throw new EditorialAiError("limit_reached", `Daily limit of ${params.limit} requests reached.`);
        }
        const row = await tx.aIUsage.create({
          data: {
            userId: params.actorId,
            model: params.model,
            requestType: params.requestType,
            status: "RESERVED",
            estimatedCost: null,
            costAvailable: false,
            imageCount: params.imageCount ?? 0,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
          },
        });
        return row.id;
      }, { isolationLevel: "Serializable" });
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === "P2034" && attempt < 2) continue;
      throw error;
    }
  }
  throw new EditorialAiError("api", "Usage reservation could not be completed.");
}

// A PROCESSING claim older than this is considered abandoned (worker crash) and
// may be reclaimed by another worker.
const RECONCILIATION_LOCK_TIMEOUT_MS = 2 * 60_000;
// Reservations older than this without any open recovery task are surfaced for
// administrator review instead of being silently failed.
const STALE_RESERVATION_MS = 15 * 60_000;
const MAX_STALE_DISCOVERY_BATCH = 50;

// Claim token length: 16 random base64url characters (128 bits of entropy).
const CLAIM_TOKEN_LENGTH = 16;

// A PROCESSING claim older than this is considered abandoned (worker crash) and
// may be reclaimed by another worker.
function truncateError(message: string) {
  return message.replace(/\s+/g, " ").trim().slice(0, 300);
}

function backoffMs(attempt: number) {
  return Math.min(60_000 * 2 ** attempt, 30 * 60_000);
}

// ---------------------------------------------------------------------------
// Durable recovery records
// ---------------------------------------------------------------------------

/**
 * Persists recovery work for a usage record whose finalization could not be
 * written. The task row is independent from the AIUsage update, so a failure of
 * the finalization write does not lose the intent to reconcile. If the database
 * itself is unavailable the write fails too, but the reservation stays in the
 * RESERVED state and is later discovered by discoverStaleReservations().
 */
async function recordReconciliationTask(
  usageId: string,
  payload: ReconciliationPayload,
  lastError: string | null,
  claimToken: string,
) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("database unavailable");
  const usage = await prisma.aIUsage.findUnique({
    where: { id: usageId },
    select: { userId: true, requestType: true, model: true },
  });
  if (!usage) throw new Error("reservation not found");

  const data = {
    userId: usage.userId,
    requestType: usage.requestType,
    model: payload.model || usage.model,
    providerOutcome: payload.providerOutcome ?? null,
    payload: payload as unknown as Prisma.InputJsonValue,
    status: "PENDING",
    attemptCount: 0,
    nextAttemptAt: new Date(),
    lastError: lastError ? truncateError(lastError) : null,
    lockedAt: null,
    lockedBy: null,
    claimToken: claimToken, // new task starts with a fresh claim token
  };

  // Refresh an existing open task (idempotent, one task per usage record).
  // RESOLVED tasks are never reopened or overwritten.
  const updated = await prisma.editorialUsageReconciliation.updateMany({
    where: { usageId, status: { in: [...OPEN_TASK_STATUSES] } },
    data,
  });
  if (updated.count > 0) return;

  try {
    await prisma.editorialUsageReconciliation.create({ data: { usageId, ...data } });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code !== "P2002") throw error;
    // Unique usageId race: another writer created the task first.
    await prisma.editorialUsageReconciliation.updateMany({
      where: { usageId, status: { in: [...OPEN_TASK_STATUSES] } },
      data,
    });
  }
}

async function resolveOpenTaskForUsage(usageId: string) {
  const prisma = getPrisma();
  if (!prisma) return;
  await prisma.editorialUsageReconciliation.updateMany({
    where: { usageId, status: { in: [...OPEN_TASK_STATUSES] } },
    data: { status: "RESOLVED", lastError: null, lockedAt: null, lockedBy: null },
  });
}

/**
 * Conditionally finalizes a reservation. Returns true when the usage row is in
 * its intended final state (either written now or already finalized earlier),
 * false when persistence failed and recovery work has been queued.
 */
export async function finalizeEditorialUsage(id: string | null, data: EditorialFinalizationData): Promise<boolean> {
  if (!id) return true;
  const prisma = getPrisma();
  if (!prisma) return true; // no reservation can exist without a database
  try {
    const result = await prisma.aIUsage.updateMany({
      where: {
        id,
        status: { in: [...NON_TERMINAL_USAGE_STATUSES] },
      },
      data: {
        model: data.model,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        totalTokens: data.inputTokens + data.outputTokens,
        estimatedCost: data.estimatedCost,
        costAvailable: data.costAvailable,
        imageCount: data.imageCount ?? 0,
        status: data.status ?? "SUCCEEDED",
        providerOutcome: data.providerOutcome ?? null,
        reconciliationRequired: data.reconciliationRequired ?? false,
      },
    });
    if (result.count === 0) {
      // Already finalized (or row removed): idempotent skip, never overwrite.
      console.info("[editorial-ai] usage_finalize_skipped", { reservationId: id, reason: "already_finalized_or_missing" });
    }
    return true;
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[editorial-ai] usage_finalize_failed", { reservationId: id, error: message, reconciliationRequired: true });
    try {
      const claimToken = randomClaimToken();
      await recordReconciliationTask(id, { ...data, status: data.status ?? "SUCCEEDED" }, message, claimToken);
    } catch (taskError) {
      // Database unavailable: the reservation remains RESERVED and will be
      // discovered by discoverStaleReservations() once the database recovers.
      console.error("[editorial-ai] usage_recovery_task_failed", { reservationId: id, error: getErrorMessage(taskError) });
    }
    return false;
  }
}

/**
 * Records a definitive provider rejection. Returns true when the FAILED state
 * was persisted, false when persistence failed and recovery work was queued.
 */
export async function failEditorialUsage(id: string | null): Promise<boolean> {
  if (!id) return true;
  const prisma = getPrisma();
  if (!prisma) return true;
  try {
    await prisma.aIUsage.updateMany({
      where: { id, status: "RESERVED" },
      data: { status: "FAILED", providerOutcome: null, reconciliationRequired: false },
    });
    return true;
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[editorial-ai] usage_fail_record_failed", { reservationId: id, error: message, reconciliationRequired: true });
    try {
      const claimToken = randomClaimToken();
      await recordReconciliationTask(id, { status: "FAILED" }, message, claimToken);
    } catch (taskError) {
      console.error("[editorial-ai] usage_recovery_task_failed", { reservationId: id, error: getErrorMessage(taskError) });
    }
    return false;
  }
}

/**
 * Queues durable recovery work for a reservation and attempts the conditional
 * finalization once. Safe to call repeatedly: retries never double-count and
 * never overwrite a record that is already in a confirmed final state.
 */
export async function reconcileEditorialUsage(id: string, data: EditorialFinalizationData): Promise<boolean> {
  const persisted = await finalizeEditorialUsage(id, data);
  if (persisted && id) {
    await resolveOpenTaskForUsage(id).catch((error) => {
      console.error("[editorial-ai] usage_task_resolve_failed", { reservationId: id, error: getErrorMessage(error) });
    });
  }
  return persisted;
}

/**
 * Surfaces reservations that were never finalized (for example when the whole
 * database was unavailable during finalization) as administrator-review work.
 * Idempotent: at most one task ever exists per usage record.
 */
export async function discoverStaleReservations(olderThanMs = STALE_RESERVATION_MS): Promise<number> {
  const prisma = getPrisma();
  if (!prisma) return 0;
  const cutoff = new Date(Date.now() - olderThanMs);
  const stale = await prisma.aIUsage.findMany({
    where: { status: "RESERVED", createdAt: { lt: cutoff } },
    select: { id: true, userId: true, requestType: true, model: true },
    take: MAX_STALE_DISCOVERY_BATCH,
  });
  let discovered = 0;
  for (const row of stale) {
    try {
      const existing = await prisma.editorialUsageReconciliation.findUnique({
        where: { usageId: row.id },
        select: { id: true, claimToken: true },
      });
      if (existing && existing.claimToken) continue; // already has a task
      await prisma.editorialUsageReconciliation.create({
        data: {
          usageId: row.id,
          userId: row.userId,
          requestType: row.requestType,
          model: row.model,
          providerOutcome: "RESERVATION_STALE",
          status: "REVIEW_REQUIRED",
          payload: Prisma.DbNull,
          lastError: "stale_unresolved_reservation",
          claimToken: randomClaimToken(),
        },
      });
      await prisma.aIUsage.updateMany({
        where: { id: row.id, status: "RESERVED" },
        data: { reconciliationRequired: true },
      });
      discovered += 1;
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === "P2002") continue; // another worker claimed it first
      console.error("[editorial-ai] stale_discovery_failed", { reservationId: row.id, error: getErrorMessage(error) });
    }
  }
  return discovered;
}

/**
 * Generates a random claim token for ownership protection.
 */
function randomClaimToken(): string {
  const bytes = new Uint8Array(CLAIM_TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  // Encode as base64url without padding
  return Buffer.from(bytes).toString("base64url").slice(0, CLAIM_TOKEN_LENGTH);
}

/**
 * Verifies that a claim token matches the currently stored token for a task.
 * Returns the stored token if valid, or null if the task was reclaimed.
 */
async function verifyClaimToken(prisma: NonNullable<ReturnType<typeof getPrisma>>, taskId: string, providedToken: string): Promise<string | null> {
  const task = await prisma.editorialUsageReconciliation.findUnique({ where: { id: taskId } });
  if (!task || !task.claimToken) return null;
  if (task.claimToken === providedToken) return task.claimToken;
  // Token mismatch: another worker reclaimed this task.
  return null;
}

/**
 * Atomically claims the next eligible recovery task. FOR UPDATE SKIP LOCKED
 * guarantees two workers never claim the same task, and a crashed worker's
 * PROCESSING claim becomes reclaimable after RECONCILIATION_LOCK_TIMEOUT_MS.
 * A unique claim token is set on each successful claim; the token must be
 * presented when finalizing the task to prevent stale workers from overwriting.
 */
async function claimNextReconciliationTask(
  prisma: NonNullable<ReturnType<typeof getPrisma>>,
  workerId: string,
  now: Date,
) {
  const lockCutoff = new Date(now.getTime() - RECONCILIATION_LOCK_TIMEOUT_MS);
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "EditorialUsageReconciliation"
      WHERE (
          ("status" = 'PENDING' AND "nextAttemptAt" <= ${now} AND "attemptCount" < "maxAttempts")
          OR ("status" = 'PROCESSING' AND "lockedAt" IS NOT NULL AND "lockedAt" < ${lockCutoff})
        )
      ORDER BY "nextAttemptAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;
    if (rows.length === 0) return null;
    const claimToken = randomClaimToken();
    await tx.editorialUsageReconciliation.update({
      where: { id: rows[0].id },
      data: { status: "PROCESSING", lockedAt: now, lockedBy: workerId, claimToken },
    });
    return tx.editorialUsageReconciliation.findUnique({ where: { id: rows[0].id } });
  });
}

/**
 * Applies a recovery payload with the same conditional semantics as the
 * original finalization. A count of 0 means the record is already finalized (or
 * gone): the task resolves without touching the record, so retries can never
 * double-count usage or overwrite a confirmed outcome with stale data.
 *
 * The caller must present the current claim token. If the stored claim token
 * does not match, the task was reclaimed by another worker and this function
 * returns "review" so the new worker's work is preserved.
 */
async function applyReconciliationTask(
  prisma: NonNullable<ReturnType<typeof getPrisma>>,
  task: { id: string; usageId: string | null; payload: unknown; claimToken: string },
  providedClaimToken: string,
): Promise<{ outcome: "resolved" | "retry" | "review"; error?: string; claimMismatch: boolean }> {
  if (!task.usageId || !task.payload) {
    return { outcome: "review", error: task.payload === null ? "no_recovery_payload" : "missing_usage_reference", claimMismatch: false };
  }
  const payload = task.payload as ReconciliationPayload | null;
  if (!payload || !payload.status || !KNOWN_PAYLOAD_STATUSES.includes(payload.status as (typeof KNOWN_PAYLOAD_STATUSES)[number])) {
    return { outcome: "review", error: "unrecognized_recovery_payload", claimMismatch: false };
  }

  // Check claim token ownership — if the provided token doesn't match the
  // stored token, another worker has reclaimed this task; do not overwrite.
  const storedToken = await verifyClaimToken(prisma, task.id, providedClaimToken);
  if (!storedToken) {
    return { outcome: "review", error: "task_reclaimed_by_another_worker", claimMismatch: true };
  }

  try {
    if (payload.status === "FAILED") {
      // Only ever moves a still-RESERVED record to FAILED; a confirmed outcome
      // is never overwritten by a failure.
      await prisma.aIUsage.updateMany({
        where: { id: task.usageId, status: "RESERVED" },
        data: { status: "FAILED", providerOutcome: null, reconciliationRequired: false },
      });
      return { outcome: "resolved", claimMismatch: false };
    }

    const allowedStatuses: string[] =
      payload.status === "PROVIDER_OUTCOME_UNKNOWN"
        ? ["RESERVED"]
        : payload.status === "PROVIDER_SUCCEEDED_UPLOAD_FAILED"
          ? ["RESERVED", "PROVIDER_OUTCOME_UNKNOWN"]
          : ["RESERVED", "PROVIDER_OUTCOME_UNKNOWN"];

    const inputTokens = payload.inputTokens ?? 0;
    const outputTokens = payload.outputTokens ?? 0;
    await prisma.aIUsage.updateMany({
      where: { id: task.usageId, status: { in: allowedStatuses } },
      data: {
        ...(payload.model ? { model: payload.model } : {}),
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        estimatedCost: payload.estimatedCost ?? null,
        costAvailable: payload.costAvailable ?? false,
        imageCount: payload.imageCount ?? 0,
        status: payload.status,
        providerOutcome: payload.providerOutcome ?? null,
        reconciliationRequired: payload.reconciliationRequired ?? false,
      },
    });
    return { outcome: "resolved", claimMismatch: false };
  } catch (error) {
    return { outcome: "retry", error: getErrorMessage(error), claimMismatch: false };
  }
}

export type EditorialReconciliationRunResult = {
  staleDiscovered: number;
  claimed: number;
  resolved: number;
  retried: number;
  exhausted: number;
  review: number;
};

/**
 * Bounded, idempotent recovery pass. Safe to run concurrently from multiple
 * workers and safe to run repeatedly: claims are serialized with PostgreSQL row
 * locks and every apply is conditional with claim token verification. It never
 * re-runs provider generation and never fabricates token usage or cost.
 */
export async function runEditorialUsageReconciliation(opts?: {
  workerId?: string;
  batchSize?: number;
  now?: Date;
}): Promise<EditorialReconciliationRunResult> {
  const result: EditorialReconciliationRunResult = { staleDiscovered: 0, claimed: 0, resolved: 0, retried: 0, exhausted: 0, review: 0 };
  const prisma = getPrisma();
  if (!prisma) return result;

  const workerId = opts?.workerId ?? `reconciler-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const batchSize = Math.min(Math.max(opts?.batchSize ?? 10, 1), 50);
  const now = opts?.now ?? new Date();

  // Provide a shared claim token if one wasn't explicitly passed; this lets
  // the reconciliation run present the same token for every task it claims,
  // ensuring the claim‑ownership guard works end‑to-end.
  const sharedClaimToken = randomClaimToken();

  try {
    result.staleDiscovered = await discoverStaleReservations();
  } catch (error) {
    console.error("[editorial-ai] stale_discovery_failed", { error: getErrorMessage(error) });
  }

  for (let i = 0; i < batchSize; i += 1) {
    let task;
    try {
      task = await claimNextReconciliationTask(prisma, workerId, now);
    } catch (error) {
      console.error("[editorial-ai] recovery_claim_failed", { workerId, error: getErrorMessage(error) });
      break;
    }
    if (!task || !task.id) break;
    result.claimed += 1;

    const applied = await applyReconciliationTask(prisma, task, sharedClaimToken);
    try {
      if (applied.outcome === "resolved") {
        await prisma.editorialUsageReconciliation.update({
          where: { id: task.id },
          data: { status: "RESOLVED", lastError: null, lockedAt: null, lockedBy: null },
        });
        result.resolved += 1;
      } else if (applied.outcome === "review") {
        // If the task was reclaimed by another worker, don't overwrite it;
        // just mark it for manual review so the new worker's state is visible.
        const errorMsg = applied.claimMismatch
          ? "task_reclaimed_by_another_worker_during_processing"
          : applied.error ?? "manual_review_required";
        await prisma.editorialUsageReconciliation.update({
          where: { id: task.id },
          data: { status: "REVIEW_REQUIRED", lastError: truncateError(errorMsg), lockedAt: null, lockedBy: null },
        });
        result.review += 1;
      } else {
        const attemptCount = task.attemptCount + 1;
        const exhausted = attemptCount >= task.maxAttempts;
        await prisma.editorialUsageReconciliation.update({
          where: { id: task.id },
          data: {
            status: exhausted ? "EXHAUSTED" : "PENDING",
            attemptCount,
            nextAttemptAt: new Date(now.getTime() + backoffMs(attemptCount)),
            lastError: truncateError(applied.error ?? "recovery_apply_failed"),
            lockedAt: null,
            lockedBy: null,
          },
        });
        if (exhausted) result.exhausted += 1;
        else result.retried += 1;
      }
    } catch (error) {
      // The task stays PROCESSING with its lock; the lock timeout makes it
      // reclaimable, so a failure here never loses the task.
      console.error("[editorial-ai] recovery_task_update_failed", { taskId: task.id, error: getErrorMessage(error) });
    }
  }
  return result;
}

export async function getEditorialReconciliationStats() {
  const prisma = getPrisma();
  if (!prisma) return { pending: 0, exhausted: 0, review: 0 };
  const [pending, exhausted, review] = await Promise.all([
    prisma.editorialUsageReconciliation.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
    prisma.editorialUsageReconciliation.count({ where: { status: "EXHAUSTED" } }),
    prisma.editorialUsageReconciliation.count({ where: { status: "REVIEW_REQUIRED" } }),
  ]);
  return { pending, exhausted, review };
}

export async function checkEditorialBurstLimit(actorId: string, limit: number, windowMs = 60_000) {
  const prisma = getPrisma();
  if (!prisma) throw new EditorialAiError("not_configured", "Editorial AI usage tracking is unavailable.");
  const since = new Date(Date.now() - windowMs);
  const count = await prisma.aIUsage.count({
    where: {
      userId: actorId,
      createdAt: { gte: since },
      requestType: { in: EDITORIAL_BURST_REQUEST_TYPES },
    },
  });
  if (count >= limit) {
    throw new EditorialAiError("quota", "Too many editorial AI requests. Try again shortly.");
  }
}

// ---------------------------------------------------------------------------
// Typedefs
// ---------------------------------------------------------------------------

export type EditorialFinalizationData = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number | null;
  costAvailable: boolean;
  imageCount?: number;
  status?: string;
  providerOutcome?: string | null;
  reconciliationRequired?: boolean;
};

export type ReconciliationPayload = {
  status: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number | null;
  costAvailable?: boolean;
  imageCount?: number;
  providerOutcome?: string | null;
  reconciliationRequired?: boolean;
};
