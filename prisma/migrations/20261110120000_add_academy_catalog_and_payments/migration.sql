-- CreateEnum
CREATE TYPE "AcademyCourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AcademyCourseLevel" AS ENUM ('BEGINNER', 'BEGINNER_TO_INTERMEDIATE', 'INTERMEDIATE');

-- CreateEnum
CREATE TYPE "AcademyOrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'REQUIRES_REVIEW');

-- CreateEnum
CREATE TYPE "AcademyOrderItemType" AS ENUM ('COURSE', 'PACK');

-- CreateEnum
CREATE TYPE "AcademyPaymentProvider" AS ENUM ('CHARIOW', 'MONEROO', 'MANUAL');

-- CreateEnum
CREATE TYPE "AcademyPaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED', 'REQUIRES_REVIEW');

-- CreateEnum
CREATE TYPE "AcademyWebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');

-- CreateTable
CREATE TABLE "AcademyCourseCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFr" TEXT,
    "descriptionEn" TEXT,
    "descriptionFr" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyCourseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyCourse" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT,
    "titleEn" TEXT NOT NULL,
    "titleFr" TEXT,
    "shortDescriptionEn" TEXT NOT NULL,
    "shortDescriptionFr" TEXT,
    "descriptionEn" TEXT NOT NULL,
    "descriptionFr" TEXT,
    "level" "AcademyCourseLevel" NOT NULL DEFAULT 'BEGINNER_TO_INTERMEDIATE',
    "status" "AcademyCourseStatus" NOT NULL DEFAULT 'DRAFT',
    "includedInFullPack" BOOLEAN NOT NULL DEFAULT true,
    "financialDisclaimerRequired" BOOLEAN NOT NULL DEFAULT false,
    "skillsEn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skillsFr" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priceMinor" INTEGER,
    "compareAtPriceMinor" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "chariowProductId" TEXT,
    "imageUrl" TEXT,
    "seoTitleEn" TEXT,
    "seoTitleFr" TEXT,
    "seoDescriptionEn" TEXT,
    "seoDescriptionFr" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyCourseLesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleFr" TEXT,
    "descriptionEn" TEXT NOT NULL,
    "descriptionFr" TEXT,
    "durationLabel" TEXT,
    "isPreview" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyCourseLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyCoursePack" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleFr" TEXT,
    "shortTitleEn" TEXT,
    "shortTitleFr" TEXT,
    "categoryLabelEn" TEXT NOT NULL,
    "categoryLabelFr" TEXT,
    "taglineEn" TEXT NOT NULL,
    "taglineFr" TEXT,
    "summaryEn" TEXT NOT NULL,
    "summaryFr" TEXT,
    "descriptionEn" TEXT NOT NULL,
    "descriptionFr" TEXT,
    "bestForEn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bestForFr" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "learningOutcomesEn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "learningOutcomesFr" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "whyChooseEn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "whyChooseFr" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "level" "AcademyCourseLevel" NOT NULL DEFAULT 'BEGINNER_TO_INTERMEDIATE',
    "recommended" BOOLEAN NOT NULL DEFAULT false,
    "badgeEn" TEXT,
    "badgeFr" TEXT,
    "status" "AcademyCourseStatus" NOT NULL DEFAULT 'DRAFT',
    "priceMinor" INTEGER,
    "compareAtPriceMinor" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "chariowProductId" TEXT,
    "imageUrl" TEXT,
    "seoTitleEn" TEXT,
    "seoTitleFr" TEXT,
    "seoDescriptionEn" TEXT,
    "seoDescriptionFr" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyCoursePack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyCoursePackItem" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyCoursePackItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyOrder" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "status" "AcademyOrderStatus" NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerCountry" TEXT,
    "locale" "Locale" NOT NULL DEFAULT 'en',
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "subtotalMinor" INTEGER NOT NULL,
    "discountMinor" INTEGER NOT NULL DEFAULT 0,
    "totalMinor" INTEGER NOT NULL,
    "provider" "AcademyPaymentProvider",
    "providerPaymentId" TEXT,
    "checkoutUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "AcademyOrderItemType" NOT NULL,
    "courseId" TEXT,
    "packId" TEXT,
    "titleSnapshot" TEXT NOT NULL,
    "slugSnapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceMinor" INTEGER NOT NULL,
    "totalMinor" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyPayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" "AcademyPaymentProvider" NOT NULL,
    "status" "AcademyPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "providerPaymentId" TEXT,
    "providerReference" TEXT,
    "checkoutUrl" TEXT,
    "idempotencyKey" TEXT,
    "failureReason" TEXT,
    "providerPayload" JSONB,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyOrderBonusGrant" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "bonusKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ELIGIBLE',
    "claimedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyOrderBonusGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" "AcademyPaymentProvider" NOT NULL,
    "eventType" TEXT NOT NULL,
    "deliveryId" TEXT,
    "status" "AcademyWebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "signatureValid" BOOLEAN NOT NULL DEFAULT true,
    "payload" JSONB NOT NULL,
    "error" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademyCourseCategory_slug_key" ON "AcademyCourseCategory"("slug");

