-- Upgrade the existing lightweight newsletter table into the production-ready
-- newsletter subscriber model while preserving current subscriber rows.
ALTER TABLE "NewsletterSubscriber" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "NewsletterSubscriber" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "NewsletterSubscriber" ADD COLUMN IF NOT EXISTS "interest" TEXT NOT NULL DEFAULT 'general';
ALTER TABLE "NewsletterSubscriber" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'footer';
ALTER TABLE "NewsletterSubscriber" ADD COLUMN IF NOT EXISTS "businessName" TEXT;
ALTER TABLE "NewsletterSubscriber" ADD COLUMN IF NOT EXISTS "consentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "NewsletterSubscriber" ADD COLUMN IF NOT EXISTS "subscribed" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NewsletterSubscriber" ADD COLUMN IF NOT EXISTS "resendContactId" TEXT;
ALTER TABLE "NewsletterSubscriber" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'NewsletterSubscriber'
      AND column_name = 'locale'
  ) THEN
    EXECUTE 'UPDATE "NewsletterSubscriber" SET "language" = COALESCE("locale"::TEXT, "language", ''en'')';
  END IF;
END $$;

ALTER TABLE "NewsletterSubscriber" DROP COLUMN IF EXISTS "locale";

CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_language_idx" ON "NewsletterSubscriber"("language");
CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_source_idx" ON "NewsletterSubscriber"("source");
CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_subscribed_idx" ON "NewsletterSubscriber"("subscribed");
CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_createdAt_idx" ON "NewsletterSubscriber"("createdAt");

CREATE TABLE IF NOT EXISTS "NewsletterBroadcast" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "previewText" TEXT,
  "segment" TEXT NOT NULL,
  "scheduledDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "resendId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NewsletterBroadcast_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NewsletterBroadcast_segment_idx" ON "NewsletterBroadcast"("segment");
CREATE INDEX IF NOT EXISTS "NewsletterBroadcast_status_idx" ON "NewsletterBroadcast"("status");
CREATE INDEX IF NOT EXISTS "NewsletterBroadcast_scheduledDate_idx" ON "NewsletterBroadcast"("scheduledDate");
