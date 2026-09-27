-- SME Outreach Engine — strictly additive migration.
--
-- Safety notes for production rollout:
--   * No DROP, no ALTER COLUMN, no DELETE, no RENAME. No existing table is
--     modified and no existing column, index or constraint is touched.
--   * The only reference to an existing table is a new foreign key from
--     "OutreachMessage"."approvedById" to "AdminUser"."id", which adds a
--     nullable column on the new table and nothing on "AdminUser" itself.
--   * The whole file is therefore reversible with a single DROP of the nine new
--     tables and ten new enum types, leaving the previous database untouched.

-- CreateEnum
CREATE TYPE "OutreachCampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OutreachCampaignMode" AS ENUM ('MANUAL', 'SEMI_AUTOMATIC', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "OutreachProspectStatus" AS ENUM ('DISCOVERED', 'ENRICHING', 'QUALIFIED', 'DISQUALIFIED', 'READY_FOR_REVIEW', 'APPROVED', 'OUTREACH_ACTIVE', 'REPLIED', 'INTERESTED', 'MEETING_BOOKED', 'PROPOSAL', 'WON', 'LOST', 'UNSUBSCRIBED', 'BOUNCED', 'PAUSED');

-- CreateEnum
CREATE TYPE "OutreachMessageType" AS ENUM ('INITIAL', 'FOLLOW_UP_1', 'FOLLOW_UP_2', 'MANUAL', 'REPLY');

-- CreateEnum
CREATE TYPE "OutreachMessageStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'REPLIED', 'BOUNCED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OutreachEventType" AS ENUM ('DISCOVERED', 'ENRICHED', 'QUALIFIED', 'DISQUALIFIED', 'EMAIL_GENERATED', 'EMAIL_APPROVED', 'EMAIL_SENT', 'EMAIL_DELIVERED', 'EMAIL_OPENED', 'EMAIL_CLICKED', 'EMAIL_REPLIED', 'FOLLOW_UP_SCHEDULED', 'FOLLOW_UP_SENT', 'MEETING_BOOKED', 'UNSUBSCRIBED', 'BOUNCED', 'MANUAL_NOTE', 'STATUS_CHANGED');

-- CreateEnum
CREATE TYPE "OutreachJobType" AS ENUM ('DISCOVER', 'ENRICH', 'ASSESS', 'GENERATE_EMAIL', 'SEND_EMAIL', 'SCHEDULE_FOLLOWUP', 'PROCESS_REPLY', 'REFRESH_PLACE');

-- CreateEnum
CREATE TYPE "OutreachJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OutreachSuppressionReason" AS ENUM ('UNSUBSCRIBED', 'BOUNCED', 'SPAM_COMPLAINT', 'MANUAL', 'DO_NOT_CONTACT');

-- CreateEnum
CREATE TYPE "OutreachMeetingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "OutreachCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "OutreachCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "mode" "OutreachCampaignMode" NOT NULL DEFAULT 'SEMI_AUTOMATIC',
    "country" TEXT NOT NULL,
    "regions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "businessTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludedIndustries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludedKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dailyDiscoveryLimit" INTEGER NOT NULL DEFAULT 25,
    "dailySendLimit" INTEGER NOT NULL DEFAULT 10,
    "minOpportunityScore" INTEGER NOT NULL DEFAULT 40,
    "dailyAiAssessLimit" INTEGER NOT NULL DEFAULT 25,
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "followUpEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxFollowUps" INTEGER NOT NULL DEFAULT 2,
    "sendingWindowStart" TEXT NOT NULL DEFAULT '09:00',
    "sendingWindowEnd" TEXT NOT NULL DEFAULT '17:00',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Douala',
    "complianceBasis" TEXT,
    "complianceNote" TEXT,
    "unsubscribeNote" TEXT,
    "senderNameOverride" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachProspect" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "status" "OutreachProspectStatus" NOT NULL DEFAULT 'DISCOVERED',
    "businessName" TEXT NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "industry" TEXT,
    "websiteUrl" TEXT,
    "contactPageUrl" TEXT,
    "publicEmail" TEXT,
    "publicPhone" TEXT,
    "contactName" TEXT,
    "contactRole" TEXT,
    "googlePlaceId" TEXT,
    "googleMapsUri" TEXT,
    "source" TEXT NOT NULL DEFAULT 'google_places',
    "websiteSnapshot" JSONB,
    "digitalAssessment" JSONB,
    "opportunityScore" INTEGER NOT NULL DEFAULT 0,
    "recommendedServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiSummary" TEXT,
    "aiReasoning" TEXT,
    "automationStoppedReason" TEXT,
    "emailsSentCount" INTEGER NOT NULL DEFAULT 0,
    "lastErrorMessage" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastEnrichedAt" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "nextActionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachProspect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachAssessment" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "sourceData" JSONB NOT NULL,
    "opportunityScore" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "findings" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "summary" TEXT,
    "primaryService" TEXT,
    "doNotContactReason" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachMessage" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "type" "OutreachMessageType" NOT NULL,
    "status" "OutreachMessageStatus" NOT NULL DEFAULT 'DRAFT',
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiPromptVersion" TEXT,
    "idempotencyKey" TEXT,
    "providerMessageId" TEXT,
    "threadId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachEvent" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "prospectId" TEXT,
    "messageId" TEXT,
    "type" "OutreachEventType" NOT NULL,
    "summary" TEXT,
    "metadata" JSONB,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachJob" (
    "id" TEXT NOT NULL,
    "type" "OutreachJobType" NOT NULL,
    "status" "OutreachJobStatus" NOT NULL DEFAULT 'PENDING',
    "campaignId" TEXT,
    "prospectId" TEXT,
    "dedupeKey" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "lockToken" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "errorMessage" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachSuppression" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "domain" TEXT,
    "reason" "OutreachSuppressionReason" NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'system',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachSuppression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachMeeting" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "status" "OutreachMeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "bookingUrl" TEXT,
    "meetingUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachDailyStats" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "discovered" INTEGER NOT NULL DEFAULT 0,
    "disqualified" INTEGER NOT NULL DEFAULT 0,
    "qualified" INTEGER NOT NULL DEFAULT 0,
    "approved" INTEGER NOT NULL DEFAULT 0,
    "emailsSent" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "opened" INTEGER NOT NULL DEFAULT 0,
    "clicked" INTEGER NOT NULL DEFAULT 0,
    "replies" INTEGER NOT NULL DEFAULT 0,
    "interested" INTEGER NOT NULL DEFAULT 0,
    "meetings" INTEGER NOT NULL DEFAULT 0,
    "proposals" INTEGER NOT NULL DEFAULT 0,
    "won" INTEGER NOT NULL DEFAULT 0,
    "lost" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachDailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutreachCampaign_status_idx" ON "OutreachCampaign"("status");

-- CreateIndex
CREATE INDEX "OutreachCampaign_status_updatedAt_idx" ON "OutreachCampaign"("status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "OutreachProspect_googlePlaceId_idx" ON "OutreachProspect"("googlePlaceId");

-- CreateIndex
CREATE INDEX "OutreachProspect_campaignId_status_idx" ON "OutreachProspect"("campaignId", "status");

-- CreateIndex
CREATE INDEX "OutreachProspect_campaignId_discoveredAt_idx" ON "OutreachProspect"("campaignId", "discoveredAt" DESC);

-- CreateIndex
CREATE INDEX "OutreachProspect_status_nextActionAt_idx" ON "OutreachProspect"("status", "nextActionAt");

-- CreateIndex
CREATE INDEX "OutreachProspect_publicEmail_idx" ON "OutreachProspect"("publicEmail");

-- CreateIndex
CREATE INDEX "OutreachProspect_opportunityScore_idx" ON "OutreachProspect"("opportunityScore" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "OutreachProspect_campaignId_googlePlaceId_key" ON "OutreachProspect"("campaignId", "googlePlaceId");

-- CreateIndex
CREATE INDEX "OutreachAssessment_prospectId_createdAt_idx" ON "OutreachAssessment"("prospectId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "OutreachAssessment_promptVersion_idx" ON "OutreachAssessment"("promptVersion");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachMessage_idempotencyKey_key" ON "OutreachMessage"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachMessage_providerMessageId_key" ON "OutreachMessage"("providerMessageId");

-- CreateIndex
CREATE INDEX "OutreachMessage_prospectId_createdAt_idx" ON "OutreachMessage"("prospectId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "OutreachMessage_status_scheduledAt_idx" ON "OutreachMessage"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "OutreachMessage_campaignId_status_idx" ON "OutreachMessage"("campaignId", "status");

-- CreateIndex
CREATE INDEX "OutreachMessage_type_status_idx" ON "OutreachMessage"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachMessage_prospectId_type_key" ON "OutreachMessage"("prospectId", "type");

-- CreateIndex
CREATE INDEX "OutreachEvent_prospectId_createdAt_idx" ON "OutreachEvent"("prospectId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "OutreachEvent_campaignId_createdAt_idx" ON "OutreachEvent"("campaignId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "OutreachEvent_type_createdAt_idx" ON "OutreachEvent"("type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "OutreachEvent_createdAt_idx" ON "OutreachEvent"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "OutreachJob_dedupeKey_key" ON "OutreachJob"("dedupeKey");

-- CreateIndex
CREATE INDEX "OutreachJob_status_scheduledFor_idx" ON "OutreachJob"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "OutreachJob_type_status_scheduledFor_idx" ON "OutreachJob"("type", "status", "scheduledFor");

-- CreateIndex
CREATE INDEX "OutreachJob_campaignId_status_idx" ON "OutreachJob"("campaignId", "status");

-- CreateIndex
CREATE INDEX "OutreachJob_prospectId_type_idx" ON "OutreachJob"("prospectId", "type");

-- CreateIndex
CREATE INDEX "OutreachSuppression_reason_idx" ON "OutreachSuppression"("reason");

-- CreateIndex
CREATE INDEX "OutreachSuppression_createdAt_idx" ON "OutreachSuppression"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "OutreachSuppression_email_key" ON "OutreachSuppression"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachSuppression_domain_key" ON "OutreachSuppression"("domain");

-- CreateIndex
CREATE INDEX "OutreachMeeting_prospectId_scheduledAt_idx" ON "OutreachMeeting"("prospectId", "scheduledAt" DESC);

-- CreateIndex
CREATE INDEX "OutreachMeeting_status_scheduledAt_idx" ON "OutreachMeeting"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "OutreachDailyStats_date_idx" ON "OutreachDailyStats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachDailyStats_campaignId_date_key" ON "OutreachDailyStats"("campaignId", "date");

-- AddForeignKey
ALTER TABLE "OutreachProspect" ADD CONSTRAINT "OutreachProspect_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "OutreachCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachAssessment" ADD CONSTRAINT "OutreachAssessment_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "OutreachProspect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "OutreachProspect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "OutreachCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachEvent" ADD CONSTRAINT "OutreachEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "OutreachCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachEvent" ADD CONSTRAINT "OutreachEvent_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "OutreachProspect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachEvent" ADD CONSTRAINT "OutreachEvent_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "OutreachMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachJob" ADD CONSTRAINT "OutreachJob_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "OutreachCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachJob" ADD CONSTRAINT "OutreachJob_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "OutreachProspect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachMeeting" ADD CONSTRAINT "OutreachMeeting_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "OutreachProspect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachDailyStats" ADD CONSTRAINT "OutreachDailyStats_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "OutreachCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
