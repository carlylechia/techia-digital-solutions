CREATE TABLE "HomepageMetric" (
    "id" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelFr" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT '',
    "suffix" TEXT NOT NULL DEFAULT '',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomepageMetric_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HomepageMetric_visible_displayOrder_idx"
ON "HomepageMetric"("visible", "displayOrder");
