"use server";

import type { LeadStatus, Prisma, PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ADMIN_PERMISSIONS, normalizePermissions } from "@/lib/admin/permissions";
import { requireAdmin, writeAuditLog } from "@/lib/admin/session";
import { getPrisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/sanitize";
import { hashPassword } from "@/lib/password";
import { sendPortalInviteEmail } from "@/lib/email";

const localeSchema = z.enum(["en", "fr"]);
const leadStatusSchema = z.enum(["NEW", "CONTACTED", "DISCOVERY_BOOKED", "PROPOSAL_SENT", "NEGOTIATING", "WON", "LOST", "FOLLOW_UP_LATER"]);
const clientStatusSchema = z.enum(["PROSPECT", "ONBOARDING", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]);
const clientPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
const projectStatusSchema = z.enum(["PLANNED", "ACTIVE", "REVIEW", "ON_HOLD", "DELIVERED", "ARCHIVED"]);
const contentStatusSchema = z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]);
const processStatusSchema = z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]);
const feedbackStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "ARCHIVED"]);

const optionalText = z.string().trim().max(5000).optional().or(z.literal(""));
const shortText = z.string().trim().min(2).max(180);
const optionalEmail = z.string().trim().toLowerCase().email().max(180).optional().or(z.literal(""));
const optionalUrl = z.string().trim().url().max(500).optional().or(z.literal(""));
const optionalInt = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}, z.number().int().min(0).optional());
const optionalDate = z.preprocess((value) => {
  if (!value || typeof value !== "string") return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}, z.date().optional());
const optionalOrder = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}, z.number().int().min(0).max(9999));
const optionalStringArray = z.preprocess((value) => {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => sanitizeText(item))
    .filter(Boolean)
    .slice(0, 20);
}, z.array(z.string()));

const requestTypes = ["lead", "contact", "demo"] as const;

const updateRequestSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1),
  type: z.enum(requestTypes),
  status: leadStatusSchema,
  notes: optionalText
});

const createRoleSchema = z.object({
  locale: localeSchema,
  name: z.string().trim().min(2).max(60).regex(/^[a-z0-9_]+$/),
  label: shortText,
  description: optionalText,
  level: z.coerce.number().int().min(1).max(100),
  permissions: z.preprocess((value) => (Array.isArray(value) ? value : value ? [value] : []), z.array(z.enum(ADMIN_PERMISSIONS)))
});

const createAdminSchema = z.object({
  locale: localeSchema,
  name: shortText,
  email: z.string().trim().toLowerCase().email().max(180),
  password: z.string().min(10).max(200),
  roleId: z.string().min(1)
});

const createClientSchema = z.object({
  locale: localeSchema,
  name: shortText,
  industry: optionalText,
  status: clientStatusSchema,
  priority: clientPrioritySchema,
  contactName: optionalText,
  contactRole: optionalText,
  email: optionalEmail,
  phone: optionalText,
  website: optionalUrl,
  country: optionalText,
  city: optionalText,
  estimatedValue: optionalInt,
  tags: optionalText,
  notes: optionalText,
  ownerId: z.string().optional().or(z.literal(""))
});

const updateClientSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1),
  name: shortText,
  industry: optionalText,
  status: clientStatusSchema,
  priority: clientPrioritySchema,
  contactName: optionalText,
  contactRole: optionalText,
  email: optionalEmail,
  phone: optionalText,
  website: optionalUrl,
  country: optionalText,
  city: optionalText,
  estimatedValue: optionalInt,
  tags: optionalText,
  notes: optionalText,
  preferredLocale: z.enum(["en", "fr"]).default("en")
});

const updateProjectSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1),
  title: shortText,
  status: projectStatusSchema,
  priority: clientPrioritySchema,
  description: optionalText,
  budget: optionalInt,
  progress: z.coerce.number().int().min(0).max(100).default(0),
  startDate: optionalDate,
  dueDate: optionalDate,
  showInPortfolio: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()),
  showOnHomepage: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()),
  showInFounder: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()),
  publicOrder: optionalOrder.optional(),
  publicSlug: z.string().trim().max(120).optional().or(z.literal("")),
  publicTitleEn: optionalText.optional(),
  publicTitleFr: optionalText.optional(),
  publicEyebrowEn: optionalText.optional(),
  publicEyebrowFr: optionalText.optional(),
  publicDescriptionEn: optionalText.optional(),
  publicDescriptionFr: optionalText.optional(),
  publicProblemEn: optionalText.optional(),
  publicProblemFr: optionalText.optional(),
  publicSolutionEn: optionalText.optional(),
  publicSolutionFr: optionalText.optional(),
  publicRoleEn: optionalText.optional(),
  publicRoleFr: optionalText.optional(),
  publicBusinessValueEn: optionalText.optional(),
  publicBusinessValueFr: optionalText.optional(),
  publicTechStack: optionalStringArray.optional()
});

const createProjectSchema = z.object({
  locale: localeSchema,
  clientId: z.string().min(1),
  title: shortText,
  status: projectStatusSchema,
  priority: clientPrioritySchema,
  description: optionalText,
  budget: optionalInt,
  progress: z.coerce.number().int().min(0).max(100).default(0),
  startDate: optionalDate,
  dueDate: optionalDate,
  ownerId: z.string().optional().or(z.literal("")),
  showInPortfolio: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()),
  showOnHomepage: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()),
  showInFounder: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()),
  publicOrder: optionalOrder,
  publicSlug: z.string().trim().max(120).optional().or(z.literal("")),
  publicTitleEn: optionalText,
  publicTitleFr: optionalText,
  publicEyebrowEn: optionalText,
  publicEyebrowFr: optionalText,
  publicDescriptionEn: optionalText,
  publicDescriptionFr: optionalText,
  publicProblemEn: optionalText,
  publicProblemFr: optionalText,
  publicSolutionEn: optionalText,
  publicSolutionFr: optionalText,
  publicRoleEn: optionalText,
  publicRoleFr: optionalText,
  publicBusinessValueEn: optionalText,
  publicBusinessValueFr: optionalText,
  publicTechStack: optionalStringArray
});

const updateFeedbackSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1),
  status: feedbackStatusSchema,
  showOnHomepage: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()),
  showOnFounder: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()),
  showOnPortfolio: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()),
  displayOrder: optionalOrder,
  internalNotes: optionalText
});

const createContentPageSchema = z.object({
  locale: localeSchema,
  slug: z.string().trim().min(2).max(120).optional().or(z.literal("")),
  type: z.string().trim().min(2).max(80),
  status: contentStatusSchema,
  seoTitle: optionalText,
  seoDescription: optionalText,
  translationLocale: localeSchema,
  title: shortText,
  excerpt: optionalText,
  body: z.string().trim().min(20).max(30_000)
});

const saveTranslationSchema = z.object({
  locale: localeSchema,
  pageId: z.string().min(1),
  translationLocale: localeSchema,
  title: shortText,
  excerpt: optionalText,
  body: z.string().trim().min(20).max(30_000),
  metaTitle: optionalText,
  metaDescription: optionalText
});

const createBoardSchema = z.object({
  locale: localeSchema,
  name: shortText,
  description: optionalText,
  status: processStatusSchema
});

const createTaskSchema = z.object({
  locale: localeSchema,
  boardId: z.string().min(1),
  columnId: z.string().optional().or(z.literal("")),
  title: shortText,
  description: optionalText,
  priority: clientPrioritySchema,
  dueDate: optionalDate,
  clientId: z.string().optional().or(z.literal("")),
  projectId: z.string().optional().or(z.literal("")),
  assigneeId: z.string().optional().or(z.literal("")),
  tags: optionalText
});

function formEntries(formData: FormData) {
  const entries: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
  for (const [key, value] of formData.entries()) {
    const existing = entries[key];
    if (existing) entries[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    else entries[key] = value;
  }
  return entries;
}

function clean(value: unknown) {
  return sanitizeText(value) || undefined;
}

function cleanLong(value: string) {
  return value.replace(/[<>]/g, "").replace(/javascript:/gi, "").trim().slice(0, 30_000);
}

function nullable(value: unknown) {
  return sanitizeText(value) || null;
}

function splitTags(value: string | undefined) {
  return (value || "")
    .split(",")
    .map((tag) => sanitizeText(tag).toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return slug || "item";
}

async function uniqueClientSlug(prisma: PrismaClient, name: string) {
  const base = slugify(name);
  let slug = base;
  for (let index = 2; index < 100; index += 1) {
    const existing = await prisma.client.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) return slug;
    slug = `${base}-${index}`;
  }
  return `${base}-${Date.now()}`;
}

async function findDuplicateClient(prisma: PrismaClient, name: string, email?: string | null) {
  const conditions: { name?: { equals: string; mode: "insensitive" }; email?: { equals: string; mode: "insensitive" } }[] = [
    { name: { equals: name, mode: "insensitive" } }
  ];
  if (email) conditions.push({ email: { equals: email, mode: "insensitive" } });
  return prisma.client.findFirst({ where: { OR: conditions }, select: { id: true, name: true } });
}

async function uniqueProjectSlug(prisma: PrismaClient, clientId: string, title: string) {
  const base = slugify(title);
  let slug = base;
  for (let index = 2; index < 100; index += 1) {
    const existing = await prisma.clientProject.findUnique({ where: { clientId_slug: { clientId, slug } }, select: { id: true } });
    if (!existing) return slug;
    slug = `${base}-${index}`;
  }
  return `${base}-${Date.now()}`;
}

async function uniqueContentSlug(prisma: PrismaClient, value: string) {
  const base = slugify(value);
  let slug = base;
  for (let index = 2; index < 100; index += 1) {
    const existing = await prisma.contentPage.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) return slug;
    slug = `${base}-${index}`;
  }
  return `${base}-${Date.now()}`;
}

