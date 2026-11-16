-- CRM prospect state — strictly additive migration.
--
-- Importing an outreach prospect into the CRM no longer creates a Client row.
-- These nullable columns let the CRM track that a prospect was added, and when
-- an administrator later graduates it into a real client.

ALTER TABLE "OutreachProspect" ADD COLUMN "crmImportedAt" TIMESTAMP(3),
ADD COLUMN "crmGraduatedAt" TIMESTAMP(3),
ADD COLUMN "crmGraduatedClientId" TEXT;

CREATE INDEX "OutreachProspect_crmImportedAt_idx" ON "OutreachProspect"("crmImportedAt");
