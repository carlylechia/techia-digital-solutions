"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/sanitize";
import { getPortalSession, signPortalToken, setPortalSessionCookie, clearPortalSessionCookie, validatePortalCredentials } from "@/lib/portal-auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function portalLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const code = String(formData.get("code") || "").trim().toUpperCase();

  if (!email || !code) return { error: "Please enter your email and access code." };

  const result = await validatePortalCredentials(email, code);
  if (!result) return { error: "Invalid email or access code. Please check your credentials." };

  const token = await signPortalToken(result.session);
  const cookieStore = await cookies();
  const cookieOpts = setPortalSessionCookie(token);

  // Clear legacy cookie path from older releases to avoid duplicate cookies.
  cookieStore.set(cookieOpts.name, "", {
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: "/client-portal",
    maxAge: 0,
  });

  cookieStore.set(cookieOpts.name, cookieOpts.value, {
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: cookieOpts.path,
    maxAge: cookieOpts.maxAge,
  });

  return { success: true, clientId: result.session.clientId };
}

export async function portalLogoutAction() {
  const cookieStore = await cookies();
  const cookieOpts = clearPortalSessionCookie();

  // Clear both current and legacy cookie paths.
  cookieStore.set(cookieOpts.name, cookieOpts.value, {
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: "/client-portal",
    maxAge: cookieOpts.maxAge,
  });

  cookieStore.set(cookieOpts.name, cookieOpts.value, {
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: cookieOpts.path,
    maxAge: cookieOpts.maxAge,
  });
  return { success: true };
}

async function requirePortalSession() {
  const session = await getPortalSession();
  if (!session) throw new Error("Not authenticated");
  return session;
}

