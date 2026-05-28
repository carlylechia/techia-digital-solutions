-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "visitorName" TEXT,
    "visitorEmail" TEXT,
    "visitorPhone" TEXT,
    "sourcePage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AILead" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "companyName" TEXT,
    "industry" TEXT,
    "serviceInterest" TEXT NOT NULL,
    "budgetRange" TEXT,
    "timeline" TEXT,
    "projectSummary" TEXT NOT NULL,
    "leadScore" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "source" TEXT NOT NULL DEFAULT 'AI_AGENT',
    "conversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AILead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIDemoRequest" (
    "id" TEXT NOT NULL,
    "aiLeadId" TEXT,
    "demoType" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "companyName" TEXT,
    "preferredDate" TIMESTAMP(3),
    "preferredContactMethod" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "conversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIDemoRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsage" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT,
    "sessionId" TEXT,
    "userId" TEXT,
    "conversationId" TEXT,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requestType" TEXT NOT NULL DEFAULT 'PUBLIC_AGENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAbuseEvent" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT,
    "sessionId" TEXT,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAbuseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIConversation_sessionId_idx" ON "AIConversation"("sessionId");

-- CreateIndex
CREATE INDEX "AIConversation_userId_idx" ON "AIConversation"("userId");

-- CreateIndex
CREATE INDEX "AIConversation_status_idx" ON "AIConversation"("status");

-- CreateIndex
CREATE INDEX "AIConversation_createdAt_idx" ON "AIConversation"("createdAt");

-- CreateIndex
CREATE INDEX "AIMessage_conversationId_idx" ON "AIMessage"("conversationId");

-- CreateIndex
CREATE INDEX "AIMessage_createdAt_idx" ON "AIMessage"("createdAt");

-- CreateIndex
CREATE INDEX "AILead_leadScore_idx" ON "AILead"("leadScore");

-- CreateIndex
CREATE INDEX "AILead_status_idx" ON "AILead"("status");

-- CreateIndex
CREATE INDEX "AILead_source_idx" ON "AILead"("source");

-- CreateIndex
CREATE INDEX "AILead_createdAt_idx" ON "AILead"("createdAt");

-- CreateIndex
CREATE INDEX "AILead_serviceInterest_idx" ON "AILead"("serviceInterest");

-- CreateIndex
CREATE INDEX "AIDemoRequest_status_idx" ON "AIDemoRequest"("status");

-- CreateIndex
CREATE INDEX "AIDemoRequest_demoType_idx" ON "AIDemoRequest"("demoType");

-- CreateIndex
CREATE INDEX "AIDemoRequest_createdAt_idx" ON "AIDemoRequest"("createdAt");

-- CreateIndex
CREATE INDEX "AIDemoRequest_aiLeadId_idx" ON "AIDemoRequest"("aiLeadId");

-- CreateIndex
CREATE INDEX "AIUsage_ipHash_idx" ON "AIUsage"("ipHash");

-- CreateIndex
CREATE INDEX "AIUsage_sessionId_idx" ON "AIUsage"("sessionId");

-- CreateIndex
CREATE INDEX "AIUsage_userId_idx" ON "AIUsage"("userId");

-- CreateIndex
CREATE INDEX "AIUsage_conversationId_idx" ON "AIUsage"("conversationId");

-- CreateIndex
CREATE INDEX "AIUsage_createdAt_idx" ON "AIUsage"("createdAt");

-- CreateIndex
CREATE INDEX "AIUsage_requestType_idx" ON "AIUsage"("requestType");

-- CreateIndex
CREATE INDEX "AIAbuseEvent_ipHash_idx" ON "AIAbuseEvent"("ipHash");

-- CreateIndex
CREATE INDEX "AIAbuseEvent_sessionId_idx" ON "AIAbuseEvent"("sessionId");

-- CreateIndex
CREATE INDEX "AIAbuseEvent_reason_idx" ON "AIAbuseEvent"("reason");

-- CreateIndex
CREATE INDEX "AIAbuseEvent_createdAt_idx" ON "AIAbuseEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsage" ADD CONSTRAINT "AIUsage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
