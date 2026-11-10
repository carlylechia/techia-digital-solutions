import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

export const dynamic = "force-dynamic";

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

async function updateCourse(formData: FormData) {
  "use server";
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth");
  const { hasPermission } = await import("@/lib/admin/permissions");
  const { getPrisma } = await import("@/lib/prisma");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !hasPermission(session.user.permissions, "academy.catalog.manage")) {
    throw new Error("Unauthorized");
  }
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing id");
  const price = String(formData.get("priceMinor") || "").trim();
  const compareAt = String(formData.get("compareAtPriceMinor") || "").trim();
  const status = String(formData.get("status") || "PUBLISHED");
  await prisma.academyCourse.update({
    where: { id },
    data: {
      titleEn: String(formData.get("titleEn") || "").trim() || undefined,
      shortDescriptionEn: String(formData.get("shortDescriptionEn") || "").trim() || undefined,
      descriptionEn: String(formData.get("descriptionEn") || "").trim() || undefined,
      seoTitleEn: String(formData.get("seoTitleEn") || "").trim() || null,
      seoDescriptionEn: String(formData.get("seoDescriptionEn") || "").trim() || null,
      priceMinor: price ? Number.parseInt(price, 10) : null,
      compareAtPriceMinor: compareAt ? Number.parseInt(compareAt, 10) : null,
      currency: String(formData.get("currency") || "XAF").trim().toUpperCase() || "XAF",
      chariowProductId: String(formData.get("chariowProductId") || "").trim() || null,
      imageUrl: String(formData.get("imageUrl") || "").trim() || null,
      status: status === "DRAFT" || status === "ARCHIVED" ? status : "PUBLISHED",
    },
  });
  revalidatePath("/[locale]/admin/academy", "page");
  revalidatePath("/[locale]/courses", "page");
  revalidatePath("/[locale]/courses/[slug]", "page");
}

