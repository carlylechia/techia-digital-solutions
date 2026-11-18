-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "SocialGraphicFormat" AS ENUM ('SQUARE', 'VERTICAL');

-- CreateEnum
CREATE TYPE "SocialPublishStatus" AS ENUM ('NOT_STARTED', 'READY', 'PUBLISHED');

-- CreateTable
CREATE TABLE "SocialShareKit" (
    "id" TEXT NOT NULL,
    "postId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialShareKit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialShareVariant" (
    "id" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "generatedCaption" TEXT NOT NULL,
    "editedCaption" TEXT,
    "shortCaption" TEXT,
    "statusCaption" TEXT,
    "directCaption" TEXT,
    "refinementNote" TEXT,
    "publishStatus" "SocialPublishStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialShareVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialShareGraphic" (
    "id" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "format" "SocialGraphicFormat" NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "bytes" INTEGER NOT NULL,
    "formatMime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialShareGraphic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialShareKit_postId_key" ON "SocialShareKit"("postId");
CREATE INDEX "SocialShareKit_createdById_idx" ON "SocialShareKit"("createdById");

CREATE UNIQUE INDEX "SocialShareVariant_kitId_platform_key" ON "SocialShareVariant"("kitId", "platform");
CREATE INDEX "SocialShareVariant_kitId_idx" ON "SocialShareVariant"("kitId");
CREATE INDEX "SocialShareVariant_publishedById_idx" ON "SocialShareVariant"("publishedById");

CREATE UNIQUE INDEX "SocialShareGraphic_publicId_key" ON "SocialShareGraphic"("publicId");
CREATE UNIQUE INDEX "SocialShareGraphic_kitId_format_key" ON "SocialShareGraphic"("kitId", "format");
CREATE INDEX "SocialShareGraphic_kitId_idx" ON "SocialShareGraphic"("kitId");

-- AddForeignKey
ALTER TABLE "SocialShareKit" ADD CONSTRAINT "SocialShareKit_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SocialShareKit" ADD CONSTRAINT "SocialShareKit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SocialShareVariant" ADD CONSTRAINT "SocialShareVariant_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "SocialShareKit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialShareVariant" ADD CONSTRAINT "SocialShareVariant_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SocialShareGraphic" ADD CONSTRAINT "SocialShareGraphic_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "SocialShareKit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
