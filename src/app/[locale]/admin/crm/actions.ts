"use server";

import type { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { draftAdminEmail } from "@/lib/ai/admin-composer";
import { requireAdmin, writeAuditLog } from "@/lib/admin/session";
import { sendOutboundEmail } from "@/lib/email";
import { getPrisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/sanitize";

const localeSchema = z.enum(["en", "fr"]);

export type CrmFormState = {
  success: boolean;
  error?: string;
  contactId?: string;
  conversationId?: string;
} | null;

function requireDatabase() {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable.");
  return prisma;
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function cleanBody(value: string, max = 12_000) {
  return value.replace(/\r\n/g, "\n").replace(/javascript:/gi, "").trim().slice(0, max);
}

function cleanEmail(value: string) {
  return value.trim().toLowerCase();
}

function cleanEnv(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function fromAddress() {
  return cleanEnv(process.env.RESEND_FROM_EMAIL) || "noreply@techiadigital.com";
}

function replyToAddress() {
  return (
    cleanEnv(process.env.RESEND_REPLY_TO) ||
    cleanEnv(process.env.OFFICIAL_EMAIL) ||
    cleanEnv(process.env.CONTACT_TO_EMAIL) ||
    undefined
  );
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return slug || "client";
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

function revalidateCrm(locale: "en" | "fr") {
  revalidatePath(`/${locale}/admin/crm`);
  revalidatePath(`/${locale}/admin`);
}

// ── Add a contact ─────────────────────────────────────────────────────────────

const createContactSchema = z.object({
  locale: localeSchema,
  clientId: z.string().trim().optional().or(z.literal("")),
  clientName: z.string().trim().max(180).optional().or(z.literal("")),
  clientEmail: z.string().trim().toLowerCase().email().max(180).optional().or(z.literal("")),
  clientPhone: z.string().trim().max(60).optional().or(z.literal("")),
  contactName: z.string().trim().min(2).max(180),
  contactRole: z.string().trim().max(120).optional().or(z.literal("")),
  contactEmail: z.string().trim().toLowerCase().email().max(180).optional().or(z.literal("")),
  contactPhone: z.string().trim().max(60).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function createCrmContactAction(_prevState: CrmFormState, formData: FormData): Promise<CrmFormState> {
  try {
    const actor = await requireAdmin("requests.manage");
    const prisma = requireDatabase();
    const data = createContactSchema.parse({
      locale: value(formData, "locale"),
      clientId: value(formData, "clientId"),
      clientName: value(formData, "clientName"),
      clientEmail: value(formData, "clientEmail"),
      clientPhone: value(formData, "clientPhone"),
      contactName: value(formData, "contactName"),
      contactRole: value(formData, "contactRole"),
      contactEmail: value(formData, "contactEmail"),
      contactPhone: value(formData, "contactPhone"),
      notes: value(formData, "notes"),
    });

    const headlineSelect = { id: true, name: true, contactName: true, contactRole: true, email: true, phone: true } as const;
    let client = data.clientId
      ? await prisma.client.findUnique({ where: { id: data.clientId }, select: headlineSelect })
      : null;

    if (data.clientId && !client) throw new Error("The selected client no longer exists.");

    if (!client) {
      const clientName = data.clientName || data.contactName;
      const slug = await uniqueClientSlug(prisma, clientName);
      client = await prisma.client.create({
        data: {
          name: sanitizeText(clientName),
          slug,
          status: "PROSPECT",
          email: data.clientEmail ? cleanEmail(data.clientEmail) : null,
          phone: data.clientPhone ? sanitizeText(data.clientPhone) : null,
          contactName: sanitizeText(data.contactName),
          contactRole: data.contactRole ? sanitizeText(data.contactRole) : null,
          preferredLocale: data.locale,
          source: "crm",
          notes: data.notes ? sanitizeText(data.notes) : null,
        },
        select: headlineSelect,
      });
    }

    if (data.contactEmail) {
      const duplicate = await prisma.clientContact.findFirst({
        where: { clientId: client.id, email: cleanEmail(data.contactEmail) },
        select: { id: true },
      });
      if (duplicate) throw new Error("This email is already linked to a contact for this client.");
    }

    const existingContacts = await prisma.clientContact.count({ where: { clientId: client.id } });
    const contact = await prisma.clientContact.create({
      data: {
        clientId: client.id,
        name: sanitizeText(data.contactName),
        role: data.contactRole ? sanitizeText(data.contactRole) : null,
        email: data.contactEmail ? cleanEmail(data.contactEmail) : null,
        phone: data.contactPhone ? sanitizeText(data.contactPhone) : null,
        notes: data.notes ? sanitizeText(data.notes) : null,
        isPrimary: existingContacts === 0,
      },
      select: { id: true, clientId: true },
    });

    // Fill only the headline details that are still blank on the client. The
    // new contact must never overwrite the name or email of an existing
    // primary contact.
    await prisma.client.update({
      where: { id: client.id },
      data: {
        contactName: client.contactName || sanitizeText(data.contactName),
        contactRole: client.contactRole ?? (data.contactRole ? sanitizeText(data.contactRole) : undefined),
        email: client.email ?? (data.contactEmail ? cleanEmail(data.contactEmail) : undefined),
        phone: client.phone ?? (data.contactPhone ? sanitizeText(data.contactPhone) : undefined),
      },
    });

    await writeAuditLog({
      actorId: actor.id,
      action: "crm.contact_created",
      entityType: "ClientContact",
      entityId: contact.id,
      metadata: { clientId: contact.clientId, createdClient: !data.clientId },
    });
    revalidateCrm(data.locale);
    return { success: true, contactId: contact.id, conversationId: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add the contact.";
    console.error("[crm] createCrmContactAction failed", message);
    return { success: false, error: message };
  }
}

// ── Conversation helpers ──────────────────────────────────────────────────────

async function ensureCrmConversation(
  prisma: PrismaClient,
  contact: { id: string; clientId: string; name: string },
  subject?: string | null
) {
  const existing = await prisma.conversation.findFirst({
    where: { requestType: "crm", requestId: contact.id },
    select: { id: true },
  });
  if (existing) return existing.id;

  const conversation = await prisma.conversation.create({
    data: {
      requestType: "crm",
      requestId: contact.id,
      clientId: contact.clientId,
      subject: subject?.trim() || `Conversation with ${contact.name}`,
    },
    select: { id: true },
  });
  return conversation.id;
}

async function touchConversation(prisma: PrismaClient, conversationId: string, subject?: string | null) {
  await prisma.conversation
    .update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
        ...(subject?.trim() ? { subject: subject.trim().slice(0, 180) } : {}),
      },
    })
    .catch(() => undefined);
}

// ── Send a message (optionally logging the received email first) ──────────────

const sendMessageSchema = z.object({
  locale: localeSchema,
  contactId: z.string().min(1),
  to: z.string().trim().toLowerCase().email().max(180),
  subject: z.string().trim().min(2).max(180),
  body: z.string().trim().min(1).max(12_000),
  inboundFrom: z.string().trim().max(180).optional().or(z.literal("")),
  inboundSubject: z.string().trim().max(180).optional().or(z.literal("")),
  inboundBody: z.string().trim().max(12_000).optional().or(z.literal("")),
});

export async function sendCrmMessageAction(_prevState: CrmFormState, formData: FormData): Promise<CrmFormState> {
  try {
    const actor = await requireAdmin("requests.manage");
    const prisma = requireDatabase();
    const data = sendMessageSchema.parse({
      locale: value(formData, "locale"),
      contactId: value(formData, "contactId"),
      to: value(formData, "to"),
      subject: value(formData, "subject"),
      body: value(formData, "body"),
      inboundFrom: value(formData, "inboundFrom"),
      inboundSubject: value(formData, "inboundSubject"),
      inboundBody: value(formData, "inboundBody"),
    });

    const contact = await prisma.clientContact.findUnique({
      where: { id: data.contactId },
      include: { client: { select: { id: true, name: true } } },
    });
    if (!contact) throw new Error("The contact no longer exists.");

    const from = fromAddress();
    const replyTo = replyToAddress();
    const body = cleanBody(data.body);
    const subject = sanitizeText(data.subject);
    const inboundBody = data.inboundBody ? cleanBody(data.inboundBody, 8_000) : "";

    await sendOutboundEmail({
      to: data.to,
      from,
      replyTo,
      subject,
      body,
    });

    const conversationId = await ensureCrmConversation(
      prisma,
      { id: contact.id, clientId: contact.clientId, name: contact.name },
      subject
    );

    // The received email is stored only after the reply is delivered, so a
    // failed provider call cannot leave a thread that looks half-sent. The
    // inbound message is still a real record of what the contact wrote.
    if (inboundBody) {
      await prisma.conversationMessage.create({
        data: {
          conversationId,
          channel: "email",
          direction: "inbound",
          from: data.inboundFrom ? sanitizeText(data.inboundFrom) : contact.email || "contact",
          to: from,
          subject: data.inboundSubject ? sanitizeText(data.inboundSubject) : "Received email",
          body: inboundBody,
        },
      });
    }

    await prisma.conversationMessage.create({
      data: {
        conversationId,
        channel: "email",
        direction: "outbound",
        from,
        to: data.to,
        subject,
        body,
        sentById: actor.id,
      },
    });
    await touchConversation(prisma, conversationId, subject);

    await writeAuditLog({
      actorId: actor.id,
      action: "crm.message_sent",
      entityType: "Conversation",
      entityId: conversationId,
      metadata: { contactId: contact.id, to: data.to, loggedInbound: Boolean(inboundBody) },
    });
    revalidateCrm(data.locale);
    return { success: true, contactId: contact.id, conversationId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send the message.";
    console.error("[crm] sendCrmMessageAction failed", message);
    return { success: false, error: message };
  }
}

// ── Log a received email without replying ─────────────────────────────────────

const logInboundSchema = z.object({
  locale: localeSchema,
  contactId: z.string().min(1),
  from: z.string().trim().max(180).optional().or(z.literal("")),
  subject: z.string().trim().max(180).optional().or(z.literal("")),
  body: z.string().trim().min(1).max(12_000),
});

export async function logCrmInboundAction(_prevState: CrmFormState, formData: FormData): Promise<CrmFormState> {
  try {
    const actor = await requireAdmin("requests.manage");
    const prisma = requireDatabase();
    const data = logInboundSchema.parse({
      locale: value(formData, "locale"),
      contactId: value(formData, "contactId"),
      from: value(formData, "from"),
      subject: value(formData, "subject"),
      body: value(formData, "body"),
    });

    const contact = await prisma.clientContact.findUnique({
      where: { id: data.contactId },
      select: { id: true, clientId: true, name: true, email: true },
    });
    if (!contact) throw new Error("The contact no longer exists.");

    const conversationId = await ensureCrmConversation(prisma, contact, data.subject || `Conversation with ${contact.name}`);
    await prisma.conversationMessage.create({
      data: {
        conversationId,
        channel: "email",
        direction: "inbound",
        from: data.from ? sanitizeText(data.from) : contact.email || "contact",
        to: fromAddress(),
        subject: data.subject ? sanitizeText(data.subject) : "Received email",
        body: cleanBody(data.body),
      },
    });
    await touchConversation(prisma, conversationId, data.subject);

    await writeAuditLog({
      actorId: actor.id,
      action: "crm.inbound_logged",
      entityType: "Conversation",
      entityId: conversationId,
      metadata: { contactId: contact.id },
    });
    revalidateCrm(data.locale);
    return { success: true, contactId: contact.id, conversationId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to log the received email.";
    console.error("[crm] logCrmInboundAction failed", message);
    return { success: false, error: message };
  }
}

// ── AI draft ──────────────────────────────────────────────────────────────────

export type DraftEmailActionResult =
  | { success: true; subject: string; body: string; model: string }
  | { success: false; error: string };

const draftSchema = z.object({
  locale: localeSchema.default("en"),
  mode: z.enum(["new", "reply"]).default("new"),
  contactName: z.string().trim().max(180).optional(),
  contactEmail: z.string().trim().max(180).optional(),
  companyName: z.string().trim().max(180).optional(),
  clientName: z.string().trim().max(180).optional(),
  context: z.string().trim().max(6000).optional(),
  instruction: z.string().trim().max(2000).optional(),
  inboundSubject: z.string().trim().max(180).optional(),
  inboundBody: z.string().trim().max(12_000).optional(),
  history: z.array(z.object({
    direction: z.string().trim().max(20),
    subject: z.string().trim().max(180).nullish(),
    body: z.string().trim().max(4_000),
    sentAt: z.string().trim().max(60).nullish(),
  })).max(20).optional(),
});

/**
 * Shared by the CRM workspace, request drawers and the AI lead form. It takes a
 * plain object so a client component can call it directly.
 */
export async function draftAdminEmailAction(input: {
  locale?: "en" | "fr";
  mode?: "new" | "reply";
  contactName?: string;
  contactEmail?: string;
  companyName?: string;
  clientName?: string;
  context?: string;
  instruction?: string;
  inboundSubject?: string;
  inboundBody?: string;
  history?: Array<{ direction: string; subject?: string | null; body: string; sentAt?: string | null }>;
}): Promise<DraftEmailActionResult> {
  try {
    await requireAdmin("requests.manage");
    const data = draftSchema.parse(input);
    const draft = await draftAdminEmail({
      mode: data.mode,
      locale: data.locale,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      companyName: data.companyName,
      clientName: data.clientName,
      context: data.context,
      instruction: data.instruction,
      inboundSubject: data.inboundSubject,
      inboundBody: data.inboundBody,
      history: data.history,
    });
    return { success: true, subject: draft.subject, body: draft.body, model: draft.model };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate a draft.";
    console.error("[crm] draftAdminEmailAction failed", message);
    return { success: false, error: message };
  }
}
