CREATE TABLE "HomepageFaq" (
    "id" TEXT NOT NULL,
    "questionEn" TEXT NOT NULL,
    "questionFr" TEXT NOT NULL,
    "answerEn" TEXT NOT NULL,
    "answerFr" TEXT NOT NULL,
    "showOnHomepage" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomepageFaq_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HomepageFaq_showOnHomepage_displayOrder_idx"
ON "HomepageFaq"("showOnHomepage", "displayOrder");