function revalidateAdmin(locale: "en" | "fr") {
  revalidatePath(`/${locale}/admin`);
}

function revalidatePublicShowcase() {
  for (const locale of ["en", "fr"] as const) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/portfolio`);
    revalidatePath(`/${locale}/founder`);
  }
}

function requireDatabase() {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");
  return prisma;
}

export async function updateRequestStatusAction(formData: FormData) {
  const actor = await requireAdmin("requests.manage");
  const prisma = requireDatabase();
  const data = updateRequestSchema.parse(formEntries(formData));
  const update = { status: data.status as LeadStatus, notes: nullable(data.notes) };

  if (data.type === "lead") await prisma.lead.update({ where: { id: data.id }, data: update });
  if (data.type === "contact") await prisma.contactMessage.update({ where: { id: data.id }, data: update });
  if (data.type === "demo") await prisma.demoRequest.update({ where: { id: data.id }, data: update });

  await writeAuditLog({ actorId: actor.id, action: "request.status_updated", entityType: data.type, entityId: data.id, metadata: { status: data.status } });
  revalidateAdmin(data.locale);
}

export async function createRoleAction(formData: FormData) {
  const actor = await requireAdmin("roles.manage");
  const prisma = requireDatabase();
  const data = createRoleSchema.parse(formEntries(formData));

  if (actor.roleLevel < 100 && data.level >= actor.roleLevel) throw new Error("Admins can only create subordinate roles.");

  const role = await prisma.adminRole.create({
    data: {
      name: data.name,
      label: sanitizeText(data.label),
      description: nullable(data.description),
      level: data.level,
      permissions: normalizePermissions(data.permissions),
      createdById: actor.id
    }
  });

  await writeAuditLog({ actorId: actor.id, action: "role.created", entityType: "AdminRole", entityId: role.id, metadata: { name: role.name, level: role.level } });
  revalidateAdmin(data.locale);
}

export async function createAdminAction(formData: FormData) {
  const actor = await requireAdmin("admins.manage");
  const prisma = requireDatabase();
  const data = createAdminSchema.parse(formEntries(formData));
  const role = await prisma.adminRole.findUniqueOrThrow({ where: { id: data.roleId } });

  if (actor.roleLevel < 100 && role.level >= actor.roleLevel) throw new Error("Admins can only assign subordinate roles.");

  const admin = await prisma.adminUser.create({
    data: {
      name: sanitizeText(data.name),
      email: data.email,
      passwordHash: await hashPassword(data.password),
      role: role.name,
      roleId: role.id,
      status: "ACTIVE",
      createdById: actor.id
    }
  });

  await writeAuditLog({ actorId: actor.id, action: "admin.created", entityType: "AdminUser", entityId: admin.id, metadata: { role: role.name } });
  revalidateAdmin(data.locale);
}

const adminStatusSchema = z.enum(["ACTIVE", "INVITED", "DISABLED"]);

const updateAdminSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1),
  name: shortText,
  email: z.string().trim().toLowerCase().email().max(180),
  roleId: z.string().min(1),
  status: adminStatusSchema
});

const deleteAdminSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1)
});

const updateRoleSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1),
  label: shortText,
  description: optionalText,
  level: z.coerce.number().int().min(1).max(100),
  permissions: z.preprocess(
    (value) => (Array.isArray(value) ? value : value ? [value] : []),
    z.array(z.enum(ADMIN_PERMISSIONS))
  )
});

const deleteRoleSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1)
});

export async function updateAdminAction(formData: FormData) {
  const actor = await requireAdmin("admins.manage");
  const prisma = requireDatabase();
  const data = updateAdminSchema.parse(formEntries(formData));

  if (data.id === actor.id && data.status === "DISABLED") throw new Error("Cannot disable your own account.");

  const target = await prisma.adminUser.findUniqueOrThrow({ where: { id: data.id }, include: { roleRef: true } });
  const targetLevel = target.roleRef?.level ?? 50;

  if (actor.roleLevel < 100 && targetLevel >= actor.roleLevel) throw new Error("Cannot edit an admin with equal or higher role level.");

  const role = await prisma.adminRole.findUniqueOrThrow({ where: { id: data.roleId } });
  if (actor.roleLevel < 100 && role.level >= actor.roleLevel) throw new Error("Cannot assign a role with equal or higher level.");

  await prisma.adminUser.update({
    where: { id: data.id },
    data: {
      name: sanitizeText(data.name),
      email: data.email,
      role: role.name,
      roleId: role.id,
      status: data.status
    }
  });

  await writeAuditLog({ actorId: actor.id, action: "admin.updated", entityType: "AdminUser", entityId: data.id, metadata: { role: role.name, status: data.status } });
  revalidateAdmin(data.locale);
}

export async function deleteAdminAction(formData: FormData) {
  const actor = await requireAdmin("admins.manage");
  const prisma = requireDatabase();
  const data = deleteAdminSchema.parse(formEntries(formData));

  if (data.id === actor.id) throw new Error("Cannot delete your own account.");

  const target = await prisma.adminUser.findUniqueOrThrow({ where: { id: data.id }, include: { roleRef: true } });
  const targetLevel = target.roleRef?.level ?? 50;

  if (actor.roleLevel < 100 && targetLevel >= actor.roleLevel) throw new Error("Cannot delete an admin with equal or higher role level.");

  await prisma.adminUser.delete({ where: { id: data.id } });

  await writeAuditLog({ actorId: actor.id, action: "admin.deleted", entityType: "AdminUser", entityId: data.id, metadata: { email: target.email } });
  revalidateAdmin(data.locale);
}

export async function updateRoleAction(formData: FormData) {
  const actor = await requireAdmin("roles.manage");
  const prisma = requireDatabase();
  const data = updateRoleSchema.parse(formEntries(formData));

  const target = await prisma.adminRole.findUniqueOrThrow({ where: { id: data.id } });

  if (actor.roleLevel < 100 && target.level >= actor.roleLevel) throw new Error("Cannot edit a role with equal or higher level.");
  if (actor.roleLevel < 100 && data.level >= actor.roleLevel) throw new Error("Cannot set role level equal to or higher than your own.");

  const role = await prisma.adminRole.update({
    where: { id: data.id },
    data: {
      label: sanitizeText(data.label),
      description: nullable(data.description),
      level: data.level,
      permissions: normalizePermissions(data.permissions)
    }
  });

  // Keep denormalized role name on users in sync
  await prisma.adminUser.updateMany({ where: { roleId: data.id }, data: { role: role.name } });

  await writeAuditLog({ actorId: actor.id, action: "role.updated", entityType: "AdminRole", entityId: data.id, metadata: { name: role.name, level: role.level } });
  revalidateAdmin(data.locale);
}

export async function deleteRoleAction(formData: FormData) {
  const actor = await requireAdmin("roles.manage");
  const prisma = requireDatabase();
  const data = deleteRoleSchema.parse(formEntries(formData));

  const target = await prisma.adminRole.findUniqueOrThrow({ where: { id: data.id }, include: { _count: { select: { users: true } } } });

  if (actor.roleLevel < 100 && target.level >= actor.roleLevel) throw new Error("Cannot delete a role with equal or higher level.");
  if (target._count.users > 0) throw new Error(`Cannot delete "${target.label}": ${target._count.users} user(s) assigned. Reassign them first.`);

  await prisma.adminRole.delete({ where: { id: data.id } });

  await writeAuditLog({ actorId: actor.id, action: "role.deleted", entityType: "AdminRole", entityId: data.id, metadata: { name: target.name } });
  revalidateAdmin(data.locale);
}

export async function createClientAction(formData: FormData) {
  const actor = await requireAdmin("clients.manage");
  const prisma = requireDatabase();
  const data = createClientSchema.parse(formEntries(formData));

  const duplicate = await findDuplicateClient(prisma, data.name, data.email || null);
  if (duplicate) throw new Error(`A client named "${duplicate.name}" already exists.`);

  const slug = await uniqueClientSlug(prisma, data.name);

  const client = await prisma.client.create({
    data: {
      name: sanitizeText(data.name),
      slug,
      industry: nullable(data.industry),
      status: data.status,
      priority: data.priority,
      contactName: nullable(data.contactName),
      contactRole: nullable(data.contactRole),
      email: data.email || null,
      phone: nullable(data.phone),
      website: data.website || null,
      country: nullable(data.country),
      city: nullable(data.city),
      estimatedValue: data.estimatedValue,
      tags: splitTags(data.tags),
      notes: nullable(data.notes),
      ownerId: data.ownerId || actor.id
    }
  });

  if (data.contactName || data.email || data.phone) {
    await prisma.clientContact.create({
      data: {
        clientId: client.id,
        name: clean(data.contactName) || client.name,
        role: nullable(data.contactRole),
        email: data.email || null,
        phone: nullable(data.phone),
        isPrimary: true
      }
    });
  }

  await writeAuditLog({ actorId: actor.id, action: "client.created", entityType: "Client", entityId: client.id, metadata: { status: client.status, priority: client.priority } });
  revalidateAdmin(data.locale);
}

export async function createProjectAction(formData: FormData) {
  const actor = await requireAdmin("projects.manage");
  const prisma = requireDatabase();
  const data = createProjectSchema.parse(formEntries(formData));
  const slug = await uniqueProjectSlug(prisma, data.clientId, data.title);
  const computedProgress = data.status === "DELIVERED" ? 100 : data.progress;
  const completedAt = data.status === "DELIVERED" ? new Date() : null;

  const project = await prisma.clientProject.create({
    data: {
      clientId: data.clientId,
      ownerId: data.ownerId || actor.id,
      title: sanitizeText(data.title),
      slug,
      status: data.status,
      priority: data.priority,
      description: nullable(data.description),
      budget: data.budget,
      progress: computedProgress,
      startDate: data.startDate,
      dueDate: data.dueDate,
      completedAt,
    }
  });

  await writeAuditLog({ actorId: actor.id, action: "project.created", entityType: "ClientProject", entityId: project.id, metadata: { clientId: data.clientId, status: data.status } });
  revalidateAdmin(data.locale);
}

export async function createContentPageAction(formData: FormData) {
  const actor = await requireAdmin("content.manage");
  const prisma = requireDatabase();
  const data = createContentPageSchema.parse(formEntries(formData));
  const slug = await uniqueContentSlug(prisma, data.slug || data.title);

  const page = await prisma.contentPage.create({
    data: {
      slug,
      type: sanitizeText(data.type),
      status: data.status,
      seoTitle: nullable(data.seoTitle),
      seoDescription: nullable(data.seoDescription),
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      authorId: actor.id,
      translations: {
        create: {
          locale: data.translationLocale,
          title: sanitizeText(data.title),
          excerpt: nullable(data.excerpt),
          body: cleanLong(data.body),
          metaTitle: nullable(data.seoTitle),
          metaDescription: nullable(data.seoDescription)
        }
      }
    }
  });

  await writeAuditLog({ actorId: actor.id, action: "content_page.created", entityType: "ContentPage", entityId: page.id, metadata: { slug: page.slug, locale: data.translationLocale } });
  revalidateAdmin(data.locale);
}

export async function saveContentTranslationAction(formData: FormData) {
  const actor = await requireAdmin("content.manage");
  const prisma = requireDatabase();
  const data = saveTranslationSchema.parse(formEntries(formData));

  const translation = await prisma.contentTranslation.upsert({
    where: { pageId_locale: { pageId: data.pageId, locale: data.translationLocale } },
    update: {
      title: sanitizeText(data.title),
      excerpt: nullable(data.excerpt),
      body: cleanLong(data.body),
      metaTitle: nullable(data.metaTitle),
      metaDescription: nullable(data.metaDescription)
    },
    create: {
      pageId: data.pageId,
      locale: data.translationLocale,
      title: sanitizeText(data.title),
      excerpt: nullable(data.excerpt),
      body: cleanLong(data.body),
      metaTitle: nullable(data.metaTitle),
      metaDescription: nullable(data.metaDescription)
    }
  });

  await writeAuditLog({ actorId: actor.id, action: "content_translation.saved", entityType: "ContentTranslation", entityId: translation.id, metadata: { pageId: data.pageId, locale: data.translationLocale } });
  revalidateAdmin(data.locale);
}

export async function createBoardAction(formData: FormData) {
  const actor = await requireAdmin("processes.manage");
  const prisma = requireDatabase();
  const data = createBoardSchema.parse(formEntries(formData));
  const columns = [
    ["intake", "Intake", "#06b6d4"],
    ["scope", "Scoping", "#8b5cf6"],
    ["build", "Build", "#10b981"],
    ["review", "Review", "#f59e0b"],
    ["done", "Done", "#22c55e"]
  ] as const;

  const board = await prisma.processBoard.create({
    data: {
      name: sanitizeText(data.name),
      description: nullable(data.description),
      status: data.status,
      ownerId: actor.id,
      columns: {
        create: columns.map(([key, title, color], index) => ({ key, title, color, position: index }))
      }
    }
  });

  await writeAuditLog({ actorId: actor.id, action: "process_board.created", entityType: "ProcessBoard", entityId: board.id });
  revalidateAdmin(data.locale);
}

export async function createTaskAction(formData: FormData) {
  const actor = await requireAdmin("processes.manage");
  const prisma = requireDatabase();
  const data = createTaskSchema.parse(formEntries(formData));
  const requestedColumn = data.columnId ? await prisma.processColumn.findUnique({ where: { id: data.columnId } }) : null;
  if (requestedColumn && requestedColumn.boardId !== data.boardId) throw new Error("Column does not belong to this board.");
  const column = requestedColumn || (await prisma.processColumn.findFirst({ where: { boardId: data.boardId }, orderBy: { position: "asc" } }));
  if (!column) throw new Error("Board needs at least one column.");

  const lastTask = await prisma.processTask.findFirst({
    where: { columnId: column.id },
    orderBy: { position: "desc" },
    select: { position: true }
  });

  const task = await prisma.processTask.create({
    data: {
      boardId: data.boardId,
      columnId: column.id,
      title: sanitizeText(data.title),
      description: nullable(data.description),
      priority: data.priority,
      dueDate: data.dueDate,
      clientId: data.clientId || null,
      projectId: data.projectId || null,
      assigneeId: data.assigneeId || null,
      createdById: actor.id,
      tags: splitTags(data.tags),
      position: (lastTask?.position || 0) + 1000
    }
  });

  await writeAuditLog({ actorId: actor.id, action: "process_task.created", entityType: "ProcessTask", entityId: task.id, metadata: { boardId: data.boardId } });
  revalidateAdmin(data.locale);
}

// ── Nav item schemas ──────────────────────────────────────────────────────────

const createNavItemSchema = z.object({
  locale: localeSchema,
  labelEn: z.string().trim().min(1).max(60),
  labelFr: z.string().trim().min(1).max(60),
  href: z.string().trim().min(1).max(300),
  openNewTab: z.preprocess((v) => v === "true" || v === "on" || v === "1", z.boolean()).default(false)
});

const updateNavItemSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1),
  labelEn: z.string().trim().min(1).max(60),
  labelFr: z.string().trim().min(1).max(60),
  href: z.string().trim().min(1).max(300),
  // Checkboxes don't submit when unchecked — handle undefined explicitly without .default()
  visible: z.preprocess((v) => v !== undefined && v !== null && v !== "" && (v === "true" || v === "on" || v === "1" || v === true), z.boolean()),
  openNewTab: z.preprocess((v) => v !== undefined && (v === "true" || v === "on" || v === "1" || v === true), z.boolean())
});

const reorderNavItemsSchema = z.object({
  locale: localeSchema,
  order: z.string().min(1)
});

const deleteNavItemSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1)
});

export async function createNavItemAction(formData: FormData) {
  await requireAdmin("content.manage");
  const prisma = requireDatabase();
  const data = createNavItemSchema.parse(formEntries(formData));
  const lastItem = await prisma.navMenuItem.findFirst({ orderBy: { position: "desc" }, select: { position: true } });
  await prisma.navMenuItem.create({
    data: {
      labelEn: sanitizeText(data.labelEn),
      labelFr: sanitizeText(data.labelFr),
      href: data.href.startsWith("http") ? data.href : sanitizeText(data.href),
      visible: true,
      position: (lastItem?.position ?? -1) + 1,
      openNewTab: data.openNewTab
    }
  });
  revalidatePath("/");
  revalidateAdmin(data.locale);
}

export async function updateNavItemAction(formData: FormData) {
  await requireAdmin("content.manage");
  const prisma = requireDatabase();
  const data = updateNavItemSchema.parse(formEntries(formData));
  await prisma.navMenuItem.update({
    where: { id: data.id },
    data: {
      labelEn: sanitizeText(data.labelEn),
      labelFr: sanitizeText(data.labelFr),
      href: data.href.startsWith("http") ? data.href : sanitizeText(data.href),
      visible: data.visible,
      openNewTab: data.openNewTab
      // position is managed by reorderNavItemsAction (drag-to-reorder)
    }
  });
  revalidatePath("/");
  revalidateAdmin(data.locale);
}

export async function reorderNavItemsAction(formData: FormData) {
  await requireAdmin("content.manage");
  const prisma = requireDatabase();
  const data = reorderNavItemsSchema.parse(formEntries(formData));
  let ids: string[];
  try {
    const parsed = JSON.parse(data.order);
    if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === "string")) throw new Error();
    ids = parsed;
  } catch {
    throw new Error("Invalid order payload");
  }
  await prisma.$transaction(
    ids.map((id, index) => prisma.navMenuItem.update({ where: { id }, data: { position: index } }))
  );
  revalidatePath("/");
  revalidateAdmin(data.locale);
}

export async function deleteNavItemAction(formData: FormData) {
  await requireAdmin("content.manage");
  const prisma = requireDatabase();
  const data = deleteNavItemSchema.parse(formEntries(formData));
  await prisma.navMenuItem.delete({ where: { id: data.id } });
  revalidatePath("/");
  revalidateAdmin(data.locale);
}

// ── Page sections ─────────────────────────────────────────────────────────────

const updatePageSectionsSchema = z.object({
  locale: localeSchema,
  pageId: z.string().min(1),
  sections: z.string().max(200_000)
});

export async function updatePageSectionsAction(formData: FormData) {
  const actor = await requireAdmin("content.manage");
  const prisma = requireDatabase();
  const data = updatePageSectionsSchema.parse(formEntries(formData));

  let parsed: unknown;
  try {
    parsed = JSON.parse(data.sections);
  } catch {
    throw new Error("Invalid sections JSON");
  }
  if (!Array.isArray(parsed)) throw new Error("Sections must be an array");

  // Strip any script injection from string values recursively
  function sanitizeObj(obj: unknown): unknown {
    if (typeof obj === "string") return obj.replace(/[<>]/g, "").replace(/javascript:/gi, "").slice(0, 5000);
    if (Array.isArray(obj)) return obj.map(sanitizeObj);
    if (obj && typeof obj === "object") {
      return Object.fromEntries(Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, sanitizeObj(v)]));
    }
    return obj;
  }

  const safeSections = sanitizeObj(parsed) as Prisma.InputJsonValue;

  const page = await prisma.contentPage.findUniqueOrThrow({ where: { id: data.pageId }, select: { slug: true } });
  await prisma.contentPage.update({ where: { id: data.pageId }, data: { sections: safeSections } });

  await writeAuditLog({ actorId: actor.id, action: "content_page.sections_updated", entityType: "ContentPage", entityId: data.pageId, metadata: { slug: page.slug } });
  revalidatePath(`/en/${page.slug}`);
  revalidatePath(`/fr/${page.slug}`);
  revalidateAdmin(data.locale);
}

// ── Update page status ────────────────────────────────────────────────────────

const updatePageStatusSchema = z.object({
  locale: localeSchema,
  pageId: z.string().min(1),
  status: contentStatusSchema
});

export async function updatePageStatusAction(formData: FormData) {
  const actor = await requireAdmin("content.manage");
  const prisma = requireDatabase();
  const data = updatePageStatusSchema.parse(formEntries(formData));

  const page = await prisma.contentPage.update({
    where: { id: data.pageId },
    data: {
      status: data.status,
      publishedAt: data.status === "PUBLISHED" ? new Date() : undefined
    }
  });

  await writeAuditLog({ actorId: actor.id, action: "content_page.status_updated", entityType: "ContentPage", entityId: data.pageId, metadata: { slug: page.slug, status: data.status } });
  revalidatePath(`/en/${page.slug}`);
  revalidatePath(`/fr/${page.slug}`);
  revalidateAdmin(data.locale);
}

// ── Delete content page ───────────────────────────────────────────────────────

const deleteContentPageSchema = z.object({
  locale: localeSchema,
  pageId: z.string().min(1)
});

export async function deleteContentPageAction(formData: FormData) {
  const actor = await requireAdmin("content.manage");
  const prisma = requireDatabase();
  const data = deleteContentPageSchema.parse(formEntries(formData));

  const page = await prisma.contentPage.findUniqueOrThrow({
    where: { id: data.pageId },
    select: { slug: true }
  });

  await prisma.contentPage.delete({ where: { id: data.pageId } });

  await writeAuditLog({ actorId: actor.id, action: "content_page.deleted", entityType: "ContentPage", entityId: data.pageId, metadata: { slug: page.slug } });
  revalidatePath(`/en/${page.slug}`);
  revalidatePath(`/fr/${page.slug}`);
  revalidateAdmin(data.locale);
}

// ── Board management ──────────────────────────────────────────────────────────

const updateBoardSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1),
  name: shortText,
  description: optionalText,
  status: processStatusSchema,
  viewerRoles: z.preprocess((v) => (Array.isArray(v) ? v : v ? [v] : []), z.array(z.string().min(1).max(80)))
});

const deleteBoardSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1)
});

const createBoardColumnSchema = z.object({
  locale: localeSchema,
  boardId: z.string().min(1),
  title: shortText,
  color: z.string().trim().max(30).optional().or(z.literal(""))
});

const updateBoardColumnSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1),
  title: shortText,
  color: z.string().trim().max(30).optional().or(z.literal(""))
});

const deleteBoardColumnSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1)
});

export async function updateBoardAction(_prevState: unknown, formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdmin("processes.manage");
    const prisma = requireDatabase();
    const data = updateBoardSchema.parse(formEntries(formData));

    const board = await prisma.processBoard.update({
      where: { id: data.id },
      data: {
        name: sanitizeText(data.name),
        description: nullable(data.description),
        status: data.status,
        viewerRoles: data.viewerRoles.map((r) => sanitizeText(r)).filter(Boolean)
      }
    });

    await writeAuditLog({ actorId: actor.id, action: "process_board.updated", entityType: "ProcessBoard", entityId: board.id, metadata: { name: board.name, status: board.status } });
    revalidateAdmin(data.locale);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save board settings.";
    return { success: false, error: message };
  }
}

export async function deleteBoardAction(formData: FormData) {
  const actor = await requireAdmin("processes.manage");
  const prisma = requireDatabase();
  const data = deleteBoardSchema.parse(formEntries(formData));

  await prisma.processBoard.delete({ where: { id: data.id } });

  await writeAuditLog({ actorId: actor.id, action: "process_board.deleted", entityType: "ProcessBoard", entityId: data.id });
  revalidateAdmin(data.locale);
}

export async function createBoardColumnAction(formData: FormData) {
  const actor = await requireAdmin("processes.manage");
  const prisma = requireDatabase();
  const data = createBoardColumnSchema.parse(formEntries(formData));

  const lastColumn = await prisma.processColumn.findFirst({
    where: { boardId: data.boardId },
    orderBy: { position: "desc" },
    select: { position: true }
  });

  const key = slugify(data.title) + "-" + Date.now();
  const column = await prisma.processColumn.create({
    data: {
      boardId: data.boardId,
      key,
      title: sanitizeText(data.title),
      color: data.color || null,
      position: (lastColumn?.position ?? -1) + 1
    }
  });

  await writeAuditLog({ actorId: actor.id, action: "process_column.created", entityType: "ProcessColumn", entityId: column.id, metadata: { boardId: data.boardId, title: column.title } });
  revalidateAdmin(data.locale);
}

export async function updateBoardColumnAction(formData: FormData) {
  const actor = await requireAdmin("processes.manage");
  const prisma = requireDatabase();
  const data = updateBoardColumnSchema.parse(formEntries(formData));

  const column = await prisma.processColumn.update({
    where: { id: data.id },
    data: {
      title: sanitizeText(data.title),
      color: data.color || null
    }
  });

  await writeAuditLog({ actorId: actor.id, action: "process_column.updated", entityType: "ProcessColumn", entityId: column.id });
  revalidateAdmin(data.locale);
}

export async function deleteBoardColumnAction(formData: FormData) {
  const actor = await requireAdmin("processes.manage");
  const prisma = requireDatabase();
  const data = deleteBoardColumnSchema.parse(formEntries(formData));

  const column = await prisma.processColumn.findUniqueOrThrow({
    where: { id: data.id },
    include: { _count: { select: { tasks: true } } }
  });

  if (column._count.tasks > 0) throw new Error(`Cannot delete column "${column.title}": ${column._count.tasks} task(s) remain. Move them first.`);

  await prisma.processColumn.delete({ where: { id: data.id } });

  await writeAuditLog({ actorId: actor.id, action: "process_column.deleted", entityType: "ProcessColumn", entityId: data.id, metadata: { boardId: column.boardId } });
  revalidateAdmin(data.locale);
}

// ── Task management ───────────────────────────────────────────────────────────

const updateTaskSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1),
  columnId: z.string().min(1),
  title: shortText,
  description: optionalText,
  priority: clientPrioritySchema,
  dueDate: optionalDate,
  clientId: z.string().optional().or(z.literal("")),
  projectId: z.string().optional().or(z.literal("")),
  assigneeId: z.string().optional().or(z.literal("")),
  tags: optionalText
});

const deleteTaskSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1)
});

const archiveTaskSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1),
  archived: z.preprocess((v) => v === "true" || v === true || v === "1", z.boolean())
});

export async function updateTaskAction(formData: FormData) {
  const actor = await requireAdmin("processes.manage");
  const prisma = requireDatabase();
  const data = updateTaskSchema.parse(formEntries(formData));

  const task = await prisma.processTask.findUniqueOrThrow({ where: { id: data.id }, select: { boardId: true } });
  const column = await prisma.processColumn.findUniqueOrThrow({ where: { id: data.columnId }, select: { boardId: true } });
  if (column.boardId !== task.boardId) throw new Error("Column does not belong to this board.");

  const updated = await prisma.processTask.update({
    where: { id: data.id },
    data: {
      columnId: data.columnId,
      title: sanitizeText(data.title),
      description: nullable(data.description),
      priority: data.priority,
      dueDate: data.dueDate ?? null,
      clientId: data.clientId || null,
      projectId: data.projectId || null,
      assigneeId: data.assigneeId || null,
      tags: splitTags(data.tags)
    }
  });

  await writeAuditLog({ actorId: actor.id, action: "process_task.updated", entityType: "ProcessTask", entityId: updated.id, metadata: { boardId: updated.boardId } });
  revalidateAdmin(data.locale);
}

export async function deleteTaskAction(formData: FormData) {
  const actor = await requireAdmin("processes.manage");
  const prisma = requireDatabase();
  const data = deleteTaskSchema.parse(formEntries(formData));

  await prisma.processTask.delete({ where: { id: data.id } });

  await writeAuditLog({ actorId: actor.id, action: "process_task.deleted", entityType: "ProcessTask", entityId: data.id });
  revalidateAdmin(data.locale);
}

export async function archiveTaskAction(formData: FormData) {
  const actor = await requireAdmin("processes.manage");
  const prisma = requireDatabase();
  const data = archiveTaskSchema.parse(formEntries(formData));

  const updated = await prisma.processTask.update({
    where: { id: data.id },
    data: { archived: data.archived }
  });

  await writeAuditLog({ actorId: actor.id, action: data.archived ? "process_task.archived" : "process_task.unarchived", entityType: "ProcessTask", entityId: data.id, metadata: { boardId: updated.boardId } });
  revalidateAdmin(data.locale);
}

// ── Client creation from request ──────────────────────────────────────────────

const createClientFromRequestSchema = z.object({
  locale: localeSchema,
  requestType: z.enum(requestTypes),
  requestId: z.string().min(1),
  // override fields (pre-filled from request, editable by admin)
  name: shortText,
  email: optionalEmail,
  phone: optionalText,
  whatsapp: optionalText,
  company: optionalText,
  country: optionalText,
  notes: optionalText
});

export async function createClientFromRequestAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string; clientId?: string }> {
  try {
    const actor = await requireAdmin("clients.manage");
    const prisma = requireDatabase();
    const data = createClientFromRequestSchema.parse(formEntries(formData));

    // Prevent duplicate – if request already linked to a client, return it
    let existingClientId: string | null = null;
    if (data.requestType === "lead") {
      const lead = await prisma.lead.findUnique({ where: { id: data.requestId }, select: { clientId: true } });
      existingClientId = lead?.clientId ?? null;
    } else if (data.requestType === "contact") {
      const contact = await prisma.contactMessage.findUnique({ where: { id: data.requestId }, select: { clientId: true } });
      existingClientId = contact?.clientId ?? null;
    } else {
      const demo = await prisma.demoRequest.findUnique({ where: { id: data.requestId }, select: { clientId: true } });
      existingClientId = demo?.clientId ?? null;
    }
    if (existingClientId) return { success: true, clientId: existingClientId };

    const duplicate = await findDuplicateClient(prisma, data.name, data.email || null);
    if (duplicate) return { success: false, error: `A client named "${duplicate.name}" already exists. Link it manually instead.` };

    const slug = await uniqueClientSlug(prisma, data.name);
    const client = await prisma.client.create({
      data: {
        name: sanitizeText(data.name),
        slug,
        industry: nullable(data.company),
        status: "ONBOARDING",
        priority: "MEDIUM",
        contactName: sanitizeText(data.name),
        email: data.email || null,
        phone: nullable(data.phone),
        whatsapp: nullable(data.whatsapp),
        country: nullable(data.country),
        notes: nullable(data.notes),
        sourceRequestId: data.requestId,
        sourceRequestType: data.requestType,
        ownerId: actor.id
      }
    });

    // Link back to the originating request
    if (data.requestType === "lead") await prisma.lead.update({ where: { id: data.requestId }, data: { clientId: client.id, status: "WON" } });
    if (data.requestType === "contact") await prisma.contactMessage.update({ where: { id: data.requestId }, data: { clientId: client.id } });
    if (data.requestType === "demo") await prisma.demoRequest.update({ where: { id: data.requestId }, data: { clientId: client.id } });

    // Auto-create a contact record
    if (data.name || data.email || data.phone) {
      await prisma.clientContact.create({
        data: {
          clientId: client.id,
          name: sanitizeText(data.name),
          email: data.email || null,
          phone: nullable(data.phone),
          isPrimary: true
        }
      });
    }

    await writeAuditLog({ actorId: actor.id, action: "client.created_from_request", entityType: "Client", entityId: client.id, metadata: { requestType: data.requestType, requestId: data.requestId } });
    revalidateAdmin(data.locale);
    return { success: true, clientId: client.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create client.";
    return { success: false, error: message };
  }
}

// ── Demo request specific actions ─────────────────────────────────────────────

const updateDemoDescriptionSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1),
  projectNeed: z.string().trim().max(5000).optional().or(z.literal(""))
});

export async function updateDemoDescriptionAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin("requests.manage");
    const prisma = requireDatabase();
    const data = updateDemoDescriptionSchema.parse(formEntries(formData));
    await prisma.demoRequest.update({
      where: { id: data.id },
      data: { projectNeed: data.projectNeed || null }
    });
    revalidateAdmin(data.locale);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update." };
  }
}

const convertDemoToProjectSchema = z.object({
  locale: localeSchema,
  requestId: z.string().min(1),
  projectTitle: shortText,
  projectNeed: z.string().trim().max(5000).optional().or(z.literal("")),
  existingClientId: z.string().optional().or(z.literal("")),
  clientName: shortText,
  clientEmail: optionalEmail,
  clientPhone: optionalText,
  clientWhatsapp: optionalText,
  clientCompany: optionalText,
  clientCountry: optionalText
});

export async function convertDemoToProjectAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string; projectId?: string; clientId?: string }> {
  try {
    const actor = await requireAdmin("projects.manage");
    const prisma = requireDatabase();
    const data = convertDemoToProjectSchema.parse(formEntries(formData));

    // Load demo request
    const demoReq = await prisma.demoRequest.findUniqueOrThrow({
      where: { id: data.requestId },
      select: { clientId: true }
    });

    // Determine the client to use
    let clientId: string | null = data.existingClientId || demoReq.clientId || null;

    if (!clientId) {
      // Check for an existing client with the same name or email
      const duplicate = await findDuplicateClient(prisma, data.clientName, data.clientEmail || null);
      if (duplicate) {
        clientId = duplicate.id;
      } else {
        // Create a new client from the demo request data
        const slug = await uniqueClientSlug(prisma, data.clientName);
        const client = await prisma.client.create({
          data: {
            name: sanitizeText(data.clientName),
            slug,
            industry: nullable(data.clientCompany),
            status: "ONBOARDING",
            priority: "MEDIUM",
            contactName: sanitizeText(data.clientName),
            email: data.clientEmail || null,
            phone: nullable(data.clientPhone),
            whatsapp: nullable(data.clientWhatsapp),
            country: nullable(data.clientCountry),
            sourceRequestId: data.requestId,
            sourceRequestType: "demo",
            ownerId: actor.id
          }
        });
        if (data.clientName || data.clientEmail || data.clientPhone) {
          await prisma.clientContact.create({
            data: {
              clientId: client.id,
              name: sanitizeText(data.clientName),
              email: data.clientEmail || null,
              phone: nullable(data.clientPhone),
              isPrimary: true
            }
          });
        }
        clientId = client.id;
        await writeAuditLog({ actorId: actor.id, action: "client.created_from_request", entityType: "Client", entityId: client.id, metadata: { requestType: "demo", requestId: data.requestId } });
      }
    }

    // Link demo request to client if not already linked
    if (!demoReq.clientId) {
      await prisma.demoRequest.update({ where: { id: data.requestId }, data: { clientId } });
    }

    // Create the project
    const slug = await uniqueProjectSlug(prisma, clientId!, data.projectTitle);
    const project = await prisma.clientProject.create({
      data: {
        clientId: clientId!,
        ownerId: actor.id,
        title: sanitizeText(data.projectTitle),
        slug,
        status: "PLANNED",
        priority: "MEDIUM",
        description: data.projectNeed ? nullable(data.projectNeed) : null
      }
    });

    // Mark demo request as WON
    await prisma.demoRequest.update({ where: { id: data.requestId }, data: { status: "WON" } });

    await writeAuditLog({ actorId: actor.id, action: "project.created_from_demo", entityType: "ClientProject", entityId: project.id, metadata: { clientId, demoRequestId: data.requestId } });
    revalidateAdmin(data.locale);
    return { success: true, projectId: project.id, clientId: clientId! };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to convert to project.";
    return { success: false, error: message };
  }
}

// ── Conversation actions ───────────────────────────────────────────────────────

const createConversationSchema = z.object({
  locale: localeSchema,
  requestType: z.enum(requestTypes),
  requestId: z.string().min(1),
  clientId: z.string().optional().or(z.literal("")),
  subject: shortText
});

export async function createConversationAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string; conversationId?: string }> {
  try {
    const actor = await requireAdmin("requests.manage");
    const prisma = requireDatabase();
    const data = createConversationSchema.parse(formEntries(formData));

    const existing = await prisma.conversation.findFirst({
      where: { requestType: data.requestType, requestId: data.requestId },
      select: { id: true }
    });
    if (existing) return { success: true, conversationId: existing.id };

    const conv = await prisma.conversation.create({
      data: {
        requestType: data.requestType,
        requestId: data.requestId,
        clientId: data.clientId || null,
        subject: sanitizeText(data.subject)
      }
    });

    await writeAuditLog({ actorId: actor.id, action: "conversation.created", entityType: "Conversation", entityId: conv.id, metadata: { requestType: data.requestType, requestId: data.requestId } });
    revalidateAdmin(data.locale);
    return { success: true, conversationId: conv.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create conversation.";
    return { success: false, error: message };
  }
}

const sendEmailSchema = z.object({
  locale: localeSchema,
  conversationId: z.string().min(1),
  to: z.string().trim().toLowerCase().email().max(180),
  subject: shortText,
  body: z.string().trim().min(1).max(10_000)
});

export async function sendConversationEmailAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdmin("requests.manage");
    const prisma = requireDatabase();
    const data = sendEmailSchema.parse(formEntries(formData));

    const conv = await prisma.conversation.findUniqueOrThrow({ where: { id: data.conversationId } });
    const { sendOutboundEmail } = await import("@/lib/email");
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@techia.com";
    const officialEmail = process.env.OFFICIAL_EMAIL || process.env.CONTACT_TO_EMAIL || "";

    const safeBody = data.body.replace(/[<>]/g, "").replace(/javascript:/gi, "");
    await sendOutboundEmail({
      to: data.to,
      from: fromEmail,
      replyTo: officialEmail || undefined,
      subject: sanitizeText(data.subject),
      body: safeBody
    });

    await prisma.conversationMessage.create({
      data: {
        conversationId: conv.id,
        channel: "email",
        direction: "outbound",
        from: fromEmail,
        to: data.to,
        subject: sanitizeText(data.subject),
        body: safeBody,
        sentById: actor.id
      }
    });

    await writeAuditLog({ actorId: actor.id, action: "conversation.email_sent", entityType: "Conversation", entityId: conv.id, metadata: { to: data.to } });
    revalidateAdmin(data.locale);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email.";
    return { success: false, error: message };
  }
}

// Returns a WhatsApp wa.me link pre-filled with the contact's number (or official if none)
export async function getWhatsappLinkAction(
  toNumber: string,
  message = ""
): Promise<string> {
  await requireAdmin("requests.manage");
  const clean = toNumber.replace(/\D/g, "");
  if (!/^\d{7,15}$/.test(clean)) throw new Error("Invalid phone number for WhatsApp");
  const encoded = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${clean}${encoded}`;
}

