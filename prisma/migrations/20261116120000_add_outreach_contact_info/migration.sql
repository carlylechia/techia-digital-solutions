-- Outreach contact availability — strictly additive migration.

ALTER TABLE "OutreachProspect" ADD COLUMN "hasContactInfo" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "OutreachProspect_hasContactInfo_idx" ON "OutreachProspect"("hasContactInfo");
