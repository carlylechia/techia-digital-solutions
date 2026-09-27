-- CreateEnum
CREATE TYPE "OutreachRunTrigger" AS ENUM ('CRON', 'MANUAL', 'TEST');

-- CreateEnum
CREATE TYPE "OutreachRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED');

-- Note: `prisma migrate diff` also emitted `ALTER TABLE "HomepageFaq" ALTER COLUMN
-- "updatedAt" DROP DEFAULT;`. That is unrelated pre-existing drift between the
-- committed schema and the migration history, not part of this change, so it has
-- deliberately been left out to keep the migration strictly additive and scoped.

-- AlterTable
ALTER TABLE "OutreachCampaign" ADD COLUMN     "activeRunId" TEXT;

-- AlterTable
ALTER TABLE "OutreachCampaign" ADD COLUMN     "lastRunStartedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OutreachRun" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "trigger" "OutreachRunTrigger" NOT NULL,
    "status" "OutreachRunStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "discoveredCount" INTEGER,
    "processedCount" INTEGER,
    "qualifiedCount" INTEGER,
    "draftsGeneratedCount" INTEGER,
    "emailsSentCount" INTEGER DEFAULT 0,
    "skippedCount" INTEGER,
    "failedCount" INTEGER,
    "summary" TEXT,
    "createdById" TEXT,
    "resumedFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutreachRun_campaignId_createdAt_idx" ON "OutreachRun"("campaignId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "OutreachRun_createdAt_idx" ON "OutreachRun"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "OutreachRun_status_idx" ON "OutreachRun"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachCampaign_activeRunId_key" ON "OutreachCampaign"("activeRunId");

-- AddForeignKey
ALTER TABLE "OutreachRun" ADD CONSTRAINT "OutreachRun_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "OutreachCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachRun" ADD CONSTRAINT "OutreachRun_resumedFromId_fkey" FOREIGN KEY ("resumedFromId") REFERENCES "OutreachRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

