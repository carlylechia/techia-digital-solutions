-- AlterTable
ALTER TABLE "AIUsage" ADD COLUMN "providerOutcome" TEXT;
ALTER TABLE "AIUsage" ADD COLUMN "reconciliationRequired" BOOLEAN NOT NULL DEFAULT false;
