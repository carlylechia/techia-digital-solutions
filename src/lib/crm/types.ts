/** Serializable CRM data shared by the server loader and the client workspace. */

export type CrmMessage = {
  id: string;
  direction: string;
  channel: string;
  from: string;
  to: string;
  subject: string | null;
  body: string;
  sentAt: string;
};

export type CrmContact = {
  id: string;
  clientId: string;
  clientName: string;
  clientStatus: string;
  clientIndustry: string | null;
  clientCity: string | null;
  clientCountry: string | null;
  clientWebsite: string | null;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  notes: string | null;
  createdAt: string;
  conversationId: string | null;
  conversationSubject: string | null;
  messages: CrmMessage[];
  lastMessageAt: string | null;
};

export type CrmClient = {
  id: string;
  name: string;
  status: string;
  industry: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  contactCount: number;
};

export type CrmWorkspaceData = {
  contacts: CrmContact[];
  clients: CrmClient[];
  stats: {
    totalContacts: number;
    contactsWithEmail: number;
    totalClients: number;
    threads: number;
  };
};
