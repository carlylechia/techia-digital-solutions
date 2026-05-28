-- AlterTable
ALTER TABLE "ProjectInquiry" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "convertedToTaskId" TEXT,
ADD COLUMN     "internalNotes" TEXT;

-- CreateIndex
CREATE INDEX "ProjectInquiry_clientId_idx" ON "ProjectInquiry"("clientId");

-- AddForeignKey
ALTER TABLE "ProjectInquiry" ADD CONSTRAINT "ProjectInquiry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
