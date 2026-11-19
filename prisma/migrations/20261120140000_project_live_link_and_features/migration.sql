-- AlterTable
ALTER TABLE "ClientProject" ADD COLUMN "publicFeatures" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ClientProject" ADD COLUMN "publicLiveUrl" TEXT;
