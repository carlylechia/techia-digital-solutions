import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import type { PrismaClient } from "@prisma/client";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  GraduationCap,
  Layers,
  Package,
  Plus,
  Receipt,
  Video,
  Wallet,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isLocale } from "@/content/site";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/admin/permissions";
import { createMetadata } from "@/lib/seo";
import {
  loadAdminAcademyCatalog,
  type AdminAcademyCatalog,
} from "@/lib/admin/academy";
import { formatMoney } from "@/lib/payments/money";
import { AcademyImageField } from "@/components/courses/AcademyImageField";
import { AcademyActionForm, type AcademyActionState } from "@/components/courses/AcademyActionForm";
import { AcademyPreviewVideoFields } from "@/components/courses/AcademyPreviewVideoFields";
import { AcademyRemovePreviewForm } from "@/components/courses/AcademyRemovePreviewForm";
import { AcademyCatalogBrowser, type AcademyCatalogItem } from "@/components/courses/AcademyCatalogBrowser";
import { AcademyPackFields } from "@/components/courses/AcademyPackFields";
import type { AcademyPackCourseOption } from "@/components/courses/AcademyPackCoursePicker";
import {
  ACADEMY_CURRENCY_OPTIONS as CURRENCY_OPTIONS,
  academyHintClass as hintClass,
  academyInputClass as inputClass,
  academyLabelClass as labelClass,
} from "@/components/courses/academy-form-styles";
import { getYouTubeWatchUrl } from "@/lib/courses/preview-video";
import {
  effectiveCoursePriceMinor,
  effectivePackPriceMinor,
  isPositivePrice,
} from "@/lib/courses/pricing";

export const dynamic = "force-dynamic";

type AdminCourse = AdminAcademyCatalog["courses"][number];
type AdminPack = AdminAcademyCatalog["packs"][number];

type CurrencyOption = (typeof CURRENCY_OPTIONS)[number];

