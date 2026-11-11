// Seed the academy catalog into the PRODUCTION database (.env.prod.vercel
// DATABASE_URL) from scripts-dev/academy-catalog.export.json.
// Idempotent: everything is upserted by slug; safe to re-run. Retries the
// whole run up to 3 times because remote Prisma Postgres occasionally drops
// long sequential sessions ("Connection terminated unexpectedly").
// Usage: node scripts-dev/seed-academy-catalog.mjs
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

function readEnvValue(file, key) {
  const line = fs
    .readFileSync(file, "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} not found in ${file}`);
  return line.slice(key.length + 1).trim().replace(/^"|"$/g, "");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const exportPath = path.join("scripts-dev", "academy-catalog.export.json");
if (!fs.existsSync(exportPath)) {
  console.error("Export file missing. Run: node scripts-dev/export-academy-catalog.mjs");
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(exportPath, "utf8"));

const connectionString = readEnvValue(".env.prod.vercel", "DATABASE_URL");

const ATTEMPTS = 3;

async function runSeedOnce(prisma) {
  // 1. Categories
  for (const c of data.categories) {
    const { slug, ...fields } = c;
    await prisma.academyCourseCategory.upsert({
      where: { slug },
      update: fields,
      create: { slug, ...fields },
    });
    await sleep(120);
  }
  console.log(`categories upserted: ${data.categories.length}`);

  // 2. Category slug -> prod id map
  const categoryIds = new Map(
    (await prisma.academyCourseCategory.findMany({ select: { id: true, slug: true } })).map(
      (row) => [row.slug, row.id],
    ),
  );

  // 3. Courses (+ lessons)
  let lessonCount = 0;
  for (const course of data.courses) {
    const { slug, categorySlug, lessons, ...fields } = course;
    const categoryId = categorySlug ? (categoryIds.get(categorySlug) ?? null) : null;
    const row = await prisma.academyCourse.upsert({
      where: { slug },
      update: { ...fields, categoryId },
      create: { slug, ...fields, categoryId },
    });
    await sleep(120);
    for (const lesson of lessons) {
      const { slug: lessonSlug, ...lessonFields } = lesson;
      await prisma.academyCourseLesson.upsert({
        where: { courseId_slug: { courseId: row.id, slug: lessonSlug } },
        update: lessonFields,
        create: { courseId: row.id, slug: lessonSlug, ...lessonFields },
      });
      lessonCount += 1;
      await sleep(120);
    }
  }
  console.log(`courses upserted: ${data.courses.length} | lessons upserted: ${lessonCount}`);

  // 4. Course slug -> prod id map
  const courseIds = new Map(
    (await prisma.academyCourse.findMany({ select: { id: true, slug: true } })).map(
      (row) => [row.slug, row.id],
    ),
  );

  // 5. Packs (+ items)
  let itemCount = 0;
  for (const pack of data.packs) {
    const { slug, items, ...fields } = pack;
    const row = await prisma.academyCoursePack.upsert({
      where: { slug },
      update: fields,
      create: { slug, ...fields },
    });
    await sleep(120);
    for (const item of items) {
      const courseId = courseIds.get(item.courseSlug);
      if (!courseId) {
        console.warn(`  !! pack ${slug}: course ${item.courseSlug} not found, skipped`);
        continue;
      }
      await prisma.academyCoursePackItem.upsert({
        where: { packId_courseId: { packId: row.id, courseId } },
        update: { position: item.position },
        create: { packId: row.id, courseId, position: item.position },
      });
      itemCount += 1;
      await sleep(120);
    }
  }
  console.log(`packs upserted: ${data.packs.length} | pack items upserted: ${itemCount}`);

  // 6. Verify
  const [cCount, lCount, pCount, piCount] = await Promise.all([
    prisma.academyCourse.count(),
    prisma.academyCourseLesson.count(),
    prisma.academyCoursePack.count(),
    prisma.academyCoursePackItem.count(),
  ]);
  console.log(
    `VERIFY prod -> courses: ${cCount} | lessons: ${lCount} | packs: ${pCount} | packItems: ${piCount}`,
  );
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  let lastError;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      if (attempt > 1) {
        console.log(`retry attempt ${attempt}/${ATTEMPTS}...`);
        await prisma.$disconnect().catch(() => {});
        await sleep(3000);
      }
      await runSeedOnce(prisma);
      console.log("SEED OK");
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      console.error(
        `attempt ${attempt} failed:`,
        error.code ?? "",
        error.message?.slice(0, 200),
      );
    }
  }
  if (lastError) {
    console.error("SEED FAILED after retries");
    process.exitCode = 1;
  }
} finally {
  await prisma.$disconnect();
}
