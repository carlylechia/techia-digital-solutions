-- Promote the admin area into a database-backed management system.
CREATE TYPE "AdminStatus" AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');
CREATE TYPE "ClientStatus" AS ENUM ('PROSPECT', 'ONBOARDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "ClientPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNED', 'ACTIVE', 'REVIEW', 'ON_HOLD', 'DELIVERED', 'ARCHIVED');
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ProcessStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

ALTER TABLE "AdminUser"
ADD COLUMN "roleId" TEXT,
ADD COLUMN "status" "AdminStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "lastLoginAt" TIMESTAMP(3),
ADD COLUMN "createdById" TEXT;

CREATE TABLE "AdminRole" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "level" INTEGER NOT NULL DEFAULT 50,
  "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Client" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "industry" TEXT,
  "status" "ClientStatus" NOT NULL DEFAULT 'PROSPECT',
  "priority" "ClientPriority" NOT NULL DEFAULT 'MEDIUM',
  "contactName" TEXT,
  "contactRole" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "website" TEXT,
  "country" TEXT,
  "city" TEXT,
  "estimatedValue" INTEGER,
  "source" TEXT NOT NULL DEFAULT 'admin',
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "notes" TEXT,
  "ownerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientContact" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientContact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientProject" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "ownerId" TEXT,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNED',
  "priority" "ClientPriority" NOT NULL DEFAULT 'MEDIUM',
  "description" TEXT,
  "budget" INTEGER,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentPage" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'page',
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "publishedAt" TIMESTAMP(3),
  "authorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentPage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentTranslation" (
  "id" TEXT NOT NULL,
  "pageId" TEXT NOT NULL,
  "locale" "Locale" NOT NULL,
  "title" TEXT NOT NULL,
  "excerpt" TEXT,
  "body" TEXT NOT NULL,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProcessBoard" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "ProcessStatus" NOT NULL DEFAULT 'ACTIVE',
  "ownerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProcessBoard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProcessColumn" (
  "id" TEXT NOT NULL,
  "boardId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "color" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProcessColumn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProcessTask" (
  "id" TEXT NOT NULL,
  "boardId" TEXT NOT NULL,
  "columnId" TEXT NOT NULL,
  "clientId" TEXT,
  "projectId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" "ClientPriority" NOT NULL DEFAULT 'MEDIUM',
  "position" INTEGER NOT NULL DEFAULT 0,
  "dueDate" TIMESTAMP(3),
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "assigneeId" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProcessTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "ip" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminRole_name_key" ON "AdminRole"("name");
CREATE INDEX "AdminRole_level_idx" ON "AdminRole"("level");
CREATE INDEX "AdminUser_roleId_idx" ON "AdminUser"("roleId");
CREATE INDEX "AdminUser_status_idx" ON "AdminUser"("status");

CREATE UNIQUE INDEX "Client_slug_key" ON "Client"("slug");
CREATE INDEX "Client_status_priority_idx" ON "Client"("status", "priority");
CREATE INDEX "Client_ownerId_idx" ON "Client"("ownerId");
CREATE INDEX "Client_createdAt_idx" ON "Client"("createdAt");

CREATE INDEX "ClientContact_clientId_idx" ON "ClientContact"("clientId");
CREATE INDEX "ClientContact_email_idx" ON "ClientContact"("email");

CREATE UNIQUE INDEX "ClientProject_clientId_slug_key" ON "ClientProject"("clientId", "slug");
CREATE INDEX "ClientProject_status_priority_idx" ON "ClientProject"("status", "priority");
CREATE INDEX "ClientProject_ownerId_idx" ON "ClientProject"("ownerId");
CREATE INDEX "ClientProject_dueDate_idx" ON "ClientProject"("dueDate");

CREATE UNIQUE INDEX "ContentPage_slug_key" ON "ContentPage"("slug");
CREATE INDEX "ContentPage_status_idx" ON "ContentPage"("status");
CREATE INDEX "ContentPage_type_idx" ON "ContentPage"("type");
CREATE UNIQUE INDEX "ContentTranslation_pageId_locale_key" ON "ContentTranslation"("pageId", "locale");
CREATE INDEX "ContentTranslation_locale_idx" ON "ContentTranslation"("locale");

CREATE INDEX "ProcessBoard_status_idx" ON "ProcessBoard"("status");
CREATE INDEX "ProcessBoard_ownerId_idx" ON "ProcessBoard"("ownerId");
CREATE UNIQUE INDEX "ProcessColumn_boardId_key_key" ON "ProcessColumn"("boardId", "key");
CREATE INDEX "ProcessColumn_boardId_position_idx" ON "ProcessColumn"("boardId", "position");
CREATE INDEX "ProcessTask_boardId_columnId_position_idx" ON "ProcessTask"("boardId", "columnId", "position");
CREATE INDEX "ProcessTask_clientId_idx" ON "ProcessTask"("clientId");
CREATE INDEX "ProcessTask_projectId_idx" ON "ProcessTask"("projectId");
CREATE INDEX "ProcessTask_assigneeId_idx" ON "ProcessTask"("assigneeId");
CREATE INDEX "ProcessTask_dueDate_idx" ON "ProcessTask"("dueDate");

CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AdminRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminRole" ADD CONSTRAINT "AdminRole_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClientContact" ADD CONSTRAINT "ClientContact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientProject" ADD CONSTRAINT "ClientProject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientProject" ADD CONSTRAINT "ClientProject_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentPage" ADD CONSTRAINT "ContentPage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentTranslation" ADD CONSTRAINT "ContentTranslation_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "ContentPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcessBoard" ADD CONSTRAINT "ProcessBoard_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProcessColumn" ADD CONSTRAINT "ProcessColumn_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ProcessBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcessTask" ADD CONSTRAINT "ProcessTask_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ProcessBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcessTask" ADD CONSTRAINT "ProcessTask_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "ProcessColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcessTask" ADD CONSTRAINT "ProcessTask_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProcessTask" ADD CONSTRAINT "ProcessTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProcessTask" ADD CONSTRAINT "ProcessTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProcessTask" ADD CONSTRAINT "ProcessTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