function toPackCourseOption(course: AdminCourse): AcademyPackCourseOption {
  return {
    id: course.id,
    title: course.titleEn,
    slug: course.slug,
    status: course.status,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return {
    ...createMetadata({
      locale,
      title: "Academy Catalog Admin",
      description: "Manage academy courses, packs, prices, and orders.",
      path: "/admin/academy",
    }),
    robots: { index: false, follow: false },
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseIntOrNull(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Admin-entered structure counts must be non-negative or left blank. */
function parseCountOrNull(value: FormDataEntryValue | null) {
  const parsed = parseIntOrNull(value);
  if (parsed === null || parsed < 0) return null;
  return parsed;
}

function parseCurrency(value: FormDataEntryValue | null): CurrencyOption {
  const raw = String(value ?? "").trim().toUpperCase();
  return (CURRENCY_OPTIONS as readonly string[]).includes(raw) ? (raw as CurrencyOption) : "XAF";
}

function packText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function packOptionalText(formData: FormData, key: string) {
  return packText(formData, key) || null;
}

/** One bullet per line keeps commas inside sentences safe. */
function parsePackLines(formData: FormData, key: string) {
  return packText(formData, key)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Preserve the order the administrator arranged in the picker. */
function parsePackCourseIds(formData: FormData) {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const value of formData.getAll("courseIds")) {
    const id = String(value ?? "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

/**
 * Re-check every selected course on the server. The dropdown only offers
 * published courses, but a stale tab or a crafted request must not be able to
 * add a draft/archived course to a pack. Courses already in the pack remain
 * allowed even if they were later unpublished, so saving never silently drops
 * content the administrator has not explicitly removed.
 */
async function resolvePackCourseIds(
  prisma: PrismaClient,
  formData: FormData,
  currentCourseIds: Set<string>,
) {
  const ids = parsePackCourseIds(formData);
  if (!ids.length) return ids;

  const found = await prisma.academyCourse.findMany({
    where: { id: { in: ids } },
    select: { id: true, status: true },
  });
  if (found.length !== ids.length) {
    throw new Error("One or more selected courses no longer exist. Refresh and choose again.");
  }

  const statusById = new Map(found.map((course) => [course.id, course.status]));
  const invalid = ids.filter(
    (id) =>
      statusById.get(id) !== "PUBLISHED" && !currentCourseIds.has(id),
  );
  if (invalid.length) {
    throw new Error("Only published courses can be added to a pack. Remove the unpublished selection and try again.");
  }

  return ids;
}

const SAFE_ACADEMY_MESSAGES = [
  "Title, short description",
  "A valid slug",
  "A pack needs",
  "Only published courses",
  "One or more selected courses",
  "Type the exact pack slug",
  "Pack not found",
];

async function createPack(
  _previousState: AcademyActionState,
  formData: FormData,
): Promise<AcademyActionState> {
  "use server";
  try {
    await requireCatalogManager();
    const { getPrisma } = await import("@/lib/prisma");
    const prisma = getPrisma();
    if (!prisma) throw new Error("Database unavailable");

    const titleEn = packText(formData, "titleEn");
    const categoryLabelEn = packText(formData, "categoryLabelEn");
    const taglineEn = packText(formData, "taglineEn");
    const summaryEn = packText(formData, "summaryEn");
    const descriptionEn = packText(formData, "descriptionEn");
    if (!titleEn || !categoryLabelEn || !taglineEn || !summaryEn || !descriptionEn) {
      throw new Error("A pack needs a title, category label, tagline, summary, and description.");
    }

    const slugInput = packText(formData, "slug");
    const slug = slugify(slugInput || titleEn);
    if (!slug) throw new Error("A valid slug is required.");

    const status = String(formData.get("status") || "DRAFT");
    const level = String(formData.get("level") || "BEGINNER_TO_INTERMEDIATE");
    const courseIds = await resolvePackCourseIds(prisma, formData, new Set());

    const created = await prisma.$transaction(async (tx) => {
      const pack = await tx.academyCoursePack.create({
        data: {
          slug,
          titleEn,
          titleFr: packOptionalText(formData, "titleFr"),
          shortTitleEn: packOptionalText(formData, "shortTitleEn"),
          shortTitleFr: packOptionalText(formData, "shortTitleFr"),
          categoryLabelEn,
          categoryLabelFr: packOptionalText(formData, "categoryLabelFr"),
          taglineEn,
          taglineFr: packOptionalText(formData, "taglineFr"),
          summaryEn,
          summaryFr: packOptionalText(formData, "summaryFr"),
          descriptionEn,
          descriptionFr: packOptionalText(formData, "descriptionFr"),
          bestForEn: parsePackLines(formData, "bestForEn"),
          bestForFr: parsePackLines(formData, "bestForFr"),
          learningOutcomesEn: parsePackLines(formData, "learningOutcomesEn"),
          learningOutcomesFr: parsePackLines(formData, "learningOutcomesFr"),
          whyChooseEn: parsePackLines(formData, "whyChooseEn"),
          whyChooseFr: parsePackLines(formData, "whyChooseFr"),
          level:
            level === "BEGINNER" || level === "INTERMEDIATE"
              ? level
              : "BEGINNER_TO_INTERMEDIATE",
          recommended: formData.get("recommended") === "on",
          badgeEn: packOptionalText(formData, "badgeEn"),
          badgeFr: packOptionalText(formData, "badgeFr"),
          status:
            status === "PUBLISHED" || status === "ARCHIVED" ? status : "DRAFT",
          priceMinor: parseIntOrNull(formData.get("priceMinor")),
          compareAtPriceMinor: parseIntOrNull(formData.get("compareAtPriceMinor")),
          currency: parseCurrency(formData.get("currency")),
          chariowProductId: packOptionalText(formData, "chariowProductId"),
          imageUrl: packOptionalText(formData, "imageUrl"),
          seoTitleEn: packOptionalText(formData, "seoTitleEn"),
          seoTitleFr: packOptionalText(formData, "seoTitleFr"),
          seoDescriptionEn: packOptionalText(formData, "seoDescriptionEn"),
          seoDescriptionFr: packOptionalText(formData, "seoDescriptionFr"),
          position: parseIntOrNull(formData.get("position")) ?? 0,
          publishedAt: status === "PUBLISHED" ? new Date() : null,
        },
      });

      if (courseIds.length) {
        await tx.academyCoursePackItem.createMany({
          data: courseIds.map((courseId, position) => ({
            packId: pack.id,
            courseId,
            position,
          })),
        });
      }

      return pack;
    });

    revalidateAcademy();
    return {
      ok: true,
      message:
        created.status === "PUBLISHED"
          ? `Pack created and published with ${courseIds.length} course${courseIds.length === 1 ? "" : "s"}. “${created.titleEn}” now appears on the storefront.`
          : `Pack created with ${courseIds.length} course${courseIds.length === 1 ? "" : "s"}. “${created.titleEn}” is in the Packs view below — publish it to show it on the storefront.`,
      ts: Date.now(),
    };
  } catch (error) {
    return { ok: false, message: friendlyAcademyError(error, "pack"), ts: Date.now() };
  }
}

async function requireCatalogManager() {
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth");
  const { hasPermission } = await import("@/lib/admin/permissions");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !hasPermission(session.user.permissions, "academy.catalog.manage")) {
    throw new Error("Unauthorized");
  }
}

function revalidateAcademy() {
  revalidatePath("/[locale]/admin/academy", "page");
  revalidatePath("/[locale]/courses", "page");
  revalidatePath("/[locale]/courses/[slug]", "page");
  revalidatePath("/sitemap.xml", "page");
}

/**
 * Turn thrown errors into readable admin-facing feedback. Never leaks internals —
 * duplicate slugs and permission issues get precise messages, everything else a
 * calm retry prompt.
 */
function friendlyAcademyError(error: unknown, noun: "course" | "pack"): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === "P2002") {
    return `A ${noun} with this slug already exists. Choose a different slug.`;
  }
  if (code === "P2025") {
    return `This ${noun} was changed or removed elsewhere. Refresh the page and try again.`;
  }
  const message = error instanceof Error ? error.message : "";
  if (SAFE_ACADEMY_MESSAGES.some((prefix) => message.startsWith(prefix))) {
    return message;
  }
  if (message === "Unauthorized") {
    return "You do not have permission to manage the academy catalog.";
  }
  if (message === "Missing id") {
    return "This form is missing its record id. Refresh the page and try again.";
  }
  if (/Database unavailable/.test(message)) {
    return "The database is unavailable right now. Try again shortly.";
  }
  return `Could not save the ${noun}. Review the form and try again.`;
}

async function createCourse(
  _previousState: AcademyActionState,
  formData: FormData,
): Promise<AcademyActionState> {
  "use server";
  try {
    await requireCatalogManager();
    const { getPrisma } = await import("@/lib/prisma");
    const prisma = getPrisma();
    if (!prisma) throw new Error("Database unavailable");

    const titleEn = String(formData.get("titleEn") || "").trim();
    const shortDescriptionEn = String(formData.get("shortDescriptionEn") || "").trim();
    const descriptionEn = String(formData.get("descriptionEn") || "").trim();
    if (!titleEn || !shortDescriptionEn || !descriptionEn) {
      throw new Error("Title, short description, and description are required.");
    }

    const slugInput = String(formData.get("slug") || "").trim();
    const slug = slugify(slugInput || titleEn);
    if (!slug) throw new Error("A valid slug is required.");

    const status = String(formData.get("status") || "DRAFT");
    const level = String(formData.get("level") || "BEGINNER_TO_INTERMEDIATE");
    const categoryId = String(formData.get("categoryId") || "").trim() || null;
    const skills = String(formData.get("skillsEn") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const created = await prisma.academyCourse.create({
      data: {
        slug,
        titleEn,
        titleFr: String(formData.get("titleFr") || "").trim() || null,
        shortDescriptionEn,
        shortDescriptionFr: String(formData.get("shortDescriptionFr") || "").trim() || null,
        descriptionEn,
        descriptionFr: String(formData.get("descriptionFr") || "").trim() || null,
        level:
          level === "BEGINNER" || level === "INTERMEDIATE"
            ? level
            : "BEGINNER_TO_INTERMEDIATE",
        status: status === "PUBLISHED" || status === "ARCHIVED" ? status : "DRAFT",
        categoryId,
        skillsEn: skills,
        moduleCount: parseCountOrNull(formData.get("moduleCount")),
        lessonCount: parseCountOrNull(formData.get("lessonCount")),
        pathCount: parseCountOrNull(formData.get("pathCount")),
        includedInFullPack: formData.get("includedInFullPack") !== "off",
        financialDisclaimerRequired: formData.get("financialDisclaimerRequired") === "on",
        priceMinor: parseIntOrNull(formData.get("priceMinor")),
        compareAtPriceMinor: parseIntOrNull(formData.get("compareAtPriceMinor")),
        currency: parseCurrency(formData.get("currency")),
        chariowProductId: String(formData.get("chariowProductId") || "").trim() || null,
        imageUrl: String(formData.get("imageUrl") || "").trim() || null,
        position: parseIntOrNull(formData.get("position")) ?? 0,
        seoTitleEn: String(formData.get("seoTitleEn") || "").trim() || null,
        seoDescriptionEn: String(formData.get("seoDescriptionEn") || "").trim() || null,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });

    revalidateAcademy();
    return {
      ok: true,
      message:
        created.status === "PUBLISHED"
          ? `Course created and published. “${created.titleEn}” now appears in the Courses list and on the storefront.`
          : `Course created. “${created.titleEn}” is in the Courses list below — publish it to show it on the storefront.`,
      ts: Date.now(),
    };
  } catch (error) {
    return { ok: false, message: friendlyAcademyError(error, "course"), ts: Date.now() };
  }
}

async function updateCourse(
  _previousState: AcademyActionState,
  formData: FormData,
): Promise<AcademyActionState> {
  "use server";
  try {
    await requireCatalogManager();
    const { getPrisma } = await import("@/lib/prisma");
    const prisma = getPrisma();
    if (!prisma) throw new Error("Database unavailable");
    const id = String(formData.get("id") || "");
    if (!id) throw new Error("Missing id");
    const status = String(formData.get("status") || "PUBLISHED");
    const updated = await prisma.academyCourse.update({
      where: { id },
      data: {
        titleEn: String(formData.get("titleEn") || "").trim() || undefined,
        shortDescriptionEn: String(formData.get("shortDescriptionEn") || "").trim() || undefined,
        descriptionEn: String(formData.get("descriptionEn") || "").trim() || undefined,
        moduleCount: parseCountOrNull(formData.get("moduleCount")),
        lessonCount: parseCountOrNull(formData.get("lessonCount")),
        pathCount: parseCountOrNull(formData.get("pathCount")),
        seoTitleEn: String(formData.get("seoTitleEn") || "").trim() || null,
        seoDescriptionEn: String(formData.get("seoDescriptionEn") || "").trim() || null,
        priceMinor: parseIntOrNull(formData.get("priceMinor")),
        compareAtPriceMinor: parseIntOrNull(formData.get("compareAtPriceMinor")),
        currency: parseCurrency(formData.get("currency")),
        chariowProductId: String(formData.get("chariowProductId") || "").trim() || null,
        imageUrl: String(formData.get("imageUrl") || "").trim() || null,
        status: status === "DRAFT" || status === "ARCHIVED" ? status : "PUBLISHED",
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });
    revalidateAcademy();
    return {
      ok: true,
      message: `Course saved. “${updated.titleEn}” is ${updated.status === "PUBLISHED" ? "live on the storefront" : "not visible to the public (" + updated.status.toLowerCase() + ")"}.`,
      ts: Date.now(),
    };
  } catch (error) {
    return { ok: false, message: friendlyAcademyError(error, "course"), ts: Date.now() };
  }
}

async function updateCoursePreview(
  _previousState: AcademyActionState,
  formData: FormData,
): Promise<AcademyActionState> {
  "use server";
  const { saveAcademyCoursePreview } = await import("@/lib/admin/academy-preview");
  return saveAcademyCoursePreview({
    courseId: String(formData.get("id") || ""),
    url: String(formData.get("previewVideoUrl") || ""),
    title: String(formData.get("previewVideoTitle") || ""),
    durationLabel: String(formData.get("previewVideoDurationLabel") || ""),
    posterUrl: String(formData.get("previewVideoPoster") || ""),
    enabled: formData.get("previewVideoEnabled") === "on",
    remove: formData.get("intent") === "remove",
  });
}

async function removeCoursePreview(
  _previousState: AcademyActionState,
  formData: FormData,
): Promise<AcademyActionState> {
  "use server";
  const { saveAcademyCoursePreview } = await import("@/lib/admin/academy-preview");
  return saveAcademyCoursePreview({
    courseId: String(formData.get("id") || ""),
    url: "",
    title: "",
    durationLabel: "",
    posterUrl: "",
    enabled: false,
    remove: true,
  });
}

async function updatePack(
  _previousState: AcademyActionState,
  formData: FormData,
): Promise<AcademyActionState> {
  "use server";
  try {
    await requireCatalogManager();
    const { getPrisma } = await import("@/lib/prisma");
    const prisma = getPrisma();
    if (!prisma) throw new Error("Database unavailable");
    const id = String(formData.get("id") || "");
    if (!id) throw new Error("Missing id");

    const current = await prisma.academyCoursePack.findUnique({
      where: { id },
      select: {
        slug: true,
        status: true,
        level: true,
        publishedAt: true,
        items: { select: { courseId: true } },
      },
    });
    if (!current) throw new Error("Pack not found");

    const slugInput = packText(formData, "slug");
    const slug = slugInput ? slugify(slugInput) : undefined;
    if (slugInput && !slug) throw new Error("A valid slug is required.");

    const status = String(formData.get("status") || current.status);
    const level = String(formData.get("level") || current.level);
    const courseIds = await resolvePackCourseIds(
      prisma,
      formData,
      new Set(current.items.map((item) => item.courseId)),
    );

    const updated = await prisma.$transaction(async (tx) => {
      const pack = await tx.academyCoursePack.update({
        where: { id },
        data: {
          slug,
          titleEn: packText(formData, "titleEn") || undefined,
          titleFr: packOptionalText(formData, "titleFr"),
          shortTitleEn: packOptionalText(formData, "shortTitleEn"),
          shortTitleFr: packOptionalText(formData, "shortTitleFr"),
          categoryLabelEn: packText(formData, "categoryLabelEn") || undefined,
          categoryLabelFr: packOptionalText(formData, "categoryLabelFr"),
          taglineEn: packText(formData, "taglineEn") || undefined,
          taglineFr: packOptionalText(formData, "taglineFr"),
          summaryEn: packText(formData, "summaryEn") || undefined,
          summaryFr: packOptionalText(formData, "summaryFr"),
          descriptionEn: packText(formData, "descriptionEn") || undefined,
          descriptionFr: packOptionalText(formData, "descriptionFr"),
          bestForEn: parsePackLines(formData, "bestForEn"),
          bestForFr: parsePackLines(formData, "bestForFr"),
          learningOutcomesEn: parsePackLines(formData, "learningOutcomesEn"),
          learningOutcomesFr: parsePackLines(formData, "learningOutcomesFr"),
          whyChooseEn: parsePackLines(formData, "whyChooseEn"),
          whyChooseFr: parsePackLines(formData, "whyChooseFr"),
          level:
            level === "BEGINNER" || level === "INTERMEDIATE"
              ? level
              : "BEGINNER_TO_INTERMEDIATE",
          recommended: formData.get("recommended") === "on",
          badgeEn: packOptionalText(formData, "badgeEn"),
          badgeFr: packOptionalText(formData, "badgeFr"),
          priceMinor: parseIntOrNull(formData.get("priceMinor")),
          compareAtPriceMinor: parseIntOrNull(formData.get("compareAtPriceMinor")),
          currency: parseCurrency(formData.get("currency")),
          chariowProductId: packOptionalText(formData, "chariowProductId"),
          imageUrl: packOptionalText(formData, "imageUrl"),
          seoTitleEn: packOptionalText(formData, "seoTitleEn"),
          seoTitleFr: packOptionalText(formData, "seoTitleFr"),
          seoDescriptionEn: packOptionalText(formData, "seoDescriptionEn"),
          seoDescriptionFr: packOptionalText(formData, "seoDescriptionFr"),
          position: parseIntOrNull(formData.get("position")) ?? 0,
          status:
            status === "DRAFT" || status === "ARCHIVED" ? status : "PUBLISHED",
          publishedAt:
            status === "PUBLISHED" ? current.publishedAt ?? new Date() : null,
        },
      });

      await tx.academyCoursePackItem.deleteMany({ where: { packId: id } });
      if (courseIds.length) {
        await tx.academyCoursePackItem.createMany({
          data: courseIds.map((courseId, position) => ({
            packId: id,
            courseId,
            position,
          })),
        });
      }

      return pack;
    });

    revalidateAcademy();
    return {
      ok: true,
      message: `Pack saved with ${courseIds.length} course${courseIds.length === 1 ? "" : "s"}. “${updated.titleEn}” is ${updated.status === "PUBLISHED" ? "live on the storefront" : "not visible to the public (" + updated.status.toLowerCase() + ")"}.`,
      ts: Date.now(),
    };
  } catch (error) {
    return { ok: false, message: friendlyAcademyError(error, "pack"), ts: Date.now() };
  }
}

async function deletePack(
  _previousState: AcademyActionState,
  formData: FormData,
): Promise<AcademyActionState> {
  "use server";
  try {
    await requireCatalogManager();
    const { getPrisma } = await import("@/lib/prisma");
    const prisma = getPrisma();
    if (!prisma) throw new Error("Database unavailable");
    const id = String(formData.get("id") || "");
    if (!id) throw new Error("Missing id");
    const confirmSlug = packText(formData, "confirmSlug");

    const pack = await prisma.academyCoursePack.findUnique({
      where: { id },
      select: { id: true, slug: true, titleEn: true },
    });
    if (!pack) throw new Error("Pack not found");
    if (confirmSlug !== pack.slug) {
      throw new Error("Type the exact pack slug to confirm deletion.");
    }

    await prisma.academyCoursePack.delete({ where: { id } });
    revalidateAcademy();
    return {
      ok: true,
      message: `Pack “${pack.titleEn}” deleted. Existing order history keeps its saved title and slug snapshot.`,
      ts: Date.now(),
    };
  } catch (error) {
    return { ok: false, message: friendlyAcademyError(error, "pack"), ts: Date.now() };
  }
}

const STATUS_TONES: Record<string, string> = {
  PUBLISHED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  DRAFT: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  ARCHIVED: "border-border bg-surface text-muted",
  PAID: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  FAILED: "border-red-500/30 bg-red-500/10 text-red-300",
  CANCELLED: "border-red-500/30 bg-red-500/10 text-red-300",
  REQUIRES_REVIEW: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  REFUNDED: "border-sky-500/30 bg-sky-500/10 text-sky-300",
};

function StatusPill({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide ${
        STATUS_TONES[value] || "border-border bg-surface text-muted"
      }`}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}

/**
 * Admin toggle for which payment providers appear at checkout. API keys live in
 * environment variables; this only flips visibility in the storefront/checkout
 * (see getPaymentProviderEnablement in lib/payments/providers).
 */
async function updatePaymentProviders(
  _previousState: AcademyActionState,
  formData: FormData,
): Promise<AcademyActionState> {
  "use server";
  try {
    await requireCatalogManager();
    const { getPrisma } = await import("@/lib/prisma");
    const prisma = getPrisma();
    if (!prisma) throw new Error("Database unavailable");

    const chariowEnabled = formData.get("chariowEnabled") === "on";
    const monerooEnabled = formData.get("monerooEnabled") === "on";
    await prisma.academyPaymentSettings.upsert({
      where: { id: "singleton" },
      update: { chariowEnabled, monerooEnabled },
      create: { id: "singleton", chariowEnabled, monerooEnabled },
    });

    revalidateAcademy();
    return {
      ok: true,
      message: `Payment methods saved. Chariow: ${chariowEnabled ? "shown at checkout" : "hidden"}, Moneroo: ${monerooEnabled ? "shown at checkout" : "hidden"}.`,
      ts: Date.now(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return {
      ok: false,
      message: /Database unavailable/.test(message)
        ? "The database is unavailable right now. Try again shortly."
        : "Could not save the payment methods. Refresh the page and try again.",
      ts: Date.now(),
    };
  }
}

function MetaPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted">
      {children}
    </span>
  );
}

/** At-a-glance state so admins can find the 16 courses still missing a video. */
function PreviewStatusPill({
  configured,
  enabled,
}: {
  configured: boolean;
  enabled: boolean;
}) {
  if (!configured) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted">
        <Video className="size-3" /> No preview
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        enabled
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-300"
      }`}
    >
      <Video className="size-3" /> {enabled ? "Preview live" : "Preview off"}
    </span>
  );
}

/** Shows the effective price; flags the 2,000/5,000 FCFA fallback when admin left it blank. */
function PricePill({
  priceMinor,
  currency,
  kind,
}: {
  priceMinor: number | null;
  currency: string;
  kind: "course" | "pack";
}) {
  const effective =
    kind === "course"
      ? effectiveCoursePriceMinor(priceMinor, currency)
      : effectivePackPriceMinor(priceMinor, currency);
  const isDefault = effective !== null && !isPositivePrice(priceMinor);
  return (
    <MetaPill>
      {currency} {effective ?? "—"}
      {isDefault ? " · default" : ""}
    </MetaPill>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <div className="elevated-panel rounded-2xl border border-border/70 p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-xl bg-accent/10 text-accent">
          <Icon className="size-4" />
        </span>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-semibold text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}

function SectionHeader({
  id,
  icon: Icon,
  title,
  count,
  hint,
}: {
  id: string;
  icon: typeof BookOpen;
  title: string;
  count?: number;
  hint?: string;
}) {
  return (
    <div id={id} className="flex flex-wrap items-end justify-between gap-3 scroll-mt-24">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-xl bg-accent/10 text-accent">
          <Icon className="size-4" />
        </span>
        <h2 className="text-2xl font-semibold text-primary">
          {title}
          {typeof count === "number" ? (
            <span className="ml-2 align-middle text-sm font-semibold text-muted">({count})</span>
          ) : null}
        </h2>
      </div>
      {hint ? <p className="max-w-xl text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

function CourseAdminPanel({
  course,
  canManage,
}: {
  course: AdminCourse;
  canManage: boolean;
}) {
  return (
    <details className="gradient-border rounded-[1.5rem] scroll-mt-24">
      <summary className="elevated-panel cursor-pointer list-none p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-muted">/{course.slug}</p>
            <p className="mt-0.5 truncate text-lg font-semibold text-primary">{course.titleEn}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill value={course.status} />
            <PreviewStatusPill
              configured={Boolean(course.previewVideoId)}
              enabled={course.previewVideoEnabled}
            />
            <PricePill priceMinor={course.priceMinor} currency={course.currency} kind="course" />
            {course.moduleCount !== null ? <MetaPill>{course.moduleCount} modules</MetaPill> : null}
            {course.lessonCount !== null ? (
              <MetaPill>{course.lessonCount} lessons</MetaPill>
            ) : (
              <MetaPill>{course._count.lessons} lessons (auto)</MetaPill>
            )}
            {course.pathCount !== null ? <MetaPill>{course.pathCount} paths</MetaPill> : null}
            {course._count.packItems > 0 ? <MetaPill>{course._count.packItems} pack{course._count.packItems === 1 ? "" : "s"}</MetaPill> : null}
          </div>
        </div>
      </summary>
      {canManage ? (
        <AcademyActionForm
          action={updateCourse}
          submitLabel="Save course"
          helper="Saving revalidates the courses page, course detail pages, and the sitemap."
        >
          <input type="hidden" name="id" value={course.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>
              Title (EN)
              <input name="titleEn" defaultValue={course.titleEn} className={inputClass} />
            </label>
            <label className={labelClass}>
              Status
              <select name="status" defaultValue={course.status} className={inputClass}>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
          </div>
          <label className={labelClass}>
            Short description (EN)
            <textarea name="shortDescriptionEn" defaultValue={course.shortDescriptionEn} rows={2} className={inputClass} />
          </label>
          <label className={labelClass}>
            Description (EN)
            <textarea name="descriptionEn" defaultValue={course.descriptionEn} rows={4} className={inputClass} />
          </label>

          <div className="rounded-2xl border border-border bg-surface-strong/40 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Course structure</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <label className={labelClass}>
                Modules
                <input name="moduleCount" type="number" min={0} defaultValue={course.moduleCount ?? ""} className={inputClass} placeholder="0" />
                <span className={hintClass}>Currently recorded: modules in this course</span>
              </label>
              <label className={labelClass}>
                Lessons
                <input name="lessonCount" type="number" min={0} defaultValue={course.lessonCount ?? ""} className={inputClass} placeholder="0" />
                <span className={hintClass}>Auto count from the database: {course._count.lessons}</span>
              </label>
              <label className={labelClass}>
                Paths
                <input name="pathCount" type="number" min={0} defaultValue={course.pathCount ?? ""} className={inputClass} placeholder="0" />
                <span className={hintClass}>Learning paths this course appears in</span>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-strong/40 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Pricing &amp; delivery</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <label className={labelClass}>
                Currency
                <select name="currency" defaultValue={course.currency} className={inputClass}>
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Price (minor)
                <input name="priceMinor" type="number" min={0} defaultValue={course.priceMinor ?? ""} className={inputClass} />
                <span className={hintClass}>Blank = default 2,000 FCFA (XAF items only)</span>
              </label>
              <label className={labelClass}>
                Compare-at (minor)
                <input name="compareAtPriceMinor" type="number" min={0} defaultValue={course.compareAtPriceMinor ?? ""} className={inputClass} />
              </label>
              <label className={labelClass}>
                Chariow product ID
                <input name="chariowProductId" defaultValue={course.chariowProductId ?? ""} className={inputClass} />
              </label>
            </div>
            <div className="mt-4">
              <AcademyImageField name="imageUrl" defaultValue={course.imageUrl ?? ""} label="Cover image" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>
              SEO title (EN)
              <input name="seoTitleEn" defaultValue={course.seoTitleEn ?? ""} className={inputClass} />
            </label>
            <label className={labelClass}>
              SEO description (EN)
              <input name="seoDescriptionEn" defaultValue={course.seoDescriptionEn ?? ""} className={inputClass} />
            </label>
          </div>
        </AcademyActionForm>
      ) : (
        <div className="elevated-panel border-t border-border p-5 text-sm text-muted">
          Read-only view. Ask an administrator with catalog permissions to edit this course.
        </div>
      )}

      {canManage ? (
        <div className="border-t border-border bg-surface-strong/20 p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-primary">Free introductory video</p>
            <p className="mt-1 max-w-3xl text-xs leading-6 text-muted">
              Host the 4–5 minute introduction on the official teChia YouTube channel as an
              Unlisted video, then paste a normal watch link here. Customers only see a
              lightweight poster until they click Play. For a custom poster, use a
              1280×720 WebP or JPEG under about 200 KB.
            </p>
          </div>
          <AcademyActionForm
            action={updateCoursePreview}
            submitLabel="Save preview"
            pendingLabel="Saving preview…"
            helper="Saving a preview immediately revalidates the public course page. The rest of the course data is untouched."
          >
            <input type="hidden" name="id" value={course.id} />
            <AcademyPreviewVideoFields
              defaultUrl={getYouTubeWatchUrl(course.previewVideoId ?? "") ?? ""}
              defaultTitle={course.previewVideoTitle ?? ""}
              defaultDurationLabel={course.previewVideoDurationLabel ?? ""}
              defaultEnabled={course.previewVideoEnabled}
              hasExistingPreview={Boolean(course.previewVideoId)}
            />
            <AcademyImageField
              name="previewVideoPoster"
              defaultValue={course.previewVideoPoster ?? ""}
              label="Preview poster (optional)"
            />
          </AcademyActionForm>
          {course.previewVideoId ? (
            <AcademyRemovePreviewForm
              action={removeCoursePreview}
              courseId={course.id}
            />
          ) : null}
        </div>
      ) : null}
    </details>
  );
}

function CourseCreatePanel({
  categories,
}: {
  categories: AdminAcademyCatalog["categories"];
}) {
  return (
    <details className="rounded-2xl border border-dashed border-border bg-surface/70">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <Plus className="size-4 text-accent" /> Add a new course
        </span>
        <span className="text-xs text-muted">
          Click to open the course form
        </span>
      </summary>
      <div className="border-t border-border p-4 sm:p-5">
        <AcademyActionForm
          action={createCourse}
          submitLabel="Create course"
          pendingLabel="Creating course…"
          helper="Publishing sets the public timestamp and revalidates the courses page and sitemap."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>
              Title (EN) *
              <input name="titleEn" required className={inputClass} placeholder="e.g. Introduction to SEO" />
            </label>
            <label className={labelClass}>
              Slug <span className="normal-case text-muted/70">(auto from title if blank)</span>
              <input name="slug" className={inputClass} placeholder="intro-to-seo" />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>
              Title (FR)
              <input name="titleFr" className={inputClass} placeholder="Titre en français" />
            </label>
            <label className={labelClass}>
              Category
              <select name="categoryId" defaultValue="" className={inputClass}>
                <option value="">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.nameEn}</option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClass}>
            Short description (EN) *
            <textarea name="shortDescriptionEn" required rows={2} className={inputClass} placeholder="One or two sentences shown on cards" />
          </label>
          <label className={labelClass}>
            Short description (FR)
            <textarea name="shortDescriptionFr" rows={2} className={inputClass} />
          </label>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className={labelClass}>
              Description (EN) *
              <textarea name="descriptionEn" required rows={4} className={inputClass} />
            </label>
            <label className={labelClass}>
              Description (FR)
              <textarea name="descriptionFr" rows={4} className={inputClass} />
            </label>
          </div>
          <label className={labelClass}>
            Skills (EN, comma-separated)
            <input name="skillsEn" className={inputClass} placeholder="SEO, Content, Analytics" />
          </label>

          <div className="rounded-2xl border border-border bg-surface-strong/40 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Course structure</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <label className={labelClass}>
                Modules
                <input name="moduleCount" type="number" min={0} className={inputClass} placeholder="0" />
                <span className={hintClass}>Number of modules inside this course</span>
              </label>
              <label className={labelClass}>
                Lessons
                <input name="lessonCount" type="number" min={0} className={inputClass} placeholder="0" />
                <span className={hintClass}>Teaching units in this course</span>
              </label>
              <label className={labelClass}>
                Paths
                <input name="pathCount" type="number" min={0} className={inputClass} placeholder="0" />
                <span className={hintClass}>Learning paths this course appears in</span>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-strong/40 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Pricing &amp; delivery</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <label className={labelClass}>
                Currency
                <select name="currency" defaultValue="XAF" className={inputClass}>
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <span className={hintClass}>Storefront currencies</span>
              </label>
              <label className={labelClass}>
                Price (minor units)
                <input name="priceMinor" type="number" min={0} className={inputClass} placeholder="e.g. 10000" />
                <span className={hintClass}>Blank = default 2,000 FCFA (XAF items only)</span>
              </label>
              <label className={labelClass}>
                Compare-at (minor)
                <input name="compareAtPriceMinor" type="number" min={0} className={inputClass} />
              </label>
              <label className={labelClass}>
                Chariow product ID
                <input name="chariowProductId" className={inputClass} />
              </label>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className={labelClass}>
                Status
                <select name="status" defaultValue="DRAFT" className={inputClass}>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
                <span className={hintClass}>Only published courses are public</span>
              </label>
              <label className={labelClass}>
                Level
                <select name="level" defaultValue="BEGINNER_TO_INTERMEDIATE" className={inputClass}>
                  <option value="BEGINNER">Beginner</option>
                  <option value="BEGINNER_TO_INTERMEDIATE">Beginner → Intermediate</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                </select>
              </label>
              <label className={labelClass}>
                Position
                <input name="position" type="number" defaultValue={0} className={inputClass} />
              </label>
            </div>
            <div className="mt-4">
              <AcademyImageField name="imageUrl" label="Cover image" />
            </div>
            <div className="mt-4 flex flex-wrap gap-6 text-sm">
              <label className="flex items-center gap-2 text-muted">
                <input type="checkbox" name="includedInFullPack" defaultChecked className="size-4 accent-cyan-400" /> Included in full pack
              </label>
              <label className="flex items-center gap-2 text-muted">
                <input type="checkbox" name="financialDisclaimerRequired" className="size-4 accent-cyan-400" /> Financial disclaimer required
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>
              SEO title (EN)
              <input name="seoTitleEn" className={inputClass} />
            </label>
            <label className={labelClass}>
              SEO description (EN)
              <input name="seoDescriptionEn" className={inputClass} />
            </label>
          </div>
        </AcademyActionForm>
      </div>
    </details>
  );
}

function PackCreatePanel({ courses }: { courses: AdminCourse[] }) {
  const publishedCourses = courses.filter(
    (course) => course.status === "PUBLISHED",
  );

  return (
    <details className="rounded-2xl border border-dashed border-border bg-surface/70">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <Plus className="size-4 text-accent" /> Add a new pack
        </span>
        <span className="text-xs text-muted">
          Click to open the pack form
        </span>
      </summary>
      <div className="border-t border-border p-4 sm:p-5">
        <AcademyActionForm
          action={createPack}
          submitLabel="Create pack"
          pendingLabel="Creating pack…"
          helper="Only published courses can be added. Publish the pack to show it on the storefront."
        >
          <AcademyPackFields courses={publishedCourses.map(toPackCourseOption)} />
        </AcademyActionForm>
      </div>
    </details>
  );
}

function PackAdminPanel({
  pack,
  courses,
  canManage,
}: {
  pack: AdminPack;
  courses: AdminCourse[];
  canManage: boolean;
}) {
  return (
    <details className="gradient-border rounded-[1.5rem] scroll-mt-24">
      <summary className="elevated-panel cursor-pointer list-none p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-muted">/{pack.slug}</p>
            <p className="mt-0.5 truncate text-lg font-semibold text-primary">{pack.titleEn}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill value={pack.status} />
            <PricePill priceMinor={pack.priceMinor} currency={pack.currency} kind="pack" />
            <MetaPill>{pack._count.items} courses</MetaPill>
            {pack.recommended ? <MetaPill>Recommended</MetaPill> : null}
          </div>
        </div>
      </summary>
      {canManage ? (
        <>
          <AcademyActionForm
            action={updatePack}
            submitLabel="Save pack"
            helper={`Included courses: ${pack.items.map((item) => item.course.titleEn).join(", ") || "—"}`}
          >
            <input type="hidden" name="id" value={pack.id} />
            <AcademyPackFields pack={pack} courses={courses.map(toPackCourseOption)} />
          </AcademyActionForm>

          <details className="border-t border-border bg-surface-strong/20">
            <summary className="cursor-pointer list-none p-4 sm:p-5">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-red-300">
                Danger zone
              </span>
              <span className="ml-2 text-xs text-muted">
                Permanently delete this pack
              </span>
            </summary>
            <div className="px-4 pb-5 sm:px-5">
              <AcademyActionForm
                action={deletePack}
                submitLabel="Delete pack permanently"
                pendingLabel="Deleting…"
                helper={`Type ${pack.slug} to confirm. Past orders keep their saved title and slug snapshots.`}
              >
                <input type="hidden" name="id" value={pack.id} />
                <label className={labelClass}>
                  Confirm slug
                  <input
                    name="confirmSlug"
                    required
                    autoComplete="off"
                    className={inputClass}
                    placeholder={pack.slug}
                  />
                  <span className={hintClass}>
                    This removes the pack and its course links. The public URL stops
                    working immediately. To hide it without deleting it, set the
                    status to Archived instead.
                  </span>
                </label>
              </AcademyActionForm>
            </div>
          </details>
        </>
      ) : (
        <div className="elevated-panel border-t border-border p-5 text-sm text-muted">
          Read-only view. Ask an administrator with catalog permissions to edit this pack.
        </div>
      )}
    </details>
  );
}


export default async function AdminAcademyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/admin");
  if (
    !hasPermission(session.user.permissions, "academy.catalog.manage") &&
    !hasPermission(session.user.permissions, "academy.orders.view")
  ) {
    redirect("/admin");
  }

  const prisma = getPrisma();
  if (!prisma) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background p-4 text-primary">
        <div className="gradient-border max-w-xl rounded-[1.75rem]">
          <div className="elevated-panel p-6 sm:p-8">
            <h1 className="text-3xl font-semibold">Academy admin unavailable</h1>
            <p className="mt-3 text-muted">Database connectivity is required.</p>
          </div>
        </div>
      </main>
    );
  }

  const { courses, packs, categories, orders } = await loadAdminAcademyCatalog(prisma);
  const canManage = hasPermission(session.user.permissions, "academy.catalog.manage");
  let paymentSettings = { chariowEnabled: true, monerooEnabled: true };
  try {
    const row = await prisma.academyPaymentSettings.findUnique({
      where: { id: "singleton" },
    });
    if (row) {
      paymentSettings = {
        chariowEnabled: row.chariowEnabled,
        monerooEnabled: row.monerooEnabled,
      };
    }
  } catch {
    // Settings table not migrated yet — default to both providers enabled.
  }
  const publishedCount = courses.filter((course) => course.status === "PUBLISHED").length;
  const previewCount = courses.filter(
    (course) => course.previewVideoEnabled && Boolean(course.previewVideoId),
  ).length;
  const packCourseCount = new Set(packs.flatMap((pack) => pack.items.map((item) => item.courseId))).size;

  const courseItems: AcademyCatalogItem[] = courses.map((course) => ({
    id: course.id,
    title: course.titleEn,
    slug: course.slug,
    status: course.status,
    position: course.position,
    effectivePriceMinor: effectiveCoursePriceMinor(
      course.priceMinor,
      course.currency,
    ),
    courseCount: 0,
    updatedAt: course.updatedAt.toISOString(),
    searchText: [
      course.titleEn,
      course.titleFr,
      course.slug,
      course.category?.nameEn,
      course.category?.nameFr,
      course.level,
      ...course.skillsEn,
      ...course.skillsFr,
    ]
      .filter(Boolean)
      .join(" "),
    content: <CourseAdminPanel course={course} canManage={canManage} />,
  }));

  const packItems: AcademyCatalogItem[] = packs.map((pack) => ({
    id: pack.id,
    title: pack.titleEn,
    slug: pack.slug,
    status: pack.status,
    position: pack.position,
    effectivePriceMinor: effectivePackPriceMinor(pack.priceMinor, pack.currency),
    courseCount: pack.items.length,
    updatedAt: pack.updatedAt.toISOString(),
    searchText: [
      pack.titleEn,
      pack.titleFr,
      pack.slug,
      pack.categoryLabelEn,
      pack.categoryLabelFr,
      pack.level,
      pack.badgeEn,
      ...pack.items.flatMap((item) => [
        item.course.titleEn,
        item.course.slug,
      ]),
    ]
      .filter(Boolean)
      .join(" "),
    content: (
      <PackAdminPanel pack={pack} courses={courses} canManage={canManage} />
    ),
  }));

  return (
    <main className="page-frame relative min-h-dvh overflow-hidden px-3 py-6 text-primary sm:px-4 sm:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[8%] top-10 h-56 w-56 rounded-full bg-cyan-400/12 blur-3xl" />
        <div className="absolute right-[7%] top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-amber-300/8 blur-3xl" />
      </div>

      <section className="container relative grid gap-6">
        {/* Header */}
        <div className="gradient-border rounded-[2rem]">
          <div className="elevated-panel p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
              >
                <ArrowLeft className="size-4" /> Back to admin workspace
              </Link>
              <Link
                href={`/${rawLocale}/courses`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted transition hover:border-accent/40 hover:text-accent"
              >
                View public courses <ArrowUpRight className="size-3.5" />
              </Link>
            </div>

            <div className="mt-6 flex items-start gap-4">
              <span className="hidden size-12 shrink-0 place-items-center rounded-2xl bg-accent/12 text-accent sm:grid">
                <GraduationCap className="size-6" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  teChia Digital Academy
                </p>
                <h1 className="mt-2 text-balance text-4xl font-semibold leading-tight sm:text-5xl">
                  Academy catalog &amp; orders
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
                  Add new courses, curate packs, set prices in XAF, USD, CAD, or EUR, upload cover
                  images, and record each course&rsquo;s structure — modules, lessons, and paths.
                  Prices are stored in integer minor units (XAF has 0 decimals). Only{" "}
                  <strong className="text-primary">PUBLISHED</strong> courses appear on the public
                  courses page.
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard icon={BookOpen} label="Courses" value={courses.length} detail={`${publishedCount} published`} />
              <StatCard icon={Package} label="Packs" value={packs.length} detail={`${packCourseCount} courses bundled`} />
              <StatCard icon={Video} label="Previews live" value={previewCount} detail={`${courses.length - previewCount} courses without a live preview`} />
              <StatCard icon={Receipt} label="Recent orders" value={orders.length} detail="Latest 50 orders" />
              <StatCard
                icon={BadgeCheck}
                label="Open requires review"
                value={orders.filter((order) => order.status === "REQUIRES_REVIEW").length}
                detail="Orders needing manual review"
              />
            </div>

            <nav aria-label="Section shortcuts" className="mt-6 flex flex-wrap gap-2">
              {canManage ? (
                <a href="#payments" className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted transition hover:border-accent/40 hover:text-accent">Payment methods</a>
              ) : null}
              <a href="#catalog" className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted transition hover:border-accent/40 hover:text-accent">Catalog</a>
              <a href="#orders" className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted transition hover:border-accent/40 hover:text-accent">Orders</a>
            </nav>
          </div>
        </div>

        {!canManage ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            You have read-only access to academy orders. Catalog editing requires the
            academy catalog manage permission.
          </div>
        ) : null}

        {/* Payment methods */}
        {canManage ? (
          <section className="grid gap-4">
            <SectionHeader
              id="payments"
              icon={Wallet}
              title="Payment methods"
              hint="Choose which providers buyers can pay with. API keys stay in environment variables — these switches only control what is shown at checkout."
            />
            <div className="gradient-border rounded-[1.5rem]">
              <div className="elevated-panel p-5 sm:p-6">
                <AcademyActionForm
                  action={updatePaymentProviders}
                  submitLabel="Save payment methods"
                  pendingLabel="Saving…"
                  helper="Hidden providers disappear from the storefront buttons and the checkout page immediately after saving."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
                      <input
                        type="checkbox"
                        name="chariowEnabled"
                        defaultChecked={paymentSettings.chariowEnabled}
                        className="mt-0.5 size-4 accent-cyan-400"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-primary">Chariow</span>
                        <span className="mt-1 block text-xs text-muted">
                          Hosted checkout for cards and mobile money. Also delivers course files
                          and buyer bonuses after payment — keep it enabled for orders to complete.
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
                      <input
                        type="checkbox"
                        name="monerooEnabled"
                        defaultChecked={paymentSettings.monerooEnabled}
                        className="mt-0.5 size-4 accent-cyan-400"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-primary">Moneroo</span>
                        <span className="mt-1 block text-xs text-muted">
                          Mobile money and card checkout for FCFA buyers. Hide it while payment
                          methods are still being configured in the Moneroo dashboard.
                        </span>
                      </span>
                    </label>
                  </div>
                </AcademyActionForm>
              </div>
            </div>
          </section>
        ) : null}

        {/* Catalog */}
        <section id="catalog" className="grid scroll-mt-24 gap-4">
          <SectionHeader
            id="catalog-heading"
            icon={Layers}
            title="Catalog"
            count={courses.length + packs.length}
            hint="Switch between courses and packs. Search, filter by status, and sort as the catalog grows. Expand any item to edit every field."
          />
          <AcademyCatalogBrowser
            courses={courseItems}
            packs={packItems}
            coursesActions={
              canManage ? <CourseCreatePanel categories={categories} /> : null
            }
            packsActions={
              canManage ? <PackCreatePanel courses={courses} /> : null
            }
          />
        </section>

        {/* Orders */}
        <section className="grid gap-4">
          <SectionHeader id="orders" icon={Receipt} title="Recent orders" count={orders.length} hint="The latest 50 orders with their payment provider and items." />
          <div className="overflow-x-auto rounded-[1.5rem] border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface/70 text-[11px] uppercase tracking-[0.14em] text-muted">
                <tr>
                  <th className="px-4 py-3.5">Reference</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Total</th>
                  <th className="px-4 py-3.5">Provider</th>
                  <th className="px-4 py-3.5">Items</th>
                  <th className="px-4 py-3.5">Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-border/70 align-top">
                    <td className="px-4 py-3.5 font-mono text-xs text-muted">{order.reference}</td>
                    <td className="px-4 py-3.5"><StatusPill value={order.status} /></td>
                    <td className="px-4 py-3.5">
                      {order.customerName}
                      <div className="text-xs text-muted">{order.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold">{formatMoney(order.totalMinor, order.currency, "en")}</td>
                    <td className="px-4 py-3.5 text-muted">{order.provider || "—"}</td>
                    <td className="max-w-xs px-4 py-3.5 text-muted">{order.items.map((item) => item.titleSnapshot).join(", ")}</td>
                    <td className="px-4 py-3.5 text-xs text-muted">{order.createdAt.toISOString().slice(0, 19).replace("T", " ")}</td>
                  </tr>
                ))}
                {!orders.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted" colSpan={7}>No orders yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
