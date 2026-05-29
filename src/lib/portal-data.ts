import { getPrisma } from "@/lib/prisma";

function iso(d: Date | null | undefined) {
  return d ? d.toISOString() : null;
}

export async function loadPortalPayments(clientId: string) {
  const prisma = getPrisma();
  if (!prisma) return [];

  const payments = await prisma.portalPayment.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    include: {
      projects: {
        include: { project: { select: { id: true, title: true, status: true } } },
      },
      invoices: {
        orderBy: { createdAt: "asc" },
        include: { project: { select: { id: true, title: true } } },
      },
    },
  });

  return payments.map((p) => {
    const paidViaInvoices = p.invoices
      .filter((inv) => inv.status === "PAID")
      .reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = p.initialPayment + paidViaInvoices;
    const remainingAmount = Math.max(0, p.totalAmount - totalPaid);

    return {
      id: p.id,
      clientId: p.clientId,
      title: p.title,
      description: p.description,
      totalAmount: p.totalAmount,
      initialPayment: p.initialPayment,
      paidAmount: totalPaid,
      remainingAmount,
      currency: p.currency,
      status: p.status,
      notes: p.notes,
      projects: p.projects.map((pp) => pp.project),
      invoices: p.invoices.map((inv) => ({
        ...inv,
        lineItems: inv.lineItems as Array<{ description: string; quantity: number; unitPrice: number }> | null,
        dueDate: iso(inv.dueDate),
        paidAt: iso(inv.paidAt),
        confirmedAt: iso(inv.confirmedAt),
        createdAt: iso(inv.createdAt),
        updatedAt: iso(inv.updatedAt),
      })),
      createdAt: iso(p.createdAt),
      updatedAt: iso(p.updatedAt),
    };
  });
}

export async function loadPortalOverview(clientId: string) {
  const prisma = getPrisma();
  if (!prisma) return null;

  const [client, projects, messages, files, invoices, requirements, notifications] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        status: true,
        industry: true,
      },
    }),
    prisma.clientProject.findMany({
      where: { clientId },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 10,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        progress: true,
        description: true,
        dueDate: true,
        startDate: true,
        budget: true,
        slug: true,
      },
    }),
    prisma.portalMessage.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        admin: { select: { name: true, email: true } },
        replies: { orderBy: { createdAt: "asc" }, take: 20 },
      },
    }),
    prisma.portalFile.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        fileType: true,
        category: true,
        url: true,
        size: true,
        status: true,
        notes: true,
        createdAt: true,
        project: { select: { id: true, title: true } },
      },
    }),
    prisma.portalInvoice.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        title: true,
        amount: true,
        currency: true,
        status: true,
        dueDate: true,
        paidAt: true,
        createdAt: true,
        project: { select: { id: true, title: true } },
      },
    }),
    prisma.portalRequirement.findMany({
      where: { clientId, status: { in: ["PENDING", "SUBMITTED"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        status: true,
        dueDate: true,
        project: { select: { id: true, title: true } },
      },
    }),
    prisma.portalNotification.findMany({
      where: { clientId, readAt: null },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return {
    client,
    projects: projects.map((p) => ({
      ...p,
      progress: p.status === "DELIVERED" ? 100 : p.progress,
      dueDate: iso(p.dueDate),
      startDate: iso(p.startDate),
    })),
    messages: messages.map((m) => ({
      ...m,
      readAt: iso(m.readAt),
      createdAt: iso(m.createdAt),
      updatedAt: iso(m.updatedAt),
      admin: m.admin,
      replies: m.replies.map((r) => ({
        ...r,
        readAt: iso(r.readAt),
        createdAt: iso(r.createdAt),
      })),
    })),
    files: files.map((f) => ({
      ...f,
      createdAt: iso(f.createdAt),
    })),
    invoices: invoices.map((inv) => ({
      ...inv,
      dueDate: iso(inv.dueDate),
      paidAt: iso(inv.paidAt),
      createdAt: iso(inv.createdAt),
    })),
    requirements: requirements.map((r) => ({
      ...r,
      dueDate: iso(r.dueDate),
    })),
    unreadNotifications: notifications.length,
    notifications: notifications.map((n) => ({
      ...n,
      readAt: iso(n.readAt),
      createdAt: iso(n.createdAt),
    })),
  };
}

export async function loadPortalMessages(clientId: string) {
  const prisma = getPrisma();
  if (!prisma) return [];

  const messages = await prisma.portalMessage.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    include: {
      admin: { select: { name: true, email: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { admin: { select: { name: true, email: true } } },
      },
    },
  });

  return messages.map((m) => ({
    ...m,
    readAt: iso(m.readAt),
    createdAt: iso(m.createdAt),
    updatedAt: iso(m.updatedAt),
    replies: m.replies.map((r) => ({
      ...r,
      readAt: iso(r.readAt),
      createdAt: iso(r.createdAt),
    })),
  }));
}

export async function loadPortalFiles(clientId: string) {
  const prisma = getPrisma();
  if (!prisma) return [];

  const files = await prisma.portalFile.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { id: true, title: true } },
      admin: { select: { name: true } },
    },
  });

  return files.map((f) => ({
    ...f,
    createdAt: iso(f.createdAt),
    updatedAt: iso(f.updatedAt),
  }));
}

