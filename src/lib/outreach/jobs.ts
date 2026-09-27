import "server-only";

import { randomUUID } from "node:crypto";
import type { OutreachJobType } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { OUTREACH_SAFETY } from "./config";

/**
 * Database-backed job queue.
 *
 * The deployment target is a serverless platform with no long-lived worker
 * process, so the queue is a table and the "worker" is a cron-invoked function
 * that claims a small batch of jobs and processes them within the request.
 *
 * Safety properties:
 *   - claiming is a conditional UPDATE, so two concurrent invocations can never
 *     take the same job
 *   - an abandoned lock is reclaimed after a timeout
 *   - retries are bounded by maxAttempts with exponential backoff
 *   - handlers must be idempotent; SEND_EMAIL additionally relies on a provider
 *     idempotency key so a retried job cannot deliver twice
 */

export type PrismaLike = NonNullable<ReturnType<typeof getPrisma>>;

export type ClaimedJob = {
  id: string;
  type: OutreachJobType;
  campaignId: string | null;
  prospectId: string | null;
  attempts: number;
  maxAttempts: number;
  payload: unknown;
  lockToken: string;
};

export class OutreachJobError extends Error {
  readonly retryable: boolean;
  readonly category: string;

  constructor(message: string, options: { retryable?: boolean; category?: string } = {}) {
    super(message);
    this.name = "OutreachJobError";
    this.retryable = options.retryable ?? true;
    this.category = options.category ?? "unknown";
  }
}

export function backoffMs(attempts: number) {
  const minutes = Math.min(60, 2 ** Math.max(0, attempts - 1));
  return minutes * 60_000;
}

/** Deterministic dedupe key so a repeated enqueue collapses into one live job. */
export function buildDedupeKey(type: OutreachJobType, target: { campaignId?: string | null; prospectId?: string | null; discriminator?: string }) {
  return [type, target.campaignId ?? "-", target.prospectId ?? "-", target.discriminator ?? "-"].join(":");
}

export async function enqueueJob(input: {
  type: OutreachJobType;
  campaignId?: string | null;
  prospectId?: string | null;
  dedupeKey?: string | null;
  scheduledFor?: Date;
  payload?: Record<string, unknown>;
  maxAttempts?: number;
}) {
  const prisma = getPrisma();
  if (!prisma) return null;

  const dedupeKey = input.dedupeKey ?? buildDedupeKey(input.type, input);

  // A finished job with the same key must not block a legitimate later run, so
  // only live (PENDING/PROCESSING) jobs participate in the uniqueness guard.
  const existing = await prisma.outreachJob.findFirst({
    where: { dedupeKey, status: { in: ["PENDING", "PROCESSING"] } },
    select: { id: true },
  });
  if (existing) return existing.id;

  try {
    const job = await prisma.outreachJob.create({
      data: {
        type: input.type,
        campaignId: input.campaignId ?? null,
        prospectId: input.prospectId ?? null,
        dedupeKey,
        scheduledFor: input.scheduledFor ?? new Date(),
        payload: (input.payload ?? {}) as object,
        maxAttempts: Math.min(10, Math.max(1, input.maxAttempts ?? 3)),
      },
      select: { id: true },
    });
    return job.id;
  } catch (error) {
    // Unique-violation on dedupeKey means a concurrent caller already enqueued
    // the same work, which is exactly the outcome we wanted.
    const message = getErrorMessage(error).toLowerCase();
    if (message.includes("unique") || message.includes("duplicate")) {
      const existing = await prisma.outreachJob.findFirst({ where: { dedupeKey }, select: { id: true } });
      return existing?.id ?? null;
    }
    throw error;
  }
}

