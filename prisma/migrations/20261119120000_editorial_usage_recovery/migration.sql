-- CreateTable
CREATE TABLE "EditorialUsageReconciliation" (
    "id" TEXT NOT NULL,
    "usageId" TEXT,
    "userId" TEXT,
    "requestType" TEXT NOT NULL,
    "model" TEXT,
    "providerOutcome" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "payload" JSONB,
    "claimToken" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorialUsageReconciliation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EditorialUsageReconciliation" ADD CONSTRAINT "EditorialUsageReconciliation_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "AIUsage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "EditorialUsageReconciliation_status_nextAttemptAt_idx" ON "EditorialUsageReconciliation"("status", "nextAttemptAt");
CREATE UNIQUE INDEX "EditorialUsageReconciliation_usageId_key" ON "EditorialUsageReconciliation"("usageId");
CREATE INDEX "EditorialUsageReconciliation_userId_idx" ON "EditorialUsageReconciliation"("userId");
