-- AlterTable DemoRequest: add extended demo lab fields
ALTER TABLE "DemoRequest" ADD COLUMN IF NOT EXISTS "demoTitle" TEXT;
ALTER TABLE "DemoRequest" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "DemoRequest" ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "DemoRequest" ADD COLUMN IF NOT EXISTS "businessType" TEXT;
ALTER TABLE "DemoRequest" ADD COLUMN IF NOT EXISTS "projectNeed" TEXT;
ALTER TABLE "DemoRequest" ADD COLUMN IF NOT EXISTS "budgetRange" TEXT;
ALTER TABLE "DemoRequest" ADD COLUMN IF NOT EXISTS "timeline" TEXT;
ALTER TABLE "DemoRequest" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'demo_lab';
