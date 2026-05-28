-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "ClientProject"
ADD COLUMN "showInPortfolio" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "showInFounder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "publicOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "publicSlug" TEXT,
ADD COLUMN "publicTitleEn" TEXT,
ADD COLUMN "publicTitleFr" TEXT,
ADD COLUMN "publicEyebrowEn" TEXT,
ADD COLUMN "publicEyebrowFr" TEXT,
ADD COLUMN "publicDescriptionEn" TEXT,
ADD COLUMN "publicDescriptionFr" TEXT,
ADD COLUMN "publicProblemEn" TEXT,
ADD COLUMN "publicProblemFr" TEXT,
ADD COLUMN "publicSolutionEn" TEXT,
ADD COLUMN "publicSolutionFr" TEXT,
ADD COLUMN "publicRoleEn" TEXT,
ADD COLUMN "publicRoleFr" TEXT,
ADD COLUMN "publicBusinessValueEn" TEXT,
ADD COLUMN "publicBusinessValueFr" TEXT,
ADD COLUMN "publicTechStack" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "CustomerFeedback" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "company" TEXT,
    "email" TEXT,
    "rating" INTEGER,
    "quote" TEXT NOT NULL,
    "locale" "Locale",
    "source" TEXT NOT NULL DEFAULT 'website',
    "status" "FeedbackStatus" NOT NULL DEFAULT 'PENDING',
    "showOnFounder" BOOLEAN NOT NULL DEFAULT false,
    "showOnPortfolio" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientProject_publicSlug_key" ON "ClientProject"("publicSlug");

-- CreateIndex
CREATE INDEX "ClientProject_showInPortfolio_publicOrder_idx" ON "ClientProject"("showInPortfolio", "publicOrder");

-- CreateIndex
CREATE INDEX "ClientProject_showInFounder_publicOrder_idx" ON "ClientProject"("showInFounder", "publicOrder");

-- CreateIndex
CREATE INDEX "CustomerFeedback_projectId_idx" ON "CustomerFeedback"("projectId");

-- CreateIndex
CREATE INDEX "CustomerFeedback_status_createdAt_idx" ON "CustomerFeedback"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerFeedback_showOnFounder_displayOrder_idx" ON "CustomerFeedback"("showOnFounder", "displayOrder");

-- CreateIndex
CREATE INDEX "CustomerFeedback_showOnPortfolio_displayOrder_idx" ON "CustomerFeedback"("showOnPortfolio", "displayOrder");

-- AddForeignKey
ALTER TABLE "CustomerFeedback" ADD CONSTRAINT "CustomerFeedback_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