// ── Auto-add task to delivery board on project creation ───────────────────────

export async function createProjectWithTaskAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string; projectId?: string }> {
  try {
    const actor = await requireAdmin("projects.manage");
    const prisma = requireDatabase();
    const data = createProjectSchema.parse(formEntries(formData));
    const slug = await uniqueProjectSlug(prisma, data.clientId, data.title);
    const computedProgress = data.status === "DELIVERED" ? 100 : data.progress;
    const completedAt = data.status === "DELIVERED" ? new Date() : null;

    const project = await prisma.clientProject.create({
      data: {
        clientId: data.clientId,
        ownerId: data.ownerId || actor.id,
        title: sanitizeText(data.title),
        slug,
        status: data.status,
        priority: data.priority,
        description: nullable(data.description),
        budget: data.budget,
        progress: computedProgress,
        startDate: data.startDate,
        dueDate: data.dueDate,
        completedAt,
        showInPortfolio: data.showInPortfolio,
        showOnHomepage: data.showOnHomepage,
        showInFounder: data.showInFounder,
        publicOrder: data.publicOrder,
        publicSlug: nullable(data.publicSlug),
        publicTitleEn: nullable(data.publicTitleEn),
        publicTitleFr: nullable(data.publicTitleFr),
        publicEyebrowEn: nullable(data.publicEyebrowEn),
        publicEyebrowFr: nullable(data.publicEyebrowFr),
        publicDescriptionEn: nullable(data.publicDescriptionEn),
        publicDescriptionFr: nullable(data.publicDescriptionFr),
        publicProblemEn: nullable(data.publicProblemEn),
        publicProblemFr: nullable(data.publicProblemFr),
        publicSolutionEn: nullable(data.publicSolutionEn),
        publicSolutionFr: nullable(data.publicSolutionFr),
        publicRoleEn: nullable(data.publicRoleEn),
        publicRoleFr: nullable(data.publicRoleFr),
        publicBusinessValueEn: nullable(data.publicBusinessValueEn),
        publicBusinessValueFr: nullable(data.publicBusinessValueFr),
        publicTechStack: data.publicTechStack
      }
    });

    // Auto-add to delivery board column matching project status
    const deliveryBoard = await prisma.processBoard.findFirst({
      where: { boardType: "delivery" },
      include: { columns: { orderBy: { position: "asc" } } }
    });

    const colKeyForStatus: Record<string, string> = {
      PLANNED: "intake", ACTIVE: "build", REVIEW: "review",
      ON_HOLD: "intake", DELIVERED: "done", ARCHIVED: "done"
    };

    if (deliveryBoard?.columns.length) {
      const targetKey = colKeyForStatus[data.status] ?? "intake";
      const column = deliveryBoard.columns.find((c) => c.key === targetKey) ?? deliveryBoard.columns[0];
      const lastTask = await prisma.processTask.findFirst({
        where: { columnId: column.id },
        orderBy: { position: "desc" },
        select: { position: true }
      });
      await prisma.processTask.create({
        data: {
          boardId: deliveryBoard.id,
          columnId: column.id,
          title: sanitizeText(data.title),
          description: nullable(data.description),
          priority: data.priority,
          dueDate: data.dueDate,
          clientId: data.clientId,
          projectId: project.id,
          assigneeId: data.ownerId || actor.id,
          createdById: actor.id,
          tags: [],
          position: (lastTask?.position || 0) + 1000,
          requestType: "project",
          requestId: project.id
        }
      });
    }

    await writeAuditLog({ actorId: actor.id, action: "project.created", entityType: "ClientProject", entityId: project.id, metadata: { clientId: data.clientId, autoTask: !!deliveryBoard } });
    revalidateAdmin(data.locale);
    revalidatePublicShowcase();
    return { success: true, projectId: project.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create project.";
    return { success: false, error: message };
  }
}

// ── Update inquiry internal notes ─────────────────────────────────────────────

const updateInquiryNotesSchema = z.object({
  locale: localeSchema,
  inquiryId: z.string().min(1),
  internalNotes: optionalText
});

export async function updateInquiryNotesAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin("requests.manage");
    const prisma = requireDatabase();
    const data = updateInquiryNotesSchema.parse(formEntries(formData));
    await prisma.projectInquiry.update({
      where: { id: data.inquiryId },
      data: { internalNotes: sanitizeText(data.internalNotes || "") }
    });
    revalidateAdmin(data.locale);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update notes.";
    return { success: false, error: message };
  }
}

