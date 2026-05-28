-- AlterTable
ALTER TABLE "ContentPage" ADD COLUMN     "sections" JSONB;

-- CreateTable
CREATE TABLE "NavMenuItem" (
    "id" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelFr" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "openNewTab" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavMenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NavMenuItem_visible_position_idx" ON "NavMenuItem"("visible", "position");
