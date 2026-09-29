-- Outreach Readiness & Qualification — strictly additive migration.
--
-- Adds the second score (Outreach Readiness) and structured qualification
-- fields to the outreach engine without altering any existing row, column or
-- constraint.
--
-- Safety notes for production rollout:
--   * No DROP, no ALTER COLUMN, no DELETE, no RENAME.
--   * Every ALTER TABLE is ADD COLUMN, so existing rows keep working unchanged
--     and no backfill is required.
--   * New columns are nullable or have defaults, so existing rows are valid.
--   * New indexes are additive and do not affect existing query plans.

-- AlterTable
ALTER TABLE "OutreachCampaign" ADD COLUMN     "minReadinessScore" INTEGER NOT NULL DEFAULT 70,
ADD COLUMN     "maxApprovedProspects" INTEGER;

-- AlterTable
ALTER TABLE "OutreachProspect" ADD COLUMN     "outreachReadinessScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "qualificationStatus" TEXT,
ADD COLUMN     "qualificationConfidence" DOUBLE PRECISION,
ADD COLUMN     "primaryOpportunity" TEXT,
ADD COLUMN     "qualificationReason" TEXT,
ADD COLUMN     "disqualificationReason" TEXT,
ADD COLUMN     "recommendedNextAction" TEXT;

-- AlterTable
ALTER TABLE "OutreachAssessment" ADD COLUMN     "outreachReadinessScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "qualificationStatus" TEXT,
ADD COLUMN     "qualificationConfidence" DOUBLE PRECISION,
ADD COLUMN     "primaryOpportunity" TEXT,
ADD COLUMN     "qualificationReason" TEXT,
ADD COLUMN     "disqualificationReason" TEXT,
ADD COLUMN     "recommendedNextAction" TEXT;

-- CreateIndex
CREATE INDEX "OutreachProspect_outreachReadinessScore_idx" ON "OutreachProspect"("outreachReadinessScore" DESC);

-- CreateIndex
CREATE INDEX "OutreachProspect_qualificationStatus_idx" ON "OutreachProspect"("qualificationStatus");

-- CreateIndex
CREATE INDEX "OutreachProspect_campaignId_qualificationStatus_idx" ON "OutreachProspect"("campaignId", "qualificationStatus");