// ── Convert inquiry to project ────────────────────────────────────────────────

const convertInquirySchema = z.object({
  locale: localeSchema,
  inquiryId: z.string().min(1),
  projectTitle: shortText,
  projectDescription: optionalText,
  budget: optionalInt,
  dueDate: optionalDate
});

export async function convertInquiryToProjectAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string; clientId?: string; projectId?: string }> {
  try {
    const actor = await requireAdmin("requests.manage");
    const prisma = requireDatabase();
    const data = convertInquirySchema.parse(formEntries(formData));

    const inquiry = await prisma.projectInquiry.findUniqueOrThrow({
      where: { id: data.inquiryId },
      include: { lead: true }
    });

    if (inquiry.convertedToTaskId) {
      return { success: false, error: "This inquiry has already been converted to a project." };
    }

    const lead = inquiry.lead;
    let clientId = inquiry.clientId;

    // Resolve or create client from lead
    if (!clientId) {
      if (lead?.clientId) {
        clientId = lead.clientId;
      } else if (lead) {
        const baseSlug = lead.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const existing = await prisma.client.findFirst({
          where: { OR: [{ email: lead.email }, { slug: baseSlug }] },
          select: { id: true }
        });
        if (existing) {
          clientId = existing.id;
        } else {
          const client = await prisma.client.create({
            data: {
              name: lead.company || lead.name,
              slug: `${baseSlug}-${Date.now()}`,
              email: lead.email,
              phone: lead.phone,
              whatsapp: lead.whatsapp,
              contactName: lead.name,
              source: "project_inquiry",
              sourceRequestId: inquiry.id,
              sourceRequestType: "inquiry",
              status: "ONBOARDING",
              priority: "MEDIUM"
            }
          });
          clientId = client.id;
          await prisma.clientContact.create({
            data: { clientId, name: lead.name, email: lead.email, phone: lead.phone ?? undefined, isPrimary: true }
          });
          await prisma.lead.update({ where: { id: lead.id }, data: { clientId, status: "WON" } });
        }
      }
    }

    if (!clientId) {
      return { success: false, error: "Cannot convert: no linked lead or client found on this inquiry." };
    }

    // Create the project
    const projectSlug = await uniqueProjectSlug(prisma, clientId, data.projectTitle);
    const project = await prisma.clientProject.create({
      data: {
        clientId,
        ownerId: actor.id,
        title: sanitizeText(data.projectTitle),
        slug: projectSlug,
        status: "PLANNED",
        priority: "MEDIUM",
        description: nullable(data.projectDescription || inquiry.details),
        budget: data.budget,
        dueDate: data.dueDate
      }
    });

    // Add to delivery board
    let deliveryTaskId: string | undefined;
    const deliveryBoard = await prisma.processBoard.findFirst({
      where: { boardType: "delivery" },
      include: { columns: { orderBy: { position: "asc" }, take: 1 } }
    });
    if (deliveryBoard?.columns[0]) {
      const col = deliveryBoard.columns[0];
      const lastPos = await prisma.processTask.findFirst({ where: { columnId: col.id }, orderBy: { position: "desc" }, select: { position: true } });
      const task = await prisma.processTask.create({
        data: {
          boardId: deliveryBoard.id,
          columnId: col.id,
          clientId,
          projectId: project.id,
          requestType: "inquiry",
          requestId: inquiry.id,
          title: sanitizeText(data.projectTitle),
          description: nullable(data.projectDescription || inquiry.details),
          priority: "MEDIUM",
          position: (lastPos?.position ?? 0) + 1000,
          createdById: actor.id
        }
      });
      deliveryTaskId = task.id;
    }

    // Archive any open inquiry pipeline tasks for this inquiry
    // (exclude the delivery task we just created so it stays visible on the board)
    await prisma.processTask.updateMany({
      where: {
        requestType: "inquiry",
        requestId: inquiry.id,
        archived: false,
        ...(deliveryTaskId ? { NOT: { id: deliveryTaskId } } : {})
      },
      data: { archived: true }
    });

    // Stamp the inquiry as converted
    await prisma.projectInquiry.update({
      where: { id: inquiry.id },
      data: { clientId, convertedToTaskId: deliveryTaskId }
    });

    await writeAuditLog({
      actorId: actor.id,
      action: "inquiry.converted_to_project",
      entityType: "ProjectInquiry",
      entityId: inquiry.id,
      metadata: { clientId, projectId: project.id, taskId: deliveryTaskId }
    });
    revalidateAdmin(data.locale);
    return { success: true, clientId, projectId: project.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Conversion failed.";
    return { success: false, error: message };
  }
}

export async function updateClientAction(_prevState: unknown, formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdmin("clients.manage");
    const prisma = requireDatabase();
    const data = updateClientSchema.parse(formEntries(formData));

    await prisma.client.update({
      where: { id: data.id },
      data: {
        name: sanitizeText(data.name),
        industry: nullable(data.industry),
        status: data.status,
        priority: data.priority,
        contactName: nullable(data.contactName),
        contactRole: nullable(data.contactRole),
        email: data.email || null,
        phone: nullable(data.phone),
        website: data.website || null,
        country: nullable(data.country),
        city: nullable(data.city),
        estimatedValue: data.estimatedValue,
        tags: splitTags(data.tags),
        notes: nullable(data.notes),
        preferredLocale: data.preferredLocale
      }
    });

    await writeAuditLog({ actorId: actor.id, action: "client.updated", entityType: "Client", entityId: data.id });
    revalidateAdmin(data.locale);
    return { success: true };
  } catch (err) {
    console.error("[actions] updateClientAction failed", { message: err instanceof Error ? err.message : err, stack: err instanceof Error ? err.stack : undefined });
    return { success: false, error: err instanceof Error ? err.message : "Update failed." };
  }
}

