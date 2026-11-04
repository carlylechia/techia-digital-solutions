import "server-only";

import type { PrismaClient } from "@prisma/client";
import type { CrmClient, CrmContact, CrmMessage, CrmWorkspaceData } from "./types";

/**
 * CRM data for the back office.
 *
 * A CRM thread is a normal Conversation with requestType "crm" and
 * requestId = ClientContact.id. That keeps the existing conversation table as
 * the single source of truth for message history and avoids a parallel schema.
 */
export async function loadCrmWorkspace(prisma: PrismaClient): Promise<CrmWorkspaceData> {
  const [clients, conversations] = await Promise.all([
    prisma.client.findMany({
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: 250,
      include: {
        contacts: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          take: 50,
        },
      },
    }),
    prisma.conversation.findMany({
      where: { requestType: "crm" },
      orderBy: { updatedAt: "desc" },
      take: 250,
      include: {
        messages: {
          orderBy: { sentAt: "desc" },
          take: 60,
        },
      },
    }),
  ]);

  const conversationByContact = new Map(
    conversations.map((conversation) => [conversation.requestId, conversation])
  );

  const contacts: CrmContact[] = [];
  const clientRows: CrmClient[] = clients.map((client) => ({
    id: client.id,
    name: client.name,
    status: client.status,
    industry: client.industry,
    city: client.city,
    country: client.country,
    website: client.website,
    email: client.email,
    phone: client.phone,
    contactCount: client.contacts.length,
  }));

  for (const client of clients) {
    for (const contact of client.contacts) {
      const conversation = conversationByContact.get(contact.id) ?? null;
      const messages: CrmMessage[] = conversation
        ? [...conversation.messages]
            .reverse()
            .map((message) => ({
              id: message.id,
              direction: message.direction,
              channel: message.channel,
              from: message.from,
              to: message.to,
              subject: message.subject,
              body: message.body,
              sentAt: message.sentAt.toISOString(),
            }))
        : [];

      contacts.push({
        id: contact.id,
        clientId: client.id,
        clientName: client.name,
        clientStatus: client.status,
        clientIndustry: client.industry,
        clientCity: client.city,
        clientCountry: client.country,
        clientWebsite: client.website,
        name: contact.name,
        role: contact.role,
        email: contact.email,
        phone: contact.phone,
        isPrimary: contact.isPrimary,
        notes: contact.notes,
        createdAt: contact.createdAt.toISOString(),
        conversationId: conversation?.id ?? null,
        conversationSubject: conversation?.subject ?? null,
        messages,
        lastMessageAt: messages.at(-1)?.sentAt ?? null,
      });
    }
  }

  contacts.sort((left, right) => {
    const leftTime = left.lastMessageAt ? Date.parse(left.lastMessageAt) : 0;
    const rightTime = right.lastMessageAt ? Date.parse(right.lastMessageAt) : 0;
    if (leftTime !== rightTime) return rightTime - leftTime;
    return left.name.localeCompare(right.name);
  });

  return {
    contacts,
    clients: clientRows,
    stats: {
      totalContacts: contacts.length,
      contactsWithEmail: contacts.filter((contact) => Boolean(contact.email)).length,
      totalClients: clientRows.length,
      threads: contacts.filter((contact) => contact.conversationId).length,
    },
  };
}

/**
 * A compact, auditable context block for the AI composer. Only values already
 * stored in the CRM are included; nothing is inferred.
 */
export function buildCrmContext(input: {
  contact: Pick<CrmContact, "name" | "role" | "email" | "phone" | "notes">;
  client: Pick<CrmClient, "name" | "status" | "industry" | "city" | "country" | "website" | "email" | "phone">;
}) {
  return [
    `Contact name: ${input.contact.name}`,
    input.contact.role ? `Contact role: ${input.contact.role}` : null,
    input.contact.email ? `Contact email: ${input.contact.email}` : null,
    input.contact.phone ? `Contact phone: ${input.contact.phone}` : null,
    `Client: ${input.client.name}`,
    `Client status: ${input.client.status}`,
    input.client.industry ? `Industry: ${input.client.industry}` : null,
    [input.client.city, input.client.country].filter(Boolean).length
      ? `Location: ${[input.client.city, input.client.country].filter(Boolean).join(", ")}`
      : null,
    input.client.website ? `Website: ${input.client.website}` : null,
    input.contact.notes ? `Contact notes: ${input.contact.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
