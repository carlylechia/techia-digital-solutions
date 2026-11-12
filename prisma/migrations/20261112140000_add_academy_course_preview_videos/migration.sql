-- Additive: optional free introductory preview videos for academy courses.
-- Existing rows receive previewVideoEnabled = false and remain fully valid.
-- previewVideoProvider is nullable and only set once an administrator saves a
-- validated YouTube configuration, so "not configured" stays distinguishable
-- from "configured but disabled".
ALTER TABLE "AcademyCourse"
  ADD COLUMN "previewVideoProvider" TEXT,
  ADD COLUMN "previewVideoId" TEXT,
  ADD COLUMN "previewVideoEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "previewVideoTitle" TEXT,
  ADD COLUMN "previewVideoPoster" TEXT,
  ADD COLUMN "previewVideoDurationLabel" TEXT,
  ADD COLUMN "previewVideoUpdatedAt" TIMESTAMP(3);