export async function deleteClientAction(_prevState: unknown, formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdmin("clients.manage");
    const prisma = requireDatabase();
    const id = z.string().min(1).parse(formData.get("id"));
    const locale = localeSchema.parse(formData.get("locale"));

    await prisma.client.delete({ where: { id } });

    await writeAuditLog({ actorId: actor.id, action: "client.deleted", entityType: "Client", entityId: id });
    revalidateAdmin(locale);
    return { success: true };
  } catch (err) {
    console.error("[actions] deleteClientAction failed", { message: err instanceof Error ? err.message : err, stack: err instanceof Error ? err.stack : undefined });
    return { success: false, error: err instanceof Error ? err.message : "Delete failed." };
  }
}

export async function updateProjectAction(_prevState: unknown, formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdmin("projects.manage");
    const prisma = requireDatabase();
    const data = updateProjectSchema.parse(formEntries(formData));
    const computedProgress = data.status === "DELIVERED" ? 100 : data.progress;
    const completedAt = data.status === "DELIVERED" ? new Date() : null;

    await prisma.clientProject.update({
      where: { id: data.id },
      data: {
        title: sanitizeText(data.title),
        status: data.status,
        priority: data.priority,
        description: nullable(data.description),
        budget: data.budget,
        progress: computedProgress,
        startDate: data.startDate,
        dueDate: data.dueDate,
        completedAt,
        showInPortfolio: data.showInPortfolio,
        showOnHomepage: data.showOnHomepage,
        showInFounder: data.showInFounder,
        ...(data.publicOrder !== undefined ? { publicOrder: data.publicOrder } : {}),
        ...(data.publicSlug !== undefined ? { publicSlug: nullable(data.publicSlug) } : {}),
        ...(data.publicTitleEn !== undefined ? { publicTitleEn: nullable(data.publicTitleEn) } : {}),
        ...(data.publicTitleFr !== undefined ? { publicTitleFr: nullable(data.publicTitleFr) } : {}),
        ...(data.publicEyebrowEn !== undefined ? { publicEyebrowEn: nullable(data.publicEyebrowEn) } : {}),
        ...(data.publicEyebrowFr !== undefined ? { publicEyebrowFr: nullable(data.publicEyebrowFr) } : {}),
        ...(data.publicDescriptionEn !== undefined ? { publicDescriptionEn: nullable(data.publicDescriptionEn) } : {}),
        ...(data.publicDescriptionFr !== undefined ? { publicDescriptionFr: nullable(data.publicDescriptionFr) } : {}),
        ...(data.publicProblemEn !== undefined ? { publicProblemEn: nullable(data.publicProblemEn) } : {}),
        ...(data.publicProblemFr !== undefined ? { publicProblemFr: nullable(data.publicProblemFr) } : {}),
        ...(data.publicSolutionEn !== undefined ? { publicSolutionEn: nullable(data.publicSolutionEn) } : {}),
        ...(data.publicSolutionFr !== undefined ? { publicSolutionFr: nullable(data.publicSolutionFr) } : {}),
        ...(data.publicRoleEn !== undefined ? { publicRoleEn: nullable(data.publicRoleEn) } : {}),
        ...(data.publicRoleFr !== undefined ? { publicRoleFr: nullable(data.publicRoleFr) } : {}),
        ...(data.publicBusinessValueEn !== undefined ? { publicBusinessValueEn: nullable(data.publicBusinessValueEn) } : {}),
        ...(data.publicBusinessValueFr !== undefined ? { publicBusinessValueFr: nullable(data.publicBusinessValueFr) } : {}),
        ...(data.publicTechStack !== undefined ? { publicTechStack: data.publicTechStack } : {})
      }
    });

    await writeAuditLog({ actorId: actor.id, action: "project.updated", entityType: "ClientProject", entityId: data.id });
    revalidateAdmin(data.locale);
    revalidatePublicShowcase();
    return { success: true };
  } catch (err) {
    console.error("[actions] updateProjectAction failed", { message: err instanceof Error ? err.message : err, stack: err instanceof Error ? err.stack : undefined });
    return { success: false, error: err instanceof Error ? err.message : "Update failed." };
  }
}

