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

/** An outreach prospect that was added to the CRM but is not a Client yet. */
export type CrmProspect = {
  id: string;
  businessName: string;
  contactName: string | null;
  contactRole: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  websiteUrl: string | null;
  city: string | null;
  country: string | null;
  industry: string | null;
  status: string;
  qualificationStatus: string | null;
  hasContactInfo: boolean;
  crmImportedAt: string;
  updatedAt: string;
};

export type CrmWorkspaceData = {
  contacts: CrmContact[];
  clients: CrmClient[];
  crmProspects: CrmProspect[];
  outreachProspects: Array<{
    id: string;
    businessName: string;
    publicEmail: string | null;
    publicPhone: string | null;
    contactName: string | null;
    contactRole: string | null;
    crmImportedAt: string | null;
  }>;
  stats: {
    totalContacts: number;
    contactsWithEmail: number;
    totalClients: number;
    totalCrmProspects: number;
    threads: number;
  };
};
