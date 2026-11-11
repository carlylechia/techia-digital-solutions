import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  GraduationCap,
  Layers,
  Package,
  Receipt,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isLocale } from "@/content/site";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/admin/permissions";
import { createMetadata } from "@/lib/seo";
import { loadAdminAcademyCatalog } from "@/lib/admin/academy";
import { formatMoney } from "@/lib/payments/money";
import { AcademyImageField } from "@/components/courses/AcademyImageField";
import { AcademyActionForm, type AcademyActionState } from "@/components/courses/AcademyActionForm";

export const dynamic = "force-dynamic";

const CURRENCY_OPTIONS = ["XAF", "USD", "CAD", "EUR"] as const;
type CurrencyOption = (typeof CURRENCY_OPTIONS)[number];

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition placeholder:text-muted/70 focus:border-accent/60 focus:ring-2 focus:ring-accent/25";
const labelClass =
  "grid gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted";
const hintClass = "text-xs font-medium normal-case tracking-normal text-muted";

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
  if (message.startsWith("Title, short description") || message.startsWith("A valid slug")) {
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
    const status = String(formData.get("status") || "PUBLISHED");
    const updated = await prisma.academyCoursePack.update({
      where: { id },
      data: {
        titleEn: String(formData.get("titleEn") || "").trim() || undefined,
        summaryEn: String(formData.get("summaryEn") || "").trim() || undefined,
        descriptionEn: String(formData.get("descriptionEn") || "").trim() || undefined,
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
      message: `Pack saved. “${updated.titleEn}” is ${updated.status === "PUBLISHED" ? "live on the storefront" : "not visible to the public (" + updated.status.toLowerCase() + ")"}.`,
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

function MetaPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted">
      {children}
    </span>
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
  const publishedCount = courses.filter((course) => course.status === "PUBLISHED").length;
  const packCourseCount = new Set(packs.flatMap((pack) => pack.items.map((item) => item.courseId))).size;

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

            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={BookOpen} label="Courses" value={courses.length} detail={`${publishedCount} published`} />
              <StatCard icon={Package} label="Packs" value={packs.length} detail={`${packCourseCount} courses bundled`} />
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
                <a href="#create-course" className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted transition hover:border-accent/40 hover:text-accent">
                  + Add course
                </a>
              ) : null}
              <a href="#courses" className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted transition hover:border-accent/40 hover:text-accent">Courses</a>
              <a href="#packs" className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted transition hover:border-accent/40 hover:text-accent">Packs</a>
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

        {/* Create course */}
        {canManage ? (
          <section className="grid gap-4">
            <SectionHeader id="create-course" icon={GraduationCap} title="Add a new course" hint="Created courses land in the list below; publish them to appear on the storefront." />
            <details className="gradient-border rounded-[1.5rem] scroll-mt-24" open>
              <summary className="elevated-panel flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5">
                <span className="flex items-center gap-2.5 text-sm font-semibold text-primary">
                  <Layers className="size-4 text-accent" /> Course creation form
                </span>
                <span className="text-xs text-muted">Required: title, short description, description</span>
              </summary>
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
                      <span className={hintClass}>Leave blank until a price is decided</span>
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
            </details>
          </section>
        ) : null}

        {/* Courses */}
        <section className="grid gap-4">
          <SectionHeader id="courses" icon={BookOpen} title="Courses" count={courses.length} hint="Expand a course to edit its content, structure, pricing, and cover image." />
          <div className="grid gap-4">
            {courses.map((course) => (
              <details key={course.id} className="gradient-border rounded-[1.5rem] scroll-mt-24">
                <summary className="elevated-panel cursor-pointer list-none p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold tracking-wide text-muted">/{course.slug}</p>
                      <p className="mt-0.5 truncate text-lg font-semibold text-primary">{course.titleEn}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill value={course.status} />
                      <MetaPill>{course.currency} {course.priceMinor ?? "—"}</MetaPill>
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
              </details>
            ))}
            {!courses.length ? (
              <p className="rounded-2xl border border-dashed border-border bg-surface p-5 text-sm text-muted">No courses yet.</p>
            ) : null}
          </div>
        </section>

        {/* Packs */}
        <section className="grid gap-4">
          <SectionHeader id="packs" icon={Package} title="Packs" count={packs.length} hint="Bundles of courses sold as one product. Bonuses apply to pack purchases." />
          <div className="grid gap-4">
            {packs.map((pack) => (
              <details key={pack.id} className="gradient-border rounded-[1.5rem] scroll-mt-24">
                <summary className="elevated-panel cursor-pointer list-none p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold tracking-wide text-muted">/{pack.slug}</p>
                      <p className="mt-0.5 truncate text-lg font-semibold text-primary">{pack.titleEn}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill value={pack.status} />
                      <MetaPill>{pack.currency} {pack.priceMinor ?? "—"}</MetaPill>
                      <MetaPill>{pack._count.items} courses</MetaPill>
                    </div>
                  </div>
                </summary>
                {canManage ? (
                  <AcademyActionForm
                    action={updatePack}
                    submitLabel="Save pack"
                    helper={`Included courses: ${pack.items.map((item) => item.course.titleEn).join(", ") || "—"}`}
                  >
                    <input type="hidden" name="id" value={pack.id} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className={labelClass}>
                        Title (EN)
                        <input name="titleEn" defaultValue={pack.titleEn} className={inputClass} />
                      </label>
                      <label className={labelClass}>
                        Status
                        <select name="status" defaultValue={pack.status} className={inputClass}>
                          <option value="PUBLISHED">Published</option>
                          <option value="DRAFT">Draft</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                      </label>
                    </div>
                    <label className={labelClass}>
                      Summary (EN)
                      <textarea name="summaryEn" defaultValue={pack.summaryEn} rows={2} className={inputClass} />
                    </label>
                    <label className={labelClass}>
                      Description (EN)
                      <textarea name="descriptionEn" defaultValue={pack.descriptionEn} rows={4} className={inputClass} />
                    </label>
                    <div className="rounded-2xl border border-border bg-surface-strong/40 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Pricing &amp; delivery</p>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <label className={labelClass}>
                          Currency
                          <select name="currency" defaultValue={pack.currency} className={inputClass}>
                            {CURRENCY_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </label>
                        <label className={labelClass}>
                          Price (minor)
                          <input name="priceMinor" type="number" min={0} defaultValue={pack.priceMinor ?? ""} className={inputClass} />
                        </label>
                        <label className={labelClass}>
                          Compare-at (minor)
                          <input name="compareAtPriceMinor" type="number" min={0} defaultValue={pack.compareAtPriceMinor ?? ""} className={inputClass} />
                        </label>
                        <label className={labelClass}>
                          Chariow product ID
                          <input name="chariowProductId" defaultValue={pack.chariowProductId ?? ""} className={inputClass} />
                        </label>
                      </div>
                      <div className="mt-4">
                        <AcademyImageField name="imageUrl" defaultValue={pack.imageUrl ?? ""} label="Pack cover image" />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className={labelClass}>
                        SEO title (EN)
                        <input name="seoTitleEn" defaultValue={pack.seoTitleEn ?? ""} className={inputClass} />
                      </label>
                      <label className={labelClass}>
                        SEO description (EN)
                        <input name="seoDescriptionEn" defaultValue={pack.seoDescriptionEn ?? ""} className={inputClass} />
                      </label>
                    </div>
                  </AcademyActionForm>
                ) : (
                  <div className="elevated-panel border-t border-border p-5 text-sm text-muted">
                    Read-only view. Ask an administrator with catalog permissions to edit this pack.
                  </div>
                )}
              </details>
            ))}
          </div>
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