async function updatePack(formData: FormData) {
  "use server";
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth");
  const { hasPermission } = await import("@/lib/admin/permissions");
  const { getPrisma } = await import("@/lib/prisma");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !hasPermission(session.user.permissions, "academy.catalog.manage")) {
    throw new Error("Unauthorized");
  }
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing id");
  const price = String(formData.get("priceMinor") || "").trim();
  const compareAt = String(formData.get("compareAtPriceMinor") || "").trim();
  const status = String(formData.get("status") || "PUBLISHED");
  await prisma.academyCoursePack.update({
    where: { id },
    data: {
      titleEn: String(formData.get("titleEn") || "").trim() || undefined,
      summaryEn: String(formData.get("summaryEn") || "").trim() || undefined,
      descriptionEn: String(formData.get("descriptionEn") || "").trim() || undefined,
      seoTitleEn: String(formData.get("seoTitleEn") || "").trim() || null,
      seoDescriptionEn: String(formData.get("seoDescriptionEn") || "").trim() || null,
      priceMinor: price ? Number.parseInt(price, 10) : null,
      compareAtPriceMinor: compareAt ? Number.parseInt(compareAt, 10) : null,
      currency: String(formData.get("currency") || "XAF").trim().toUpperCase() || "XAF",
      chariowProductId: String(formData.get("chariowProductId") || "").trim() || null,
      status: status === "DRAFT" || status === "ARCHIVED" ? status : "PUBLISHED",
    },
  });
  revalidatePath("/[locale]/admin/academy", "page");
  revalidatePath("/[locale]/courses", "page");
  revalidatePath("/[locale]/courses/[slug]", "page");
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

  const { courses, packs, orders } = await loadAdminAcademyCatalog(prisma);
  const canManage = hasPermission(session.user.permissions, "academy.catalog.manage");

  return (
    <main className="page-frame min-h-dvh px-3 py-6 text-primary sm:px-4 sm:py-10">
      <section className="container grid gap-8">
        <div className="gradient-border rounded-[2rem]">
          <div className="elevated-panel p-6 sm:p-8">
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline">
              <ArrowLeft className="size-4" /> Back to admin workspace
            </Link>
            <h1 className="mt-5 text-4xl font-semibold">Academy catalog & orders</h1>
            <p className="mt-3 max-w-3xl text-muted">
              Manage published courses and packs, configure prices and Chariow product mappings, and review payment orders. Prices are stored in integer minor units (XAF has 0 decimals).
            </p>
          </div>
        </div>

        <section className="grid gap-4">
          <h2 className="text-2xl font-semibold">Courses ({courses.length})</h2>
          <div className="grid gap-4">
            {courses.map((course) => (
              <details key={course.id} className="gradient-border rounded-[1.5rem]">
                <summary className="elevated-panel cursor-pointer list-none p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted">{course.slug}</p>
                      <p className="text-lg font-semibold">{course.titleEn}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="trust-pill">{course.status}</span>
                      <span className="trust-pill">{course.currency} {course.priceMinor ?? "—"}</span>
                      <span className="trust-pill">{course._count.lessons} lessons</span>
                    </div>
                  </div>
                </summary>
                {canManage ? (
                  <form action={updateCourse} className="elevated-panel grid gap-4 border-t border-border p-5">
                    <input type="hidden" name="id" value={course.id} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2 text-sm">Title (EN)<input name="titleEn" defaultValue={course.titleEn} className="rounded-xl border border-border bg-background px-3 py-2" /></label>
                      <label className="grid gap-2 text-sm">Status
                        <select name="status" defaultValue={course.status} className="rounded-xl border border-border bg-background px-3 py-2">
                          <option value="PUBLISHED">PUBLISHED</option>
                          <option value="DRAFT">DRAFT</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                        </select>
                      </label>
                    </div>
                    <label className="grid gap-2 text-sm">Short description (EN)<textarea name="shortDescriptionEn" defaultValue={course.shortDescriptionEn} className="rounded-xl border border-border bg-background px-3 py-2" rows={2} /></label>
                    <label className="grid gap-2 text-sm">Description (EN)<textarea name="descriptionEn" defaultValue={course.descriptionEn} className="rounded-xl border border-border bg-background px-3 py-2" rows={4} /></label>
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="grid gap-2 text-sm">Price (minor)<input name="priceMinor" type="number" defaultValue={course.priceMinor ?? ""} className="rounded-xl border border-border bg-background px-3 py-2" /></label>
                      <label className="grid gap-2 text-sm">Compare-at (minor)<input name="compareAtPriceMinor" type="number" defaultValue={course.compareAtPriceMinor ?? ""} className="rounded-xl border border-border bg-background px-3 py-2" /></label>
                      <label className="grid gap-2 text-sm">Currency<input name="currency" defaultValue={course.currency} className="rounded-xl border border-border bg-background px-3 py-2" /></label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2 text-sm">Chariow product ID<input name="chariowProductId" defaultValue={course.chariowProductId ?? ""} className="rounded-xl border border-border bg-background px-3 py-2" /></label>
                      <label className="grid gap-2 text-sm">Image URL<input name="imageUrl" defaultValue={course.imageUrl ?? ""} className="rounded-xl border border-border bg-background px-3 py-2" /></label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2 text-sm">SEO title (EN)<input name="seoTitleEn" defaultValue={course.seoTitleEn ?? ""} className="rounded-xl border border-border bg-background px-3 py-2" /></label>
                      <label className="grid gap-2 text-sm">SEO description (EN)<input name="seoDescriptionEn" defaultValue={course.seoDescriptionEn ?? ""} className="rounded-xl border border-border bg-background px-3 py-2" /></label>
                    </div>
                    <button type="submit" className="btn-primary w-fit px-5 py-2.5">Save course</button>
                  </form>
                ) : null}
              </details>
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-2xl font-semibold">Packs ({packs.length})</h2>
          <div className="grid gap-4">
            {packs.map((pack) => (
              <details key={pack.id} className="gradient-border rounded-[1.5rem]">
                <summary className="elevated-panel cursor-pointer list-none p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted">{pack.slug}</p>
                      <p className="text-lg font-semibold">{pack.titleEn}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="trust-pill">{pack.status}</span>
                      <span className="trust-pill">{pack.currency} {pack.priceMinor ?? "—"}</span>
                      <span className="trust-pill">{pack._count.items} courses</span>
                    </div>
                  </div>
                </summary>
                {canManage ? (
                  <form action={updatePack} className="elevated-panel grid gap-4 border-t border-border p-5">
                    <input type="hidden" name="id" value={pack.id} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2 text-sm">Title (EN)<input name="titleEn" defaultValue={pack.titleEn} className="rounded-xl border border-border bg-background px-3 py-2" /></label>
                      <label className="grid gap-2 text-sm">Status
                        <select name="status" defaultValue={pack.status} className="rounded-xl border border-border bg-background px-3 py-2">
                          <option value="PUBLISHED">PUBLISHED</option>
                          <option value="DRAFT">DRAFT</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                        </select>
                      </label>
                    </div>
                    <label className="grid gap-2 text-sm">Summary (EN)<textarea name="summaryEn" defaultValue={pack.summaryEn} className="rounded-xl border border-border bg-background px-3 py-2" rows={2} /></label>
                    <label className="grid gap-2 text-sm">Description (EN)<textarea name="descriptionEn" defaultValue={pack.descriptionEn} className="rounded-xl border border-border bg-background px-3 py-2" rows={4} /></label>
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="grid gap-2 text-sm">Price (minor)<input name="priceMinor" type="number" defaultValue={pack.priceMinor ?? ""} className="rounded-xl border border-border bg-background px-3 py-2" /></label>
                      <label className="grid gap-2 text-sm">Compare-at (minor)<input name="compareAtPriceMinor" type="number" defaultValue={pack.compareAtPriceMinor ?? ""} className="rounded-xl border border-border bg-background px-3 py-2" /></label>
                      <label className="grid gap-2 text-sm">Currency<input name="currency" defaultValue={pack.currency} className="rounded-xl border border-border bg-background px-3 py-2" /></label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2 text-sm">Chariow product ID<input name="chariowProductId" defaultValue={pack.chariowProductId ?? ""} className="rounded-xl border border-border bg-background px-3 py-2" /></label>
                      <label className="grid gap-2 text-sm">SEO title (EN)<input name="seoTitleEn" defaultValue={pack.seoTitleEn ?? ""} className="rounded-xl border border-border bg-background px-3 py-2" /></label>
                    </div>
                    <label className="grid gap-2 text-sm">SEO description (EN)<input name="seoDescriptionEn" defaultValue={pack.seoDescriptionEn ?? ""} className="rounded-xl border border-border bg-background px-3 py-2" /></label>
                    <button type="submit" className="btn-primary w-fit px-5 py-2.5">Save pack</button>
                  </form>
                ) : null}
              </details>
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-2xl font-semibold">Recent orders ({orders.length})</h2>
          <div className="overflow-x-auto rounded-[1.5rem] border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface text-muted">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-border">
                    <td className="px-4 py-3 font-mono text-xs">{order.reference}</td>
                    <td className="px-4 py-3">{order.status}</td>
                    <td className="px-4 py-3">{order.customerName}<div className="text-xs text-muted">{order.customerEmail}</div></td>
                    <td className="px-4 py-3">{formatMoney(order.totalMinor, order.currency, "en")}</td>
                    <td className="px-4 py-3">{order.provider || "—"}</td>
                    <td className="px-4 py-3">{order.items.map((i) => i.titleSnapshot).join(", ")}</td>
                    <td className="px-4 py-3">{order.createdAt.toISOString().slice(0, 19).replace("T", " ")}</td>
                  </tr>
                ))}
                {!orders.length ? (
                  <tr><td className="px-4 py-6 text-muted" colSpan={7}>No orders yet.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
