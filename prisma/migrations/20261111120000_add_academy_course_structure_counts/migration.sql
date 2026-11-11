-- Additive: admin-entered course structure metadata (modules, lessons, paths).
-- Nullable by design — values are only surfaced when an administrator enters
-- them, so the public site never invents course structure data.
ALTER TABLE "AcademyCourse" ADD COLUMN "moduleCount" INTEGER;
ALTER TABLE "AcademyCourse" ADD COLUMN "lessonCount" INTEGER;
ALTER TABLE "AcademyCourse" ADD COLUMN "pathCount" INTEGER;
