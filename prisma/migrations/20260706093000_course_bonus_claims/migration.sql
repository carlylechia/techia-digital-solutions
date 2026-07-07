CREATE TYPE "CourseBonusClaimStatus" AS ENUM (
  'SUBMITTED',
  'UNDER_REVIEW',
  'VERIFIED',
  'FULFILLED',
  'REJECTED'
);

CREATE TYPE "BonusDeliveryChannel" AS ENUM ('EMAIL', 'WHATSAPP');

CREATE TYPE "BonusDeliveryPreference" AS ENUM ('EMAIL', 'WHATSAPP', 'BOTH');

CREATE TABLE "CourseBonusClaim" (
  "id" TEXT NOT NULL,
  "locale" "Locale",
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "whatsapp" TEXT,
  "coursePackId" TEXT NOT NULL,
  "coursePackTitle" TEXT NOT NULL,
  "orderReference" TEXT NOT NULL,
  "purchaseDate" TIMESTAMP(3),
  "requestedBonusIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "proofNotes" TEXT,
  "proofUrl" TEXT,
  "proofPublicId" TEXT,
  "proofFileName" TEXT,
  "proofFileType" TEXT,
  "proofFileSize" INTEGER,
  "preferredDelivery" "BonusDeliveryPreference" NOT NULL DEFAULT 'EMAIL',
  "status" "CourseBonusClaimStatus" NOT NULL DEFAULT 'SUBMITTED',
  "adminNotes" TEXT,
  "sourcePage" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "verifiedById" TEXT,
  "fulfilledAt" TIMESTAMP(3),
  "fulfilledById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourseBonusClaim_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourseBonusClaimDelivery" (
  "id" TEXT NOT NULL,
  "claimId" TEXT NOT NULL,
  "channel" "BonusDeliveryChannel" NOT NULL,
  "sentTo" TEXT NOT NULL,
  "bonusIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "subject" TEXT,
  "message" TEXT,
  "sentById" TEXT,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CourseBonusClaimDelivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CourseBonusClaim_status_createdAt_idx" ON "CourseBonusClaim"("status", "createdAt");
CREATE INDEX "CourseBonusClaim_email_idx" ON "CourseBonusClaim"("email");
CREATE INDEX "CourseBonusClaim_coursePackId_idx" ON "CourseBonusClaim"("coursePackId");
CREATE INDEX "CourseBonusClaim_verifiedById_idx" ON "CourseBonusClaim"("verifiedById");
CREATE INDEX "CourseBonusClaim_fulfilledById_idx" ON "CourseBonusClaim"("fulfilledById");
CREATE INDEX "CourseBonusClaimDelivery_claimId_sentAt_idx" ON "CourseBonusClaimDelivery"("claimId", "sentAt");
CREATE INDEX "CourseBonusClaimDelivery_sentById_idx" ON "CourseBonusClaimDelivery"("sentById");

ALTER TABLE "CourseBonusClaim"
ADD CONSTRAINT "CourseBonusClaim_verifiedById_fkey"
FOREIGN KEY ("verifiedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourseBonusClaim"
ADD CONSTRAINT "CourseBonusClaim_fulfilledById_fkey"
FOREIGN KEY ("fulfilledById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourseBonusClaimDelivery"
ADD CONSTRAINT "CourseBonusClaimDelivery_claimId_fkey"
FOREIGN KEY ("claimId") REFERENCES "CourseBonusClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseBonusClaimDelivery"
ADD CONSTRAINT "CourseBonusClaimDelivery_sentById_fkey"
FOREIGN KEY ("sentById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
