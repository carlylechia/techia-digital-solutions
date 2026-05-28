-- Extend inbound requests so the admin workspace can triage every public flow.
ALTER TABLE "ContactMessage"
ADD COLUMN "locale" "Locale",
ADD COLUMN "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN "notes" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "DemoRequest"
ADD COLUMN "locale" "Locale",
ADD COLUMN "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN "notes" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "ContactMessage_status_idx" ON "ContactMessage"("status");
CREATE INDEX "DemoRequest_status_idx" ON "DemoRequest"("status");
