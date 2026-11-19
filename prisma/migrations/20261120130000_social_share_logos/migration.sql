-- CreateTable
CREATE TABLE "SocialShareLogo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialShareLogo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialShareLogo_publicId_key" ON "SocialShareLogo"("publicId");

-- CreateIndex
CREATE INDEX "SocialShareLogo_createdById_idx" ON "SocialShareLogo"("createdById");

-- CreateIndex
CREATE INDEX "SocialShareLogo_isActive_createdAt_idx" ON "SocialShareLogo"("isActive", "createdAt");

-- AddForeignKey
ALTER TABLE "SocialShareLogo" ADD CONSTRAINT "SocialShareLogo_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
