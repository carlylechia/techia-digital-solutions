-- CreateEnum
CREATE TYPE "MetaConnectionStatus" AS ENUM ('CONNECTED', 'ATTENTION_REQUIRED', 'EXPIRED', 'REVOKED', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "MetaAccountPlatform" AS ENUM ('FACEBOOK_PAGE', 'INSTAGRAM');

-- CreateEnum
CREATE TYPE "MetaPermissionStatus" AS ENUM ('UNKNOWN', 'OK', 'MISSING');

-- CreateEnum
CREATE TYPE "MetaAccountHealth" AS ENUM ('UNKNOWN', 'HEALTHY', 'ATTENTION_REQUIRED', 'PERMISSION_MISSING', 'TOKEN_EXPIRED', 'TOKEN_REVOKED', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "MetaPublicationStatus" AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED', 'UNKNOWN_RESULT', 'REQUIRES_REAUTHORIZATION', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MetaPublicationAttemptOutcome" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'AMBIGUOUS');

-- CreateTable
CREATE TABLE "MetaConnection" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT,
    "metaUserId" TEXT NOT NULL,
    "metaUserName" TEXT,
    "encryptedUserToken" TEXT,
    "tokenEncryptionVersion" TEXT NOT NULL DEFAULT 'v1',
    "tokenExpiresAt" TIMESTAMP(3),
    "dataAccessExpiresAt" TIMESTAMP(3),
    "grantedPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "declinedPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "MetaConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
    "healthMessage" TEXT,
    "lastValidatedAt" TIMESTAMP(3),
    "lastHealthCheckAt" TIMESTAMP(3),
    "connectedById" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disconnectedAt" TIMESTAMP(3),

    CONSTRAINT "MetaConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaConnectedAccount" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "platform" "MetaAccountPlatform" NOT NULL,
    "platformAccountId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "username" TEXT,
    "pageId" TEXT,
    "pageName" TEXT,
    "linkedInstagramId" TEXT,
    "encryptedAccessToken" TEXT,
    "tokenEncryptionVersion" TEXT NOT NULL DEFAULT 'v1',
    "tasks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isEligible" BOOLEAN NOT NULL DEFAULT false,
    "ineligibilityReason" TEXT,
    "permissionStatus" "MetaPermissionStatus" NOT NULL DEFAULT 'UNKNOWN',
    "healthStatus" "MetaAccountHealth" NOT NULL DEFAULT 'UNKNOWN',
    "healthMessage" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastValidatedAt" TIMESTAMP(3),
    "lastHealthCheckAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disconnectedAt" TIMESTAMP(3),

    CONSTRAINT "MetaConnectedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaOAuthState" (
    "id" TEXT NOT NULL,
    "stateHash" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "returnLocale" TEXT NOT NULL DEFAULT 'en',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetaOAuthState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaPublication" (
    "id" TEXT NOT NULL,
    "variantId" TEXT,
    "graphicId" TEXT,
    "connectedAccountId" TEXT,
    "platform" "SocialPlatform" NOT NULL,
    "status" "MetaPublicationStatus" NOT NULL DEFAULT 'PENDING',
    "captionSnapshot" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "mediaFormat" TEXT,
    "articleId" TEXT,
    "articleUrl" TEXT,
    "destinationName" TEXT,
    "destinationAccountId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "activeKey" TEXT,
    "containerId" TEXT,
    "externalId" TEXT,
    "externalUrl" TEXT,
    "initiatedById" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "lastErrorMessage" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "reconciliationAttemptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaPublication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaPublicationAttempt" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "requestAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseAt" TIMESTAMP(3),
    "outcome" "MetaPublicationAttemptOutcome" NOT NULL DEFAULT 'PENDING',
    "httpStatus" INTEGER,
    "errorCode" TEXT,
    "errorSummary" TEXT,
    "metaRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetaPublicationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaPublishingSettings" (
    "id" TEXT NOT NULL,
    "publishingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaPublishingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MetaConnection_adminUserId_status_idx" ON "MetaConnection"("adminUserId", "status");

-- CreateIndex
CREATE INDEX "MetaConnection_status_lastHealthCheckAt_idx" ON "MetaConnection"("status", "lastHealthCheckAt");

-- CreateIndex
CREATE INDEX "MetaConnection_connectedById_idx" ON "MetaConnection"("connectedById");

-- CreateIndex
CREATE INDEX "MetaConnectedAccount_connectionId_platform_healthStatus_idx" ON "MetaConnectedAccount"("connectionId", "platform", "healthStatus");

-- CreateIndex
CREATE INDEX "MetaConnectedAccount_platform_platformAccountId_idx" ON "MetaConnectedAccount"("platform", "platformAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "MetaConnectedAccount_connectionId_platform_platformAccountI_key" ON "MetaConnectedAccount"("connectionId", "platform", "platformAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "MetaOAuthState_stateHash_key" ON "MetaOAuthState"("stateHash");

-- CreateIndex
CREATE INDEX "MetaOAuthState_adminUserId_expiresAt_idx" ON "MetaOAuthState"("adminUserId", "expiresAt");

-- CreateIndex
CREATE INDEX "MetaOAuthState_expiresAt_idx" ON "MetaOAuthState"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MetaPublication_idempotencyKey_key" ON "MetaPublication"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "MetaPublication_activeKey_key" ON "MetaPublication"("activeKey");

-- CreateIndex
CREATE INDEX "MetaPublication_articleId_createdAt_idx" ON "MetaPublication"("articleId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MetaPublication_connectedAccountId_createdAt_idx" ON "MetaPublication"("connectedAccountId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MetaPublication_status_updatedAt_idx" ON "MetaPublication"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "MetaPublication_platform_createdAt_idx" ON "MetaPublication"("platform", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MetaPublication_initiatedById_idx" ON "MetaPublication"("initiatedById");

-- CreateIndex
CREATE INDEX "MetaPublicationAttempt_publicationId_createdAt_idx" ON "MetaPublicationAttempt"("publicationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MetaPublicationAttempt_publicationId_attemptNumber_key" ON "MetaPublicationAttempt"("publicationId", "attemptNumber");

-- CreateIndex
CREATE INDEX "MetaPublishingSettings_updatedById_idx" ON "MetaPublishingSettings"("updatedById");

-- CreateIndex

-- AddForeignKey
ALTER TABLE "MetaConnection" ADD CONSTRAINT "MetaConnection_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaConnection" ADD CONSTRAINT "MetaConnection_connectedById_fkey" FOREIGN KEY ("connectedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaConnectedAccount" ADD CONSTRAINT "MetaConnectedAccount_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "MetaConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaOAuthState" ADD CONSTRAINT "MetaOAuthState_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaPublication" ADD CONSTRAINT "MetaPublication_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "SocialShareVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaPublication" ADD CONSTRAINT "MetaPublication_graphicId_fkey" FOREIGN KEY ("graphicId") REFERENCES "SocialShareGraphic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaPublication" ADD CONSTRAINT "MetaPublication_connectedAccountId_fkey" FOREIGN KEY ("connectedAccountId") REFERENCES "MetaConnectedAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaPublication" ADD CONSTRAINT "MetaPublication_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "BlogPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaPublication" ADD CONSTRAINT "MetaPublication_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaPublicationAttempt" ADD CONSTRAINT "MetaPublicationAttempt_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "MetaPublication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaPublishingSettings" ADD CONSTRAINT "MetaPublishingSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