export async function deleteProjectAction(_prevState: unknown, formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdmin("projects.manage");
    const prisma = requireDatabase();
    const id = z.string().min(1).parse(formData.get("id"));
    const locale = localeSchema.parse(formData.get("locale"));

    await prisma.clientProject.delete({ where: { id } });

    await writeAuditLog({ actorId: actor.id, action: "project.deleted", entityType: "ClientProject", entityId: id });
    revalidateAdmin(locale);
    revalidatePublicShowcase();
    return { success: true };
  } catch (err) {
    console.error("[actions] deleteProjectAction failed", { message: err instanceof Error ? err.message : err, stack: err instanceof Error ? err.stack : undefined });
    return { success: false, error: err instanceof Error ? err.message : "Delete failed." };
  }
}

export async function updateCustomerFeedbackAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdmin("content.manage");
    const prisma = requireDatabase();
    const data = updateFeedbackSchema.parse(formEntries(formData));

    const updated = await prisma.$executeRaw`
      UPDATE "CustomerFeedback"
      SET
        "status" = CAST(${data.status} AS "FeedbackStatus"),
        "showOnHomepage" = ${data.showOnHomepage},
        "showOnFounder" = ${data.showOnFounder},
        "showOnPortfolio" = ${data.showOnPortfolio},
        "displayOrder" = ${data.displayOrder},
        "internalNotes" = ${nullable(data.internalNotes)},
        "updatedAt" = NOW()
      WHERE "id" = ${data.id}
    `;

    if (!updated) {
      throw new Error("Feedback entry not found.");
    }

    await writeAuditLog({
      actorId: actor.id,
      action: "feedback.updated",
      entityType: "CustomerFeedback",
      entityId: data.id,
      metadata: {
        status: data.status,
        showOnHomepage: data.showOnHomepage,
        showOnFounder: data.showOnFounder,
        showOnPortfolio: data.showOnPortfolio
      }
    });
    revalidateAdmin(data.locale);
    revalidatePublicShowcase();
    return { success: true };
  } catch (err) {
    console.error("[actions] updateCustomerFeedbackAction failed", { message: err instanceof Error ? err.message : err, stack: err instanceof Error ? err.stack : undefined });
    return {
      success: false,
      error:
        err instanceof Error && err.message.includes("showOnHomepage")
          ? "Database schema is outdated. Run the latest Prisma migration."
          : err instanceof Error ? err.message : "Update failed."
    };
  }
}

export async function deleteCustomerFeedbackAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdmin("content.manage");
    const prisma = requireDatabase();
    const id = z.string().min(1).parse(formData.get("id"));
    const locale = localeSchema.parse(formData.get("locale"));

    await prisma.customerFeedback.delete({ where: { id } });

    await writeAuditLog({ actorId: actor.id, action: "feedback.deleted", entityType: "CustomerFeedback", entityId: id });
    revalidateAdmin(locale);
    revalidatePublicShowcase();
    return { success: true };
  } catch (err) {
    console.error("[actions] deleteCustomerFeedbackAction failed", { message: err instanceof Error ? err.message : err, stack: err instanceof Error ? err.stack : undefined });
    return { success: false, error: err instanceof Error ? err.message : "Delete failed." };
  }
}

// ─── Client Portal Management ─────────────────────────────────────────────────

function generatePortalCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += "-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function generatePortalAccessAction(_prevState: unknown, formData: FormData) {
  const actor = await requireAdmin();
  const prisma = getPrisma();
  if (!prisma) return { success: false, error: "Database unavailable." };

  const clientId = String(formData.get("clientId") || "");
  if (!clientId) return { success: false, error: "Client ID required." };

  // Ensure client exists
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, name: true, email: true } });
  if (!client) return { success: false, error: "Client not found." };

  const code = generatePortalCode();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

  const access = await prisma.clientPortalAccess.upsert({
    where: { clientId },
    create: { clientId, code, isActive: true, expiresAt, createdById: actor.id },
    update: { code, isActive: true, expiresAt },
  });

  await writeAuditLog({ actorId: actor.id, action: "portal.access_generated", entityType: "Client", entityId: clientId });
  revalidatePath("/[locale]/admin", "layout");
  return { success: true, code: access.code, clientEmail: client.email, clientName: client.name };
}

