-- Additive: admin-controlled visibility switches for the payment providers.
-- Environment variables keep holding the API keys; these toggles let
-- /admin/academy hide a provider from the storefront and checkout (for example
-- while its dashboard is still being configured) without touching env vars.
-- Seeded with a single "singleton" row so reads always find it.
CREATE TABLE "AcademyPaymentSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "chariowEnabled" BOOLEAN NOT NULL DEFAULT true,
    "monerooEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyPaymentSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AcademyPaymentSettings" ("id") VALUES ('singleton');
