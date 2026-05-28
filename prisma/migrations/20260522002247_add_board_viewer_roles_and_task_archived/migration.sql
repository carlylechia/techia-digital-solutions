-- AlterTable
ALTER TABLE "ProcessBoard" ADD COLUMN     "viewerRoles" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "ProcessTask" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ProcessTask_archived_idx" ON "ProcessTask"("archived");
