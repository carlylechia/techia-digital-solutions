-- Production-safe, additive editorial blog migration.
-- Existing BlogPost rows are preserved and receive DRAFT status for manual triage.
-- No existing table, column, or record is dropped or overwritten.
SET lock_timeout = '5s';

CREATE TYPE "BlogPostStatus" AS ENUM (
    'DRAFT',
    'IN_REVIEW',
    'CHANGES_REQUESTED',
    'SCHEDULED',
    'PUBLISHED',
    'ARCHIVED'
);

CREATE TABLE "BlogAuthor" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "jobTitle" TEXT,
    "imageUrl" TEXT,
    "imagePublicId" TEXT,
    "websiteUrl" TEXT,
    "linkedinUrl" TEXT,
    "xUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogAuthor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "locale" "Locale" NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogTranslationGroup" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogTranslationGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogMedia" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL DEFAULT 'image',
    "format" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER NOT NULL,
    "altText" TEXT NOT NULL DEFAULT '',
    "folder" TEXT NOT NULL DEFAULT 'techia/blog',
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogMedia_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "BlogPost"
    ADD COLUMN "contentText" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "status" "BlogPostStatus" NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "allowIndex" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "nofollow" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "seoTitle" TEXT,
    ADD COLUMN "seoDescription" TEXT,
    ADD COLUMN "focusKeyword" TEXT,
    ADD COLUMN "canonicalUrl" TEXT,
    ADD COLUMN "featuredImageUrl" TEXT,
    ADD COLUMN "featuredImagePublicId" TEXT,
    ADD COLUMN "featuredImageAlt" TEXT,
    ADD COLUMN "ogImageUrl" TEXT,
    ADD COLUMN "ogImagePublicId" TEXT,
    ADD COLUMN "ctaTitle" TEXT,
    ADD COLUMN "ctaDescription" TEXT,
    ADD COLUMN "ctaHref" TEXT,
    ADD COLUMN "ctaLabel" TEXT,
    ADD COLUMN "readingTime" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "publishedAt" TIMESTAMP(3),
    ADD COLUMN "scheduledAt" TIMESTAMP(3),
    ADD COLUMN "submittedAt" TIMESTAMP(3),
    ADD COLUMN "archivedAt" TIMESTAMP(3),
    ADD COLUMN "authorId" TEXT,
    ADD COLUMN "categoryId" TEXT,
    ADD COLUMN "translationGroupId" TEXT,
    ADD COLUMN "createdById" TEXT,
    ADD COLUMN "lastEditedById" TEXT,
    ADD COLUMN "publishedById" TEXT;

CREATE TABLE "BlogPostTag" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "BlogPostTag_pkey" PRIMARY KEY ("postId", "tagId")
);

CREATE TABLE "BlogPostRelation" (
    "fromPostId" TEXT NOT NULL,
    "toPostId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogPostRelation_pkey" PRIMARY KEY ("fromPostId", "toPostId")
);

CREATE TABLE "BlogReviewNote" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogReviewNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogPostRevision" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "featuredImageUrl" TEXT,
    "featuredImagePublicId" TEXT,
    "featuredImageAlt" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogPostRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogSlugRedirect" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "slug" TEXT NOT NULL,
    "targetSlug" TEXT NOT NULL,
    "postId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogSlugRedirect_pkey" PRIMARY KEY ("id")
);

DROP INDEX "BlogPost_slug_key";
CREATE UNIQUE INDEX "BlogPost_locale_slug_key" ON "BlogPost"("locale", "slug");

CREATE UNIQUE INDEX "BlogAuthor_userId_key" ON "BlogAuthor"("userId");
CREATE UNIQUE INDEX "BlogAuthor_slug_key" ON "BlogAuthor"("slug");
CREATE INDEX "BlogAuthor_isActive_displayName_idx" ON "BlogAuthor"("isActive", "displayName");

CREATE UNIQUE INDEX "BlogCategory_locale_slug_key" ON "BlogCategory"("locale", "slug");
CREATE INDEX "BlogCategory_locale_isActive_name_idx" ON "BlogCategory"("locale", "isActive", "name");