export async function loadPortalInvoices(clientId: string) {
  const prisma = getPrisma();
  if (!prisma) return [];

  const invoices = await prisma.portalInvoice.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { id: true, title: true } },
      payment: { select: { id: true, title: true, currency: true } },
    },
  });

  return invoices.map((inv) => ({
    ...inv,
    lineItems: inv.lineItems as Array<{ description: string; quantity: number; unitPrice: number }> | null,
    dueDate: iso(inv.dueDate),
    paidAt: iso(inv.paidAt),
    confirmedAt: iso(inv.confirmedAt),
    createdAt: iso(inv.createdAt),
    updatedAt: iso(inv.updatedAt),
  }));
}

export async function loadPortalProjects(clientId: string) {
  const prisma = getPrisma();
  if (!prisma) return [];

  const projects = await prisma.clientProject.findMany({
    where: { clientId },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      portalFiles: { orderBy: { createdAt: "desc" }, take: 5 },
      portalInvoices: { orderBy: { createdAt: "desc" }, take: 3 },
      portalRequirements: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });

  return projects.map((p) => ({
    ...p,
    progress: p.status === "DELIVERED" ? 100 : p.progress,
    dueDate: iso(p.dueDate),
    startDate: iso(p.startDate),
    completedAt: iso(p.completedAt),
    createdAt: iso(p.createdAt),
    updatedAt: iso(p.updatedAt),
    portalFiles: p.portalFiles.map((f) => ({ ...f, createdAt: iso(f.createdAt), updatedAt: iso(f.updatedAt) })),
    portalInvoices: p.portalInvoices.map((i) => ({ ...i, dueDate: iso(i.dueDate), paidAt: iso(i.paidAt), createdAt: iso(i.createdAt), updatedAt: iso(i.updatedAt) })),
    portalRequirements: p.portalRequirements.map((r) => ({ ...r, dueDate: iso(r.dueDate), submittedAt: iso(r.submittedAt), createdAt: iso(r.createdAt), updatedAt: iso(r.updatedAt) })),
  }));
}

export async function loadPortalRequirements(clientId: string) {
  const prisma = getPrisma();
  if (!prisma) return [];

  const requirements = await prisma.portalRequirement.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { id: true, title: true } },
    },
  });

  return requirements.map((r) => ({
    ...r,
    dueDate: iso(r.dueDate),
    submittedAt: iso(r.submittedAt),
    createdAt: iso(r.createdAt),
    updatedAt: iso(r.updatedAt),
  }));
}

export type PortalOverview = NonNullable<Awaited<ReturnType<typeof loadPortalOverview>>>;
export type PortalMessage = Awaited<ReturnType<typeof loadPortalMessages>>[number];
export type PortalFile = Awaited<ReturnType<typeof loadPortalFiles>>[number];
export type PortalInvoice = Awaited<ReturnType<typeof loadPortalInvoices>>[number];
export type PortalProject = Awaited<ReturnType<typeof loadPortalProjects>>[number];
export type PortalRequirement = Awaited<ReturnType<typeof loadPortalRequirements>>[number];
export type PortalPayment = Awaited<ReturnType<typeof loadPortalPayments>>[number];