/** Reclaim jobs whose worker died mid-flight so the queue never wedges. */
export async function reapStaleJobs(now = new Date()) {
  const prisma = getPrisma();
  if (!prisma) return 0;
  const cutoff = new Date(now.getTime() - OUTREACH_SAFETY.jobLockTimeoutMinutes * 60_000);
  const result = await prisma.outreachJob.updateMany({
    where: { status: "PROCESSING", lockedAt: { lt: cutoff } },
    data: { status: "PENDING", lockToken: null, lockedAt: null, scheduledFor: now },
  });
  if (result.count > 0) {
    console.warn("[outreach-jobs] reclaimed_stale_locks", { count: result.count, cutoff: cutoff.toISOString() });
  }
  return result.count;
}

/**
 * Atomically claim up to `limit` due jobs. Each row is moved PENDING →
 * PROCESSING with a unique lock token in a single conditional UPDATE, which is
 * the only place a job can be handed to a worker.
 */
export async function claimJobs(limit: number, now = new Date()): Promise<ClaimedJob[]> {
  const prisma = getPrisma();
  if (!prisma) return [];

  const candidates = await prisma.outreachJob.findMany({
    where: { status: "PENDING", scheduledFor: { lte: now } },
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
    take: limit,
    select: { id: true },
  });

  const claimed: ClaimedJob[] = [];
  for (const candidate of candidates) {
    const lockToken = randomUUID();
    const result = await prisma.outreachJob.updateMany({
      where: { id: candidate.id, status: "PENDING" },
      data: { status: "PROCESSING", startedAt: now, lockedAt: now, lockToken, attempts: { increment: 1 } },
    });
    if (result.count !== 1) continue; // another worker won this row

    const job = await prisma.outreachJob.findUnique({ where: { id: candidate.id } });
    if (!job) continue;
    claimed.push({
      id: job.id,
      type: job.type,
      campaignId: job.campaignId,
      prospectId: job.prospectId,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      payload: job.payload,
      lockToken,
    });
  }
  return claimed;
}

export async function completeJob(jobId: string, lockToken: string, now = new Date()) {
  const prisma = getPrisma();
  if (!prisma) return;
  await prisma.outreachJob.updateMany({
    where: { id: jobId, status: "PROCESSING", lockToken },
    data: { status: "COMPLETED", completedAt: now, lockedAt: null, lockToken: null, errorMessage: null },
  });
}

export async function failJob(
  job: Pick<ClaimedJob, "id" | "lockToken" | "attempts" | "maxAttempts">,
  error: unknown,
  now = new Date()
) {
  const prisma = getPrisma();
  if (!prisma) return;

  const retryable = !(error instanceof OutreachJobError) || error.retryable;
  const exhausted = job.attempts >= job.maxAttempts || !retryable;
  const message = getErrorMessage(error).slice(0, 2_000);

  await prisma.outreachJob.updateMany({
    where: { id: job.id, status: "PROCESSING", lockToken: job.lockToken },
    data: exhausted
      ? { status: "FAILED", completedAt: now, lockedAt: null, lockToken: null, errorMessage: message }
      : {
          status: "PENDING",
          lockedAt: null,
          lockToken: null,
          errorMessage: message,
          scheduledFor: new Date(now.getTime() + backoffMs(job.attempts)),
        },
  });
}

export async function cancelJobsForProspect(prospectId: string, types: OutreachJobType[]) {
  const prisma = getPrisma();
  if (!prisma) return 0;
  const result = await prisma.outreachJob.updateMany({
    where: { prospectId, type: { in: types }, status: { in: ["PENDING", "PROCESSING"] } },
    data: { status: "CANCELLED", completedAt: new Date(), lockedAt: null, lockToken: null },
  });
  return result.count;
}

export async function countQueuedJobs(now = new Date()) {
  const prisma = getPrisma();
  if (!prisma) return { pending: 0, processing: 0, failed: 0 };
  const [pending, processing, failed] = await Promise.all([
    prisma.outreachJob.count({ where: { status: "PENDING", scheduledFor: { lte: now } } }),
    prisma.outreachJob.count({ where: { status: "PROCESSING" } }),
    prisma.outreachJob.count({ where: { status: "FAILED" } }),
  ]);
  return { pending, processing, failed };
}