function requirePortalDatabase() {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");
  return prisma;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function sendPortalReplyAction(formData: FormData) {
  const session = await requirePortalSession();
  const prisma = requirePortalDatabase();

  const messageId = String(formData.get("messageId") || "").trim();
  const body = sanitizeText(String(formData.get("body") || ""));

  if (!messageId || !body) return { error: "Message is required." };
  if (body.length > 5000) return { error: "Message is too long." };

  const message = await prisma.portalMessage.findUnique({ where: { id: messageId } });
  if (!message || message.clientId !== session.clientId) return { error: "Message not found." };

  await prisma.portalMessageReply.create({
    data: {
      messageId,
      body,
      fromAdmin: false,
    },
  });

  // Create notification for admin (via audit or email - handled separately)
  await prisma.portalNotification.create({
    data: {
      clientId: session.clientId,
      type: "message_reply",
      title: "New reply from client",
      body: body.slice(0, 100),
      link: `/client-portal/messages`,
    },
  });

  revalidatePath("/client-portal/messages");
  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

export async function markMessageReadAction(messageId: string) {
  const session = await requirePortalSession();
  const prisma = requirePortalDatabase();

  const message = await prisma.portalMessage.findUnique({ where: { id: messageId } });
  if (!message || message.clientId !== session.clientId) return;

  if (!message.readAt) {
    await prisma.portalMessage.update({
      where: { id: messageId },
      data: { readAt: new Date() },
    });
  }

  revalidatePath("/client-portal/messages");
}

// ─── Files ────────────────────────────────────────────────────────────────────

export async function uploadPortalFileAction(formData: FormData) {
  const session = await requirePortalSession();
  const prisma = requirePortalDatabase();

  const file = formData.get("file") as File | null;
  const name = sanitizeText(String(formData.get("name") || ""));
  const category = String(formData.get("category") || "requirement");
  const requirementId = String(formData.get("requirementId") || "").trim() || undefined;

  if (!file || file.size === 0) return { error: "No file selected." };
  if (file.size > 50 * 1024 * 1024) return { error: "File is too large (max 50MB)." };
  if (!name) return { error: "File name is required." };

  let url = "";
  let publicId: string | undefined;

  try {
    const result = await uploadToCloudinary(file, `portal/${session.clientId}`);
    url = result.secure_url;
    publicId = result.public_id;
  } catch {
    // Fallback: if Cloudinary not configured, use a placeholder
    url = "#not-uploaded";
    publicId = undefined;
  }

  const portalFile = await prisma.portalFile.create({
    data: {
      clientId: session.clientId,
      name,
      fileType: file.type || "application/octet-stream",
      category,
      url,
      publicId,
      size: file.size,
      uploadedBy: "client",
      status: "submitted",
    },
  });

  // If linked to a requirement, update the requirement
  if (requirementId) {
    await prisma.portalRequirement.update({
      where: { id: requirementId, clientId: session.clientId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        fileUrl: url,
        filePublicId: publicId,
      },
    });
  }

  await prisma.portalNotification.create({
    data: {
      clientId: session.clientId,
      type: "file_uploaded",
      title: `File uploaded: ${name}`,
      body: `${name} was uploaded by client`,
      link: `/client-portal/files`,
    },
  });

  revalidatePath("/client-portal/files");
  revalidatePath("/[locale]/admin", "layout");
  return { success: true, fileId: portalFile.id };
}

// ─── Requirements ─────────────────────────────────────────────────────────────

export async function submitRequirementResponseAction(formData: FormData) {
  const session = await requirePortalSession();
  const prisma = requirePortalDatabase();

  const requirementId = String(formData.get("requirementId") || "").trim();
  const response = sanitizeText(String(formData.get("response") || ""));
  const file = formData.get("file") as File | null;

  if (!requirementId) return { error: "Invalid request." };

  const req = await prisma.portalRequirement.findUnique({ where: { id: requirementId } });
  if (!req || req.clientId !== session.clientId) return { error: "Requirement not found." };

  let uploadedFileUrl: string | undefined;
  let uploadedFilePublicId: string | undefined;

  if (file && file.size > 0) {
    if (file.size > 50 * 1024 * 1024) return { error: "File is too large (max 50MB)." };

    try {
      const upload = await uploadToCloudinary(file, `portal/${session.clientId}/requirements`);
      uploadedFileUrl = upload.secure_url;
      uploadedFilePublicId = upload.public_id;

      await prisma.portalFile.create({
        data: {
          clientId: session.clientId,
          projectId: req.projectId,
          name: file.name,
          fileType: file.type || "application/octet-stream",
          category: "DOCUMENT",
          url: upload.secure_url,
          publicId: upload.public_id,
          size: file.size,
          uploadedBy: "client",
          status: "PENDING",
          notes: `Attached to requirement: ${req.title}`,
        },
      });
    } catch {
      return { error: "Could not upload your attachment. Please try again." };
    }
  }

  await prisma.portalRequirement.update({
    where: { id: requirementId },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      response: response || undefined,
      fileUrl: uploadedFileUrl || req.fileUrl,
      filePublicId: uploadedFilePublicId || req.filePublicId,
    },
  });

  revalidatePath("/client-portal/requirements");
  revalidatePath("/client-portal/files");
  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

// ─── Feedback ────────────────────────────────────────────────────────────────

const feedbackSchema = z.object({
  projectId: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  quote: z.string().trim().min(10).max(2000),
  name: z.string().trim().min(2).max(120),
  role: z.string().trim().max(120).optional(),
  company: z.string().trim().max(120).optional(),
  consent: z.preprocess((v) => v === "true" || v === "on", z.boolean()),
});

export async function submitPortalFeedbackAction(formData: FormData) {
  const session = await requirePortalSession();
  const prisma = requirePortalDatabase();

  const entries: Record<string, FormDataEntryValue> = {};
  for (const [k, v] of formData.entries()) entries[k] = v;

  const parsed = feedbackSchema.safeParse(entries);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid feedback." };
  }

  const data = parsed.data;

  await prisma.customerFeedback.create({
    data: {
      projectId: data.projectId || undefined,
      name: data.name,
      role: data.role || undefined,
      company: data.company || undefined,
      email: session.clientEmail,
      rating: data.rating,
      quote: data.quote,
      source: "client_portal",
      status: "PENDING",
      consent: data.consent,
    },
  });

  revalidatePath("/client-portal/feedback");
  return { success: true };
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function markInvoiceAsPaidAction(formData: FormData) {
  const session = await requirePortalSession();
  const prisma = requirePortalDatabase();

  const invoiceId = String(formData.get("invoiceId") || "").trim();
  if (!invoiceId) return { error: "Invalid request." };

  const invoice = await prisma.portalInvoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, clientId: true, title: true, status: true, proofRequired: true },
  });
  if (!invoice || invoice.clientId !== session.clientId) return { error: "Invoice not found." };

  if (invoice.status !== "SENT" && invoice.status !== "OVERDUE") {
    return { error: "This invoice cannot be marked as paid in its current state." };
  }

  // Handle optional / required proof-of-payment upload
  const proofFile = formData.get("proofFile") as File | null;
  const hasFile = proofFile && proofFile.size > 0;

  if (invoice.proofRequired && !hasFile) {
    return { error: "Proof of payment is required for this invoice. Please attach a screenshot or document before submitting." };
  }

  let proofOfPaymentUrl: string | undefined;
  let proofOfPaymentName: string | undefined;

  if (hasFile) {
    if (proofFile!.size > 20 * 1024 * 1024) return { error: "File is too large (max 20 MB)." };

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(proofFile!.type)) {
      return { error: "Only images (JPG, PNG, WebP) and documents (PDF, DOC, DOCX) are accepted." };
    }

    try {
      const upload = await uploadToCloudinary(proofFile!, `portal/${session.clientId}/proofs`, { forcePublic: true });
      proofOfPaymentUrl = upload.secure_url;
      proofOfPaymentName = proofFile!.name || "proof-of-payment";
    } catch {
      return { error: "Could not upload your proof of payment. Please try again." };
    }
  }

  await prisma.portalInvoice.update({
    where: { id: invoiceId },
    data: {
      status: "AWAITING_CONFIRMATION",
      ...(proofOfPaymentUrl ? { proofOfPaymentUrl, proofOfPaymentName } : {}),
    },
  });

  // Notify admin via portal notification (admin reads these)
  await prisma.portalNotification.create({
    data: {
      clientId: session.clientId,
      type: "PAYMENT_CLAIMED",
      title: "Client marked invoice as paid",
      body: `${invoice.title} — ${session.clientName} has claimed payment${hasFile ? " (proof attached)" : ""}. Please confirm.`,
      link: `/client-portal/invoices`,
    },
  });

  revalidatePath("/client-portal/invoices");
  revalidatePath("/[locale]/admin", "layout");
  return { success: true };
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function markAllNotificationsReadAction() {
  const session = await requirePortalSession();
  const prisma = requirePortalDatabase();

  await prisma.portalNotification.updateMany({
    where: { clientId: session.clientId, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/client-portal");
  return { success: true };
}
