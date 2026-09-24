-- Emergency rollback reference for the editorial blog expand migration.
-- This file is intentionally NOT a Prisma forward migration and is never run
-- automatically. Take a database backup and stop editorial writes first.
-- Review every statement against the restored production copy.

BEGIN;
SET LOCAL lock_timeout = '10s';

-- Refuse to collapse locale-scoped slugs if translations now share a slug.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "BlogPost" GROUP BY "slug" HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'Rollback refused: duplicate cross-language slugs exist';
  END IF;
END $$;

DROP TABLE IF EXISTS "BlogPostRevision";
DROP TABLE IF EXISTS "BlogReviewNote";
DROP TABLE IF EXISTS "BlogPostRelation";
DROP TABLE IF EXISTS "BlogPostTag";
DROP TABLE IF EXISTS "BlogSlugRedirect";
DROP TABLE IF EXISTS "BlogMedia";
DROP TABLE IF EXISTS "BlogTranslationGroup";
DROP TABLE IF EXISTS "BlogTag";
DROP TABLE IF EXISTS "BlogCategory";
DROP TABLE IF EXISTS "BlogAuthor";

ALTER TABLE "BlogPost"
  DROP CONSTRAINT IF EXISTS "BlogPost_publishedById_fkey",
  DROP CONSTRAINT IF EXISTS "BlogPost_lastEditedById_fkey",
  DROP CONSTRAINT IF EXISTS "BlogPost_createdById_fkey",
  DROP CONSTRAINT IF EXISTS "BlogPost_translationGroupId_fkey",
  DROP CONSTRAINT IF EXISTS "BlogPost_categoryId_fkey",
  DROP CONSTRAINT IF EXISTS "BlogPost_authorId_fkey";

DROP INDEX IF EXISTS "BlogPost_locale_slug_key";
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

ALTER TABLE "BlogPost"
  DROP COLUMN IF EXISTS "publishedById",
  DROP COLUMN IF EXISTS "lastEditedById",
  DROP COLUMN IF EXISTS "createdById",
  DROP COLUMN IF EXISTS "translationGroupId",
  DROP COLUMN IF EXISTS "categoryId",
  DROP COLUMN IF EXISTS "authorId",
  DROP COLUMN IF EXISTS "archivedAt",
  DROP COLUMN IF EXISTS "submittedAt",
  DROP COLUMN IF EXISTS "scheduledAt",
  DROP COLUMN IF EXISTS "publishedAt",
  DROP COLUMN IF EXISTS "version",
  DROP COLUMN IF EXISTS "readingTime",
  DROP COLUMN IF EXISTS "ctaLabel",
  DROP COLUMN IF EXISTS "ctaHref",
  DROP COLUMN IF EXISTS "ctaDescription",
  DROP COLUMN IF EXISTS "ctaTitle",
  DROP COLUMN IF EXISTS "ogImagePublicId",
  DROP COLUMN IF EXISTS "ogImageUrl",
  DROP COLUMN IF EXISTS "featuredImageAlt",
  DROP COLUMN IF EXISTS "featuredImagePublicId",
  DROP COLUMN IF EXISTS "featuredImageUrl",
  DROP COLUMN IF EXISTS "focusKeyword",
  DROP COLUMN IF EXISTS "canonicalUrl",
  DROP COLUMN IF EXISTS "seoDescription",
  DROP COLUMN IF EXISTS "seoTitle",
  DROP COLUMN IF EXISTS "nofollow",
  DROP COLUMN IF EXISTS "allowIndex",
  DROP COLUMN IF EXISTS "featured",
  DROP COLUMN IF EXISTS "status",
  DROP COLUMN IF EXISTS "contentText";

DROP TYPE IF EXISTS "BlogPostStatus";
-- Remove only the navigation row created by the companion migration after
-- confirming its deterministic ID is present:
-- DELETE FROM "NavMenuItem" WHERE "id" = 'blog_navigation_default';

COMMIT;