CREATE UNIQUE INDEX "BlogTag_locale_slug_key" ON "BlogTag"("locale", "slug");
CREATE INDEX "BlogTag_locale_name_idx" ON "BlogTag"("locale", "name");

CREATE UNIQUE INDEX "BlogMedia_publicId_key" ON "BlogMedia"("publicId");
CREATE INDEX "BlogMedia_createdAt_idx" ON "BlogMedia"("createdAt" DESC);
CREATE INDEX "BlogMedia_uploadedById_createdAt_idx" ON "BlogMedia"("uploadedById", "createdAt" DESC);

CREATE INDEX "BlogPostTag_tagId_idx" ON "BlogPostTag"("tagId");
CREATE INDEX "BlogPostRelation_toPostId_idx" ON "BlogPostRelation"("toPostId");
CREATE INDEX "BlogPostRelation_fromPostId_sortOrder_idx" ON "BlogPostRelation"("fromPostId", "sortOrder");
CREATE INDEX "BlogReviewNote_postId_createdAt_idx" ON "BlogReviewNote"("postId", "createdAt" DESC);
CREATE INDEX "BlogReviewNote_authorId_idx" ON "BlogReviewNote"("authorId");
CREATE UNIQUE INDEX "BlogPostRevision_postId_version_key" ON "BlogPostRevision"("postId", "version");
CREATE INDEX "BlogPostRevision_createdById_idx" ON "BlogPostRevision"("createdById");
CREATE INDEX "BlogPostRevision_createdAt_idx" ON "BlogPostRevision"("createdAt" DESC);
CREATE UNIQUE INDEX "BlogSlugRedirect_locale_slug_key" ON "BlogSlugRedirect"("locale", "slug");
CREATE INDEX "BlogSlugRedirect_postId_idx" ON "BlogSlugRedirect"("postId");

CREATE INDEX "BlogPost_locale_status_publishedAt_idx" ON "BlogPost"("locale", "status", "publishedAt" DESC);
CREATE INDEX "BlogPost_status_createdAt_idx" ON "BlogPost"("status", "createdAt" DESC);
CREATE INDEX "BlogPost_authorId_status_updatedAt_idx" ON "BlogPost"("authorId", "status", "updatedAt" DESC);
CREATE INDEX "BlogPost_createdById_idx" ON "BlogPost"("createdById");
CREATE INDEX "BlogPost_lastEditedById_idx" ON "BlogPost"("lastEditedById");
CREATE INDEX "BlogPost_publishedById_idx" ON "BlogPost"("publishedById");
CREATE INDEX "BlogPost_categoryId_status_publishedAt_idx" ON "BlogPost"("categoryId", "status", "publishedAt" DESC);
CREATE INDEX "BlogPost_featured_status_publishedAt_idx" ON "BlogPost"("featured", "status", "publishedAt" DESC);
CREATE INDEX "BlogPost_scheduledAt_status_idx" ON "BlogPost"("scheduledAt", "status");
CREATE INDEX "BlogPost_translationGroupId_idx" ON "BlogPost"("translationGroupId");

ALTER TABLE "BlogAuthor" ADD CONSTRAINT "BlogAuthor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BlogMedia" ADD CONSTRAINT "BlogMedia_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "BlogAuthor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_translationGroupId_fkey" FOREIGN KEY ("translationGroupId") REFERENCES "BlogTranslationGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BlogPostTag" ADD CONSTRAINT "BlogPostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogPostTag" ADD CONSTRAINT "BlogPostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "BlogTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogPostRelation" ADD CONSTRAINT "BlogPostRelation_fromPostId_fkey" FOREIGN KEY ("fromPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogPostRelation" ADD CONSTRAINT "BlogPostRelation_toPostId_fkey" FOREIGN KEY ("toPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogReviewNote" ADD CONSTRAINT "BlogReviewNote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogReviewNote" ADD CONSTRAINT "BlogReviewNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BlogPostRevision" ADD CONSTRAINT "BlogPostRevision_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogPostRevision" ADD CONSTRAINT "BlogPostRevision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BlogSlugRedirect" ADD CONSTRAINT "BlogSlugRedirect_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;
