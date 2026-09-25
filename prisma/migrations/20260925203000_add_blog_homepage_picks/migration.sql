-- Let an editor choose which published articles appear in the homepage
-- featured insights section, and in which order. Kept separate from schema DDL
-- so the editorial migration stays reversible independently of content data.
ALTER TABLE "BlogPost"
ADD COLUMN "showOnHomepage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "homepageOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "BlogPost_locale_showOnHomepage_homepageOrder_idx"
ON "BlogPost"("locale", "showOnHomepage", "homepageOrder");
