-- Allow public showcase projects to be featured on the homepage separately
ALTER TABLE "ClientProject"
ADD COLUMN "showOnHomepage" BOOLEAN NOT NULL DEFAULT false;

UPDATE "ClientProject"
SET "showOnHomepage" = true
WHERE "showInPortfolio" = true;

CREATE INDEX "ClientProject_showOnHomepage_publicOrder_idx"
ON "ClientProject"("showOnHomepage", "publicOrder");
