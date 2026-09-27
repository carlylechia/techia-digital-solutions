-- Discovery provider resilience — strictly additive migration.
--
-- Adds the provider abstraction (Google Places primary, OpenStreetMap fallback)
-- without altering a single existing row, column or constraint.
--
-- Safety notes for production rollout:
--   * No DROP, no ALTER COLUMN, no DELETE, no RENAME.
--   * Every ALTER TABLE is ADD COLUMN, so existing rows keep working unchanged
--     and no backfill is required.
--   * "OutreachProspect"."discoveryProvider" defaults to GOOGLE_PLACES, which is
--     exactly the truth for every prospect discovered before this change.
--   * The new UNIQUE index on (campaignId, discoveryProvider, providerPlaceId)
--     permits many NULL providerPlaceId values in PostgreSQL, so it cannot
--     conflict with pre-existing rows.
--   * The two ALTER TYPE ... ADD VALUE statements only append enum values; no
--     existing value is altered or removed, and neither new value is used by any
--     statement in this same transaction.

-- CreateEnum
CREATE TYPE "OutreachDiscoveryProvider" AS ENUM ('GOOGLE_PLACES', 'OPENSTREETMAP');

-- CreateEnum
CREATE TYPE "OutreachDiscoveryProviderMode" AS ENUM ('AUTO', 'GOOGLE_PLACES', 'OPENSTREETMAP');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OutreachEventType" ADD VALUE 'DISCOVERY_PROVIDER_FALLBACK';
ALTER TYPE "OutreachEventType" ADD VALUE 'DISCOVERY_PROVIDER_COOLDOWN';

-- AlterTable
ALTER TABLE "OutreachCampaign" ADD COLUMN     "discoveryProviderMode" "OutreachDiscoveryProviderMode" NOT NULL DEFAULT 'AUTO';

-- AlterTable
ALTER TABLE "OutreachProspect" ADD COLUMN     "discoveryProvider" "OutreachDiscoveryProvider" NOT NULL DEFAULT 'GOOGLE_PLACES',
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "possibleDuplicateOfId" TEXT,
ADD COLUMN     "providerPlaceId" TEXT,
ADD COLUMN     "sourceUrl" TEXT;

-- AlterTable
ALTER TABLE "OutreachDailyStats" ADD COLUMN     "discoveredGoogle" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discoveredOsm" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discoveryFallbacks" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "OutreachProviderHealth" (
    "provider" "OutreachDiscoveryProvider" NOT NULL,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "cooldownUntil" TIMESTAMP(3),
    "lastFailureCategory" TEXT,
    "lastFailureMessage" TEXT,
    "lastSuccessAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachProviderHealth_pkey" PRIMARY KEY ("provider")
);

-- CreateIndex
CREATE INDEX "OutreachProviderHealth_cooldownUntil_idx" ON "OutreachProviderHealth"("cooldownUntil");

-- CreateIndex
CREATE INDEX "OutreachProspect_discoveryProvider_idx" ON "OutreachProspect"("discoveryProvider");

-- CreateIndex
CREATE INDEX "OutreachProspect_providerPlaceId_idx" ON "OutreachProspect"("providerPlaceId");

-- CreateIndex
CREATE INDEX "OutreachProspect_possibleDuplicateOfId_idx" ON "OutreachProspect"("possibleDuplicateOfId");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachProspect_campaignId_discoveryProvider_providerPlace_key" ON "OutreachProspect"("campaignId", "discoveryProvider", "providerPlaceId");