-- CreateIndex
CREATE INDEX "AcademyCourseCategory_isActive_position_idx" ON "AcademyCourseCategory"("isActive", "position");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyCourse_slug_key" ON "AcademyCourse"("slug");

-- CreateIndex
CREATE INDEX "AcademyCourse_status_position_idx" ON "AcademyCourse"("status", "position");

-- CreateIndex
CREATE INDEX "AcademyCourse_categoryId_status_position_idx" ON "AcademyCourse"("categoryId", "status", "position");

-- CreateIndex
CREATE INDEX "AcademyCourseLesson_courseId_position_idx" ON "AcademyCourseLesson"("courseId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyCourseLesson_courseId_slug_key" ON "AcademyCourseLesson"("courseId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyCoursePack_slug_key" ON "AcademyCoursePack"("slug");

-- CreateIndex
CREATE INDEX "AcademyCoursePack_status_position_idx" ON "AcademyCoursePack"("status", "position");

-- CreateIndex
CREATE INDEX "AcademyCoursePack_recommended_status_position_idx" ON "AcademyCoursePack"("recommended", "status", "position");

-- CreateIndex
CREATE INDEX "AcademyCoursePackItem_packId_position_idx" ON "AcademyCoursePackItem"("packId", "position");

-- CreateIndex
CREATE INDEX "AcademyCoursePackItem_courseId_idx" ON "AcademyCoursePackItem"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyCoursePackItem_packId_courseId_key" ON "AcademyCoursePackItem"("packId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyOrder_reference_key" ON "AcademyOrder"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyOrder_idempotencyKey_key" ON "AcademyOrder"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AcademyOrder_status_createdAt_idx" ON "AcademyOrder"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AcademyOrder_customerEmail_idx" ON "AcademyOrder"("customerEmail");

-- CreateIndex
CREATE INDEX "AcademyOrder_provider_providerPaymentId_idx" ON "AcademyOrder"("provider", "providerPaymentId");

-- CreateIndex
CREATE INDEX "AcademyOrderItem_orderId_idx" ON "AcademyOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "AcademyOrderItem_courseId_idx" ON "AcademyOrderItem"("courseId");

-- CreateIndex
CREATE INDEX "AcademyOrderItem_packId_idx" ON "AcademyOrderItem"("packId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyPayment_idempotencyKey_key" ON "AcademyPayment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AcademyPayment_orderId_createdAt_idx" ON "AcademyPayment"("orderId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AcademyPayment_provider_providerPaymentId_idx" ON "AcademyPayment"("provider", "providerPaymentId");

-- CreateIndex
CREATE INDEX "AcademyPayment_status_createdAt_idx" ON "AcademyPayment"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AcademyOrderBonusGrant_bonusKey_idx" ON "AcademyOrderBonusGrant"("bonusKey");

-- CreateIndex
CREATE INDEX "AcademyOrderBonusGrant_status_idx" ON "AcademyOrderBonusGrant"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyOrderBonusGrant_orderId_bonusKey_key" ON "AcademyOrderBonusGrant"("orderId", "bonusKey");

-- CreateIndex
CREATE INDEX "AcademyWebhookEvent_provider_createdAt_idx" ON "AcademyWebhookEvent"("provider", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AcademyWebhookEvent_status_createdAt_idx" ON "AcademyWebhookEvent"("status", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "AcademyWebhookEvent_provider_deliveryId_key" ON "AcademyWebhookEvent"("provider", "deliveryId");

-- AddForeignKey
ALTER TABLE "AcademyCourse" ADD CONSTRAINT "AcademyCourse_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AcademyCourseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyCourseLesson" ADD CONSTRAINT "AcademyCourseLesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "AcademyCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyCoursePackItem" ADD CONSTRAINT "AcademyCoursePackItem_packId_fkey" FOREIGN KEY ("packId") REFERENCES "AcademyCoursePack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyCoursePackItem" ADD CONSTRAINT "AcademyCoursePackItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "AcademyCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyOrderItem" ADD CONSTRAINT "AcademyOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "AcademyOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyOrderItem" ADD CONSTRAINT "AcademyOrderItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "AcademyCourse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyOrderItem" ADD CONSTRAINT "AcademyOrderItem_packId_fkey" FOREIGN KEY ("packId") REFERENCES "AcademyCoursePack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyPayment" ADD CONSTRAINT "AcademyPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "AcademyOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyOrderBonusGrant" ADD CONSTRAINT "AcademyOrderBonusGrant_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "AcademyOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

