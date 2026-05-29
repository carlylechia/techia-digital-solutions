import type { LeadStatus } from "@prisma/client";
import { ensureDefaultAdminRoles } from "./bootstrap";

const statusOptions = ["NEW", "CONTACTED", "DISCOVERY_BOOKED", "PROPOSAL_SENT", "NEGOTIATING", "WON", "LOST", "FOLLOW_UP_LATER"] as const;

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function dateLabel(value: Date | null | undefined) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(value);
}

type AdminFeedbackRow = {
  id: string;
  projectId: string | null;
  projectTitle: string | null;
  projectSlug: string | null;
  projectPublicSlug: string | null;
  name: string;
  role: string | null;
  company: string | null;
  email: string | null;
  rating: number | null;
  quote: string;
  locale: "en" | "fr" | null;
  source: string;
  status: string;
  showOnHomepage: boolean;
  showOnFounder: boolean;
  showOnPortfolio: boolean;
  displayOrder: number;
  consent: boolean;
  internalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

async function loadAdminFeedback(prisma: NonNullable<ReturnType<typeof import("@/lib/prisma").getPrisma>>) {
  try {
    const feedback = await prisma.$queryRaw<AdminFeedbackRow[]>`
      SELECT
        cf."id",
        cf."projectId",
        cp."title" AS "projectTitle",
        cp."slug" AS "projectSlug",
        cp."publicSlug" AS "projectPublicSlug",
        cf."name",
        cf."role",
        cf."company",
        cf."email",
        cf."rating",
        cf."quote",
        cf."locale",
        cf."source",
        cf."status",
        cf."showOnHomepage",
        cf."showOnFounder",
        cf."showOnPortfolio",
        cf."displayOrder",
        cf."consent",
        cf."internalNotes",
        cf."createdAt",
        cf."updatedAt"
      FROM "CustomerFeedback" cf
      LEFT JOIN "ClientProject" cp ON cp."id" = cf."projectId"
      ORDER BY cf."status" ASC, cf."createdAt" DESC
      LIMIT 80
    `;

    return feedback.map((item) => ({
      id: item.id,
      projectId: item.projectId,
      project: item.projectId
        ? {
            id: item.projectId,
            title: item.projectTitle,
            slug: item.projectSlug,
            publicSlug: item.projectPublicSlug
          }
        : null,
      name: item.name,
      role: item.role,
      company: item.company,
      email: item.email,
      rating: item.rating,
      quote: item.quote,
      locale: item.locale,
      source: item.source,
      status: item.status,
      showOnHomepage: item.showOnHomepage,
      showOnFounder: item.showOnFounder,
      showOnPortfolio: item.showOnPortfolio,
      displayOrder: item.displayOrder,
      consent: item.consent,
      internalNotes: item.internalNotes,
      createdAt: iso(item.createdAt),
      updatedAt: iso(item.updatedAt)
    }));
  } catch (error) {
    console.error("[admin-dashboard] feedback query fallback", {
      message: error instanceof Error ? error.message : error
    });

    return prisma.customerFeedback.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 80,
      include: { project: { select: { id: true, title: true, slug: true, publicSlug: true } } }
    }).then((feedback) => feedback.map((item) => ({
      id: item.id,
      projectId: item.projectId,
      project: item.project,
      name: item.name,
      role: item.role,
      company: item.company,
      email: item.email,
      rating: item.rating,
      quote: item.quote,
      locale: item.locale,
      source: item.source,
      status: item.status,
      showOnHomepage: false,
      showOnFounder: item.showOnFounder,
      showOnPortfolio: item.showOnPortfolio,
      displayOrder: item.displayOrder,
      consent: item.consent,
      internalNotes: item.internalNotes,
      createdAt: iso(item.createdAt),
      updatedAt: iso(item.updatedAt)
    })));
  }
}