export async function revokePortalAccessAction(_prevState: unknown, formData: FormData) {
  await requireAdmin();
  const prisma = getPrisma();
  if (!prisma) return { success: false, error: "Database unavailable." };

  const clientId = String(formData.get("clientId") || "");
  if (!clientId) return { success: false, error: "Client ID required." };

  await prisma.clientPortalAccess.updateMany({ where: { clientId }, data: { isActive: false } });
  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

export async function sendPortalMessageAction(_prevState: unknown, formData: FormData) {
  const actor = await requireAdmin();
  const prisma = getPrisma();
  if (!prisma) return { success: false, error: "Database unavailable." };

  const clientId = String(formData.get("clientId") || "");
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!clientId || !subject || !body) return { success: false, error: "All fields required." };

  await prisma.portalMessage.create({
    data: {
      clientId,
      subject,
      body,
      fromAdmin: true,
      adminId: actor.id,
    },
  });

  // Create notification for client
  await prisma.portalNotification.create({
    data: {
      clientId,
      type: "MESSAGE",
      title: "New message from teChia",
      body: subject,
      link: "/client-portal/messages",
    },
  });

  await writeAuditLog({ actorId: actor.id, action: "portal.message_sent", entityType: "Client", entityId: clientId });
  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

export async function sendPortalMessageReplyAction(formData: FormData) {
  const actor = await requireAdmin();
  const prisma = getPrisma();
  if (!prisma) return { success: false, error: "Database unavailable." };

  const messageId = String(formData.get("messageId") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!messageId || !body) return { success: false, error: "Message and reply are required." };

  const message = await prisma.portalMessage.findUnique({
    where: { id: messageId },
    select: { id: true, clientId: true, subject: true }
  });
  if (!message) return { success: false, error: "Message thread not found." };

  // Any client messages in this thread become read once admin replies.
  await prisma.portalMessage.updateMany({
    where: { id: message.id, fromAdmin: false, readAt: null },
    data: { readAt: new Date() },
  });
  await prisma.portalMessageReply.updateMany({
    where: { messageId: message.id, fromAdmin: false, readAt: null },
    data: { readAt: new Date() },
  });

  await prisma.portalMessageReply.create({
    data: {
      messageId: message.id,
      body,
      fromAdmin: true,
      adminId: actor.id,
    },
  });

  await prisma.portalNotification.create({
    data: {
      clientId: message.clientId,
      type: "MESSAGE",
      title: "New reply from teChia",
      body: message.subject,
      link: "/client-portal/messages",
    },
  });

  await writeAuditLog({ actorId: actor.id, action: "portal.message_replied", entityType: "Client", entityId: message.clientId });
  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

export async function markClientPortalThreadsReadAction(clientId: string) {
  const actor = await requireAdmin();
  const prisma = getPrisma();
  if (!prisma) return { success: false, error: "Database unavailable." };
  if (!clientId) return { success: false, error: "Client ID required." };

  const now = new Date();

  await prisma.portalMessage.updateMany({
    where: { clientId, fromAdmin: false, readAt: null },
    data: { readAt: now },
  });

  await prisma.portalMessageReply.updateMany({
    where: {
      fromAdmin: false,
      readAt: null,
      message: { clientId },
    },
    data: { readAt: now },
  });

  await writeAuditLog({
    actorId: actor.id,
    action: "portal.messages_marked_read",
    entityType: "Client",
    entityId: clientId,
  });

  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

export async function createPortalInvoiceAction(_prevState: unknown, formData: FormData) {
  const actor = await requireAdmin();
  const prisma = getPrisma();
  if (!prisma) return { success: false, error: "Database unavailable." };

  const clientId = String(formData.get("clientId") || "");
  const title = String(formData.get("title") || "").trim();
  const amountStr = String(formData.get("amount") || "");
  const currency = String(formData.get("currency") || "USD").toUpperCase();
  const dueDateStr = String(formData.get("dueDate") || "");
  const projectId = String(formData.get("projectId") || "") || undefined;
  const notes = String(formData.get("notes") || "").trim() || undefined;

  if (!clientId || !title || !amountStr) return { success: false, error: "Required fields missing." };

  const amount = Math.round(parseFloat(amountStr) * 100);
  if (!Number.isFinite(amount) || amount <= 0) return { success: false, error: "Invalid amount." };

  const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;

  // Generate invoice number
  const count = await prisma.portalInvoice.count({ where: { clientId } });
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${(count + 1).toString().padStart(3, "0")}`;

  await prisma.portalInvoice.create({
    data: {
      clientId,
      projectId,
      invoiceNumber,
      title,
      amount,
      currency,
      status: "SENT",
      dueDate,
      notes,
    },
  });

  // Notify client
  await prisma.portalNotification.create({
    data: {
      clientId,
      type: "INVOICE",
      title: "New invoice",
      body: `${title} — ${new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100)}`,
      link: "/client-portal/invoices",
    },
  });

  await writeAuditLog({ actorId: actor.id, action: "portal.invoice_created", entityType: "Client", entityId: clientId });
  revalidatePath("/[locale]/admin", "layout");
  return { success: true, invoiceNumber };
}

export async function createPortalRequirementAction(_prevState: unknown, formData: FormData) {
  const actor = await requireAdmin();
  const prisma = getPrisma();
  if (!prisma) return { success: false, error: "Database unavailable." };

  const clientId = String(formData.get("clientId") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const type = String(formData.get("type") || "INFORMATION");
  const dueDateStr = String(formData.get("dueDate") || "");
  const projectId = String(formData.get("projectId") || "") || undefined;

  if (!clientId || !title || !description) return { success: false, error: "Required fields missing." };

  const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;

  await prisma.portalRequirement.create({
    data: {
      clientId,
      projectId,
      title,
      description,
      type: type as "CONTENT" | "APPROVAL" | "DOCUMENT" | "INFORMATION" | "FEEDBACK" | "OTHER",
      status: "PENDING",
      dueDate,
    },
  });

  // Notify client
  await prisma.portalNotification.create({
    data: {
      clientId,
      type: "REQUIREMENT",
      title: "Action required",
      body: title,
      link: "/client-portal/requirements",
    },
  });

  await writeAuditLog({ actorId: actor.id, action: "portal.requirement_created", entityType: "Client", entityId: clientId });
  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

export async function updatePortalInvoiceStatusAction(formData: FormData) {
  await requireAdmin();
  const prisma = getPrisma();
  if (!prisma) return { success: false, error: "Database unavailable." };

  const invoiceId = String(formData.get("invoiceId") || "");
  const status = String(formData.get("status") || "");

  if (!invoiceId || !status) return { success: false, error: "Invoice ID and status required." };

  await prisma.portalInvoice.update({
    where: { id: invoiceId },
    data: {
      status: status as "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED",
      paidAt: status === "PAID" ? new Date() : undefined,
    },
  });

  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

export async function uploadPortalFileAdminAction(formData: FormData) {
  const actor = await requireAdmin();
  const prisma = getPrisma();
  if (!prisma) return { success: false, error: "Database unavailable." };

  const clientId = String(formData.get("clientId") || "");
  const name = String(formData.get("name") || "").trim();
  const fileType = String(formData.get("fileType") || "application/octet-stream");
  const category = String(formData.get("category") || "DELIVERABLE");
  const url = String(formData.get("url") || "#");
  const publicId = String(formData.get("publicId") || "") || undefined;
  const projectId = String(formData.get("projectId") || "") || undefined;
  const notes = String(formData.get("notes") || "").trim() || undefined;
  const sizeStr = String(formData.get("size") || "");
  const size = sizeStr ? parseInt(sizeStr) : undefined;

  if (!clientId || !name) return { success: false, error: "Client and file name required." };

  await prisma.portalFile.create({
    data: {
      clientId,
      projectId,
      name,
      fileType,
      category: category as "DELIVERABLE" | "ASSET" | "DOCUMENT" | "DESIGN" | "CONTRACT" | "OTHER",
      url,
      publicId,
      size,
      notes,
      uploadedBy: "admin",
      adminId: actor.id,
      status: "APPROVED",
    },
  });

  // Notify client
  await prisma.portalNotification.create({
    data: {
      clientId,
      type: "FILE",
      title: "New file shared",
      body: name,
      link: "/client-portal/files",
    },
  });

  await writeAuditLog({ actorId: actor.id, action: "portal.file_uploaded", entityType: "Client", entityId: clientId });
  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

export async function reviewPortalFileAction(formData: FormData) {
  const actor = await requireAdmin();
  const prisma = getPrisma();
  if (!prisma) return { success: false, error: "Database unavailable." };

  const fileId = String(formData.get("fileId") || "").trim();
  const status = String(formData.get("status") || "").trim().toUpperCase();
  const notes = String(formData.get("notes") || "").trim() || undefined;
  const projectId = String(formData.get("projectId") || "").trim() || null;

  if (!fileId) return { success: false, error: "File ID required." };
  if (!status || !["PENDING", "APPROVED", "REJECTED", "ARCHIVED"].includes(status)) {
    return { success: false, error: "Invalid status." };
  }

  const file = await prisma.portalFile.findUnique({
    where: { id: fileId },
    select: { id: true, clientId: true, name: true, status: true }
  });
  if (!file) return { success: false, error: "File not found." };

  await prisma.portalFile.update({
    where: { id: fileId },
    data: {
      status,
      notes,
      projectId,
      adminId: actor.id,
    },
  });

  if (status === "APPROVED" || status === "REJECTED") {
    await prisma.portalNotification.create({
      data: {
        clientId: file.clientId,
        type: "FILE",
        title: status === "APPROVED" ? "File approved" : "File needs revision",
        body: notes || `${file.name} has been ${status.toLowerCase()}.`,
        link: "/client-portal/files",
      },
    });
  }

  await writeAuditLog({ actorId: actor.id, action: "portal.file_reviewed", entityType: "Client", entityId: file.clientId });
  revalidatePath("/[locale]/admin", "layout");
  revalidatePath("/client-portal/files");
  return { success: true };
}

export async function sendPortalInviteEmailAction(_prevState: unknown, formData: FormData) {
  await requireAdmin();
  const toEmail = String(formData.get("toEmail") || "").trim();
  const toName = String(formData.get("toName") || "").trim();
  const accessCode = String(formData.get("accessCode") || "").trim();
  const loginUrl = String(formData.get("loginUrl") || "").trim();

  if (!toEmail || !accessCode) {
    return { success: false, error: "Missing email or access code. Generate a code first." };
  }

  const result = await sendPortalInviteEmail({ toEmail, toName, accessCode, loginUrl });
  if (result.skipped) {
    return { success: false, error: result.error || "Email service not configured." };
  }
  return { success: true };
}