export async function loadAdminDashboardData(prisma: NonNullable<ReturnType<typeof import("@/lib/prisma").getPrisma>>) {
  await ensureDefaultAdminRoles(prisma);

  const [
    leadCount,
    contactCount,
    demoCount,
    inquiryCount,
    subscriberCount,
    clientCount,
    activeProjectCount,
    pageCount,
    taskCount,
    adminCount,
    feedbackCount,
    pendingFeedbackCount,
    leadStatuses,
    contactStatuses,
    demoStatuses,
    leads,
    contacts,
    demos,
    inquiries,
    subscribers,
    roles,
    admins,
    clients,
    projects,
    pages,
    conversations,
    boards,
    auditLogs,
    navItems
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.contactMessage.count(),
    prisma.demoRequest.count(),
    prisma.projectInquiry.count(),
    prisma.newsletterSubscriber.count(),
    prisma.client.count(),
    prisma.clientProject.count({ where: { status: { in: ["PLANNED", "ACTIVE", "REVIEW"] } } }),
    prisma.contentPage.count(),
    prisma.processTask.count(),
    prisma.adminUser.count(),
    prisma.customerFeedback.count(),
    prisma.customerFeedback.count({ where: { status: "PENDING" } }),
    prisma.lead.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.contactMessage.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.demoRequest.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { client: { select: { id: true, name: true, slug: true } } } }),
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { client: { select: { id: true, name: true, slug: true } } } }),
    prisma.demoRequest.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { client: { select: { id: true, name: true, slug: true } } } }),
    prisma.projectInquiry.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { lead: true, client: { select: { id: true, name: true, slug: true } } } }),
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.adminRole.findMany({ orderBy: [{ level: "desc" }, { label: "asc" }], include: { _count: { select: { users: true } } } }),
    prisma.adminUser.findMany({ orderBy: { createdAt: "desc" }, take: 24, include: { roleRef: true, createdBy: { select: { name: true, email: true } } } }),
    prisma.client.findMany({
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 18,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        contacts: { orderBy: { createdAt: "asc" }, take: 2 },
        projects: { orderBy: { updatedAt: "desc" }, take: 3 },
        portalAccess: { select: { code: true, isActive: true, expiresAt: true, lastUsedAt: true } },
        portalMessages: {
          orderBy: { createdAt: "desc" },
          take: 24,
          include: {
            admin: { select: { id: true, name: true, email: true } },
            replies: {
              orderBy: { createdAt: "asc" },
              include: {
                admin: { select: { id: true, name: true, email: true } }
              }
            }
          }
        },
        portalRequirements: {
          orderBy: { updatedAt: "desc" },
          take: 24,
          include: {
            project: { select: { id: true, title: true } }
          }
        },
        portalFiles: {
          orderBy: { createdAt: "desc" },
          take: 60,
          include: {
            project: { select: { id: true, title: true } },
            admin: { select: { id: true, name: true, email: true } }
          }
        },
        portalPayments: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            projects: {
              include: { project: { select: { id: true, title: true } } }
            },
            invoices: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                invoiceNumber: true,
                title: true,
                amount: true,
                currency: true,
                status: true,
                notes: true,
                dueDate: true,
                paidAt: true,
                confirmedAt: true,
                proofOfPaymentUrl: true,
                proofOfPaymentName: true,
                proofRequired: true,
                createdAt: true,
                projectId: true,
              }
            }
          }
        },
        portalInvoices: {
          where: { paymentId: null },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            invoiceNumber: true,
            title: true,
            amount: true,
            currency: true,
            status: true,
            notes: true,
            dueDate: true,
            paidAt: true,
            confirmedAt: true,
            proofOfPaymentUrl: true,
            proofOfPaymentName: true,
            proofRequired: true,
            createdAt: true,
            projectId: true,
            paymentId: true,
          }
        }
      }
    }),
    prisma.clientProject.findMany({
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
      take: 18,
      include: {
        client: { select: { id: true, name: true, slug: true, status: true } },
        owner: { select: { id: true, name: true, email: true } }
      }
    }),
    prisma.contentPage.findMany({
      orderBy: { updatedAt: "desc" },
      take: 18,
      include: {
        author: { select: { id: true, name: true, email: true } },
        translations: { orderBy: { locale: "asc" }, select: { id: true, locale: true, title: true, excerpt: true, updatedAt: true } }
      }
    }),
    prisma.conversation.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        messages: { orderBy: { sentAt: "asc" }, include: { sentBy: { select: { id: true, name: true, email: true } } } }
      }
    }),
    prisma.processBoard.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        columns: { orderBy: { position: "asc" } },
        tasks: {
          orderBy: [{ position: "asc" }, { createdAt: "desc" }],
          take: 300,
          include: {
            client: { select: { id: true, name: true } },
            project: { select: { id: true, title: true } },
            assignee: { select: { id: true, name: true, email: true } }
          }
        }
      }
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 18,
      include: { actor: { select: { name: true, email: true } } }
    }),
    prisma.navMenuItem.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] })
  ]);

  const toCounts = (items: { status: LeadStatus; _count: { status: number } }[]) => {
    const counts = Object.fromEntries(statusOptions.map((status) => [status, 0])) as Record<(typeof statusOptions)[number], number>;
    for (const item of items) counts[item.status] = item._count.status;
    return counts;
  };

  return {
    stats: {
      leads: leadCount,
      contacts: contactCount,
      demos: demoCount,
      inquiries: inquiryCount,
      subscribers: subscriberCount,
      clients: clientCount,
      activeProjects: activeProjectCount,
      pages: pageCount,
      tasks: taskCount,
      admins: adminCount,
      feedback: feedbackCount,
      pendingFeedback: pendingFeedbackCount
    },
    statusCounts: {
      lead: toCounts(leadStatuses),
      contact: toCounts(contactStatuses),
      demo: toCounts(demoStatuses)
    },
    leads: leads.map((lead) => ({
      ...lead,
      createdAt: iso(lead.createdAt),
      updatedAt: iso(lead.updatedAt)
    })),
    contacts: contacts.map((contact) => ({
      ...contact,
      createdAt: iso(contact.createdAt),
      updatedAt: iso(contact.updatedAt)
    })),
    demos: demos.map((demo) => ({
      ...demo,
      createdAt: iso(demo.createdAt),
      updatedAt: iso(demo.updatedAt)
    })),
    inquiries: inquiries.map((inquiry) => ({
      ...inquiry,
      createdAt: iso(inquiry.createdAt),
      updatedAt: iso(inquiry.updatedAt),
      internalNotes: inquiry.internalNotes,
      clientId: inquiry.clientId,
      convertedToTaskId: inquiry.convertedToTaskId,
      client: inquiry.client ?? null,
      lead: inquiry.lead
        ? {
            ...inquiry.lead,
            createdAt: iso(inquiry.lead.createdAt),
            updatedAt: iso(inquiry.lead.updatedAt)
          }
        : null
    })),
    subscribers: subscribers.map((subscriber) => ({
      ...subscriber,
      createdAt: iso(subscriber.createdAt)
    })),
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      label: role.label,
      description: role.description,
      level: role.level,
      permissions: role.permissions,
      users: role._count.users,
      createdAt: iso(role.createdAt),
      updatedAt: iso(role.updatedAt)
    })),
    admins: admins.map((admin) => ({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.roleRef?.label || admin.role,
      roleName: admin.roleRef?.name || admin.role,
      roleLevel: admin.roleRef?.level || 50,
      roleId: admin.roleId,
      status: admin.status,
      lastLoginAt: iso(admin.lastLoginAt),
      createdAt: iso(admin.createdAt),
      createdBy: admin.createdBy?.name || admin.createdBy?.email || null
    })),
    clients: clients.map((client) => ({
      id: client.id,
      name: client.name,
      slug: client.slug,
      industry: client.industry,
      status: client.status,
      priority: client.priority,
      contactName: client.contactName,
      contactRole: client.contactRole,
      email: client.email,
      phone: client.phone,
      website: client.website,
      country: client.country,
      city: client.city,
      estimatedValue: client.estimatedValue,
      source: client.source,
      tags: client.tags,
      notes: client.notes,
      owner: client.owner,
      contacts: client.contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        role: contact.role,
        email: contact.email,
        phone: contact.phone,
        isPrimary: contact.isPrimary
      })),
      projects: client.projects.map((project) => ({
        id: project.id,
        title: project.title,
        status: project.status,
        priority: project.priority,
        progress: project.status === "DELIVERED" ? 100 : project.progress,
        dueDate: iso(project.dueDate)
      })),
      portalAccess: client.portalAccess
        ? {
            code: client.portalAccess.code,
            isActive: client.portalAccess.isActive,
            expiresAt: iso(client.portalAccess.expiresAt),
            lastUsedAt: iso(client.portalAccess.lastUsedAt),
          }
        : null,
      portalMessages: client.portalMessages.map((message) => ({
        id: message.id,
        subject: message.subject,
        body: message.body,
        fromAdmin: message.fromAdmin,
        admin: message.admin,
        readAt: iso(message.readAt),
        createdAt: iso(message.createdAt),
        updatedAt: iso(message.updatedAt),
        replies: message.replies.map((reply) => ({
          id: reply.id,
          body: reply.body,
          fromAdmin: reply.fromAdmin,
          admin: reply.admin,
          readAt: iso(reply.readAt),
          createdAt: iso(reply.createdAt)
        }))
      })),
      portalRequirements: client.portalRequirements.map((requirement) => ({
        id: requirement.id,
        project: requirement.project,
        title: requirement.title,
        description: requirement.description,
        type: requirement.type,
        status: requirement.status,
        dueDate: iso(requirement.dueDate),
        submittedAt: iso(requirement.submittedAt),
        response: requirement.response,
        fileUrl: requirement.fileUrl,
        createdAt: iso(requirement.createdAt),
        updatedAt: iso(requirement.updatedAt)
      })),
      portalFiles: client.portalFiles.map((file) => ({
        id: file.id,
        project: file.project,
        name: file.name,
        fileType: file.fileType,
        category: file.category,
        url: file.url,
        size: file.size,
        uploadedBy: file.uploadedBy,
        status: file.status,
        notes: file.notes,
        admin: file.admin,
        createdAt: iso(file.createdAt),
        updatedAt: iso(file.updatedAt),
      })),
      portalPayments: client.portalPayments.map((payment) => {
        const paidViaInvoices = payment.invoices
          .filter((inv) => inv.status === "PAID")
          .reduce((sum, inv) => sum + inv.amount, 0);
        const totalPaid = payment.initialPayment + paidViaInvoices;
        return {
          id: payment.id,
          title: payment.title,
          description: payment.description,
          totalAmount: payment.totalAmount,
          initialPayment: payment.initialPayment,
          paidAmount: totalPaid,
          remainingAmount: Math.max(0, payment.totalAmount - totalPaid),
          currency: payment.currency,
          status: payment.status,
          notes: payment.notes,
          projects: payment.projects.map((pp) => pp.project),
          invoices: payment.invoices.map((inv) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            title: inv.title,
            amount: inv.amount,
            currency: inv.currency,
            status: inv.status,
            notes: inv.notes,
            dueDate: iso(inv.dueDate),
            paidAt: iso(inv.paidAt),
            confirmedAt: iso(inv.confirmedAt),
            proofOfPaymentUrl: inv.proofOfPaymentUrl,
            proofOfPaymentName: inv.proofOfPaymentName,
            proofRequired: inv.proofRequired,
            projectId: inv.projectId,
            createdAt: iso(inv.createdAt),
          })),
          createdAt: iso(payment.createdAt),
        };
      }),
      standaloneInvoices: client.portalInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        title: inv.title,
        amount: inv.amount,
        currency: inv.currency,
        status: inv.status,
        notes: inv.notes,
        dueDate: iso(inv.dueDate),
        paidAt: iso(inv.paidAt),
        confirmedAt: iso(inv.confirmedAt),
        proofOfPaymentUrl: inv.proofOfPaymentUrl,
        proofOfPaymentName: inv.proofOfPaymentName,
        proofRequired: inv.proofRequired,
        projectId: inv.projectId,
        paymentId: inv.paymentId,
        createdAt: iso(inv.createdAt),
      })),
      preferredLocale: client.preferredLocale,
      createdAt: iso(client.createdAt),
      updatedAt: iso(client.updatedAt)
    })),
    projects: projects.map((project) => ({
      id: project.id,
      clientId: project.clientId,
      client: project.client,
      owner: project.owner,
      title: project.title,
      slug: project.slug,
      status: project.status,
      priority: project.priority,
      description: project.description,
      budget: project.budget,
      progress: project.status === "DELIVERED" ? 100 : project.progress,
      startDate: iso(project.startDate),
      dueDate: iso(project.dueDate),
      dueLabel: dateLabel(project.dueDate),
      showInPortfolio: project.showInPortfolio,
      showOnHomepage: project.showOnHomepage,
      showInFounder: project.showInFounder,
      publicOrder: project.publicOrder,
      publicSlug: project.publicSlug,
      publicTitleEn: project.publicTitleEn,
      publicTitleFr: project.publicTitleFr,
      publicEyebrowEn: project.publicEyebrowEn,
      publicEyebrowFr: project.publicEyebrowFr,
      publicDescriptionEn: project.publicDescriptionEn,
      publicDescriptionFr: project.publicDescriptionFr,
      publicProblemEn: project.publicProblemEn,
      publicProblemFr: project.publicProblemFr,
      publicSolutionEn: project.publicSolutionEn,
      publicSolutionFr: project.publicSolutionFr,
      publicRoleEn: project.publicRoleEn,
      publicRoleFr: project.publicRoleFr,
      publicBusinessValueEn: project.publicBusinessValueEn,
      publicBusinessValueFr: project.publicBusinessValueFr,
      publicTechStack: project.publicTechStack,
      createdAt: iso(project.createdAt),
      updatedAt: iso(project.updatedAt)
    })),
    pages: pages.map((page) => ({
      id: page.id,
      slug: page.slug,
      type: page.type,
      status: page.status,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      sections: page.sections ?? null,
      publishedAt: iso(page.publishedAt),
      author: page.author,
      translations: page.translations.map((translation) => ({
        ...translation,
        updatedAt: iso(translation.updatedAt)
      })),
      createdAt: iso(page.createdAt),
      updatedAt: iso(page.updatedAt)
    })),
    boards: boards.map((board) => ({
      id: board.id,
      name: board.name,
      description: board.description,
      status: board.status,
      boardType: board.boardType,
      nextBoardId: board.nextBoardId,
      viewerRoles: board.viewerRoles,
      owner: board.owner,
      columns: board.columns.map((column) => ({
        id: column.id,
        key: column.key,
        title: column.title,
        color: column.color,
        position: column.position
      })),
      tasks: board.tasks.map((task) => ({
        id: task.id,
        boardId: task.boardId,
        columnId: task.columnId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        position: task.position,
        dueDate: iso(task.dueDate),
        tags: task.tags,
        archived: task.archived,
        requestType: task.requestType,
        requestId: task.requestId,
        client: task.client,
        project: task.project,
        assignee: task.assignee,
        createdAt: iso(task.createdAt),
        updatedAt: iso(task.updatedAt)
      })),
      createdAt: iso(board.createdAt),
      updatedAt: iso(board.updatedAt)
    })),
    auditLogs: auditLogs.map((log) => ({
      id: log.id,
      actor: log.actor?.name || log.actor?.email || "System",
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      createdAt: iso(log.createdAt)
    })),
    navItems: navItems.map((item) => ({
      id: item.id,
      labelEn: item.labelEn,
      labelFr: item.labelFr,
      href: item.href,
      visible: item.visible,
      position: item.position,
      openNewTab: item.openNewTab
    })),
    conversations: conversations.map((conv) => ({
      id: conv.id,
      requestType: conv.requestType,
      requestId: conv.requestId,
      clientId: conv.clientId,
      subject: conv.subject,
      createdAt: iso(conv.createdAt),
      updatedAt: iso(conv.updatedAt),
      messages: conv.messages.map((msg) => ({
        id: msg.id,
        channel: msg.channel,
        direction: msg.direction,
        from: msg.from,
        to: msg.to,
        subject: msg.subject,
        body: msg.body,
        sentAt: iso(msg.sentAt),
        sentBy: msg.sentBy
      }))
    })),
    feedback: await loadAdminFeedback(prisma)
  };
}

export type AdminDashboardData = Awaited<ReturnType<typeof loadAdminDashboardData>>;
