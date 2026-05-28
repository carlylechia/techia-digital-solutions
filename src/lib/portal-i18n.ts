// ── Portal i18n ──────────────────────────────────────────────────────────────
// Typed translation dictionary for the client portal.
// All strings are defined in English first; French mirrors the exact structure.

export type PortalLocale = "en" | "fr";

// ── English ──────────────────────────────────────────────────────────────────
const en = {
  locale: "en" as PortalLocale,
  intlLocale: "en-US",

  // Shell / navigation
  shell: {
    yourWorkspace: "Your workspace",
    navigation: "Navigation",
    client: "Client",
    closeMenu: "Close menu",
    openMenu: "Open menu",
    notifications: "Notifications",
    signOut: "Sign out",
    signingOut: "Signing out…",
    langToggleLabel: "Switch to French",
    langToggleCode: "FR",
  },

  // Navigation labels
  nav: {
    overview: "Overview",
    projects: "Projects",
    messages: "Messages",
    files: "Files",
    invoices: "Invoices",
    requests: "Requests",
    feedback: "Feedback",
  },

  // Login page
  login: {
    badge: "Client portal",
    heading: "Welcome back",
    subheading:
      "Enter your email and the access code provided by teChia to access your workspace.",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    codeLabel: "Access code",
    codePlaceholder: "XXXX-XXXX",
    showCode: "Show code",
    hideCode: "Hide code",
    submit: "Access my workspace",
    submitting: "Signing in…",
    noCode: "Don't have an access code?",
    contactUs: "Contact teChia",
    copyright: (year: number) => `© ${year} teChia Digital Solutions. All rights reserved.`,
    errors: {
      invalidCredentials: "Invalid email or access code. Please try again.",
      networkError: "A network error occurred. Please check your connection and try again.",
    },
  },

  // Overview page
  overview: {
    pageTitle: "Overview",
    pageDescription: "Welcome back. Here's what's happening with your projects.",
    activeProjects: "Active projects",
    unreadMessages: "Unread messages",
    pendingInvoices: "Pending invoices",
    openRequests: "Open requests",
    activeProjectsSection: "Active projects",
    latestMessages: "Latest messages",
    recentFiles: "Recent files",
    viewAll: "View all →",
    noProjectsYet: "No projects yet.",
    noMessagesYet: "No messages yet.",
    noFilesYet: "No files yet.",
    noInvoicesYet: "No invoices yet.",
    pendingRequestsAlert: (n: number) =>
      `You have ${n} pending request${n !== 1 ? "s" : ""}`,
    pendingRequestsSubtext:
      "teChia is waiting for your response to continue your project.",
    respondNow: "Respond now →",
    completed: "Completed",
    projects: "projects",
    filesShared: "Files shared",
    total: "total",
    totalInvoiced: "Total invoiced",
    due: "Due",
    unableToLoad: "Unable to load your workspace. Please try again.",
  },

  // Projects page
  projects: {
    pageTitle: "Projects",
    pageDescription:
      "Live progress, milestones, and delivery status for all your projects.",
    overallProgress: "Overall progress",
    started: (date: string) => `Started ${date}`,
    due: (date: string) => `Due ${date}`,
    delivered: (date: string) => `Delivered ${date}`,
    files: (n: number) => `${n} file${n !== 1 ? "s" : ""}`,
    invoices: (n: number) => `${n} invoice${n !== 1 ? "s" : ""}`,
    requests: (n: number) => `${n} request${n !== 1 ? "s" : ""}`,
    sectionActive: (n: number) => `Active (${n})`,
    sectionOther: "Other projects",
    empty: "No projects yet",
    emptyNote: "Your teChia projects will appear here.",
    status: {
      PLANNED: "Planned",
      ACTIVE: "Active",
      REVIEW: "In Review",
      ON_HOLD: "On Hold",
      DELIVERED: "Delivered",
      ARCHIVED: "Archived",
    } as Record<string, string>,
  },

  // Messages page
  messages: {
    pageTitle: "Messages",
    pageDescription:
      "Communication from your teChia team — updates, questions, and milestone notes.",
    unreadSection: (n: number) => `Unread (${n})`,
    earlierSection: "Earlier",
    newBadge: "New",
    replies: (n: number) => `${n} repl${n === 1 ? "y" : "ies"}`,
    teChiaTeam: "teChia Team",
    you: "You",
    replyPlaceholder: "Write a reply…",
    sendReply: "Send reply",
    sending: "Sending…",
    replySent: "Reply sent!",
    empty: "No messages yet",
    emptyNote: "Messages from your teChia team will appear here.",
  },

  // Files page
  files: {
    pageTitle: "Files",
    pageDescription: "Deliverables, assets, and documents shared for your projects.",
    upload: "Upload file",
    modalTitle: "Upload a file",
    selectFile: "Click to select a file",
    cancel: "Cancel",
    uploadBtn: "Upload",
    uploading: "Uploading…",
    download: "Download",
    empty: "No files found",
    emptyNote: (filter: string) =>
      filter === "ALL"
        ? "Files shared for your projects will appear here."
        : `No ${filter.toLowerCase()} files yet.`,
    categories: {
      ALL: "All files",
      DELIVERABLE: "Deliverable",
      ASSET: "Asset",
      DOCUMENT: "Document",
      DESIGN: "Design",
      CONTRACT: "Contract",
      OTHER: "Other",
    } as Record<string, string>,
    status: {
      PENDING: "pending",
      APPROVED: "approved",
      REJECTED: "rejected",
      ARCHIVED: "archived",
    } as Record<string, string>,
    today: "Today",
    yesterday: "Yesterday",
    daysAgo: (n: number) => `${n}d ago`,
    errors: {
      uploadFailed: "Upload failed",
      networkError: "Network error. Please try again.",
    },
  },

  // Invoices page
  invoices: {
    pageTitle: "Invoices",
    pageDescription: "Milestones, payment status, and invoice history for your projects.",
    summaryTotalInvoiced: "Total invoiced",
    summaryPaid: "Paid",
    summaryOutstanding: "Outstanding",
    summaryCount: "Invoices",
    tableDescription: "Description",
    tableQty: "Qty",
    tableUnitPrice: "Unit price",
    tableTotal: "Total",
    paid: (date: string) => `Paid ${date}`,
    due: (date: string) => `Due ${date}`,
    empty: "No invoices yet",
    emptyNote: "Invoices from your teChia projects will appear here.",
    status: {
      PAID: "Paid",
      SENT: "Due",
      OVERDUE: "Overdue",
      DRAFT: "Draft",
    } as Record<string, string>,
  },

  // Requirements page
  requests: {
    pageTitle: "Requests",
    pageDescription:
      "Information, approvals, and content that teChia needs from you to move your projects forward.",
    pendingSection: (n: number) => `Needs your response (${n})`,
    completedSection: "Completed",
    yourResponse: "Your response",
    submitted: (date: string) => `Submitted ${date}`,
    techiaFeedback: "teChia feedback",
    needsRevisionNote:
      "Your response needs revision. Please update and resubmit.",
    submitSection: "Submit your response",
    responsePlaceholder: "Type your response here…",
    attachFile: "Attach a file (optional)",
    submit: "Submit response",
    submitting: "Submitting…",
    successNote: "Response submitted! teChia will review it shortly.",
    empty: "No requests",
    emptyNote: "When teChia needs something from you, it will appear here.",
    due: (date: string) => `Due ${date}`,
    status: {
      PENDING: "Awaiting your response",
      SUBMITTED: "Response submitted",
      APPROVED: "Approved",
      REJECTED: "Needs revision",
    } as Record<string, string>,
    types: {
      CONTENT: "Content",
      APPROVAL: "Approval",
      DOCUMENT: "Document",
      INFORMATION: "Information",
      FEEDBACK: "Feedback",
      OTHER: "Other",
    } as Record<string, string>,
  },

  // Feedback page
  feedback: {
    pageTitle: "Feedback",
    pageDescription:
      "Share your experience working with teChia. Your feedback shapes our process.",
    projectLabel: "Which project is this feedback for?",
    satisfactionLabel: "Overall satisfaction",
    ratingLabels: ["", "Poor", "Below average", "Average", "Good", "Excellent"],
    nameLabel: "Your name",
    roleLabel: "Your role",
    optional: "(optional)",
    rolePlaceholder: "e.g. CEO, Marketing Manager",
    experienceLabel: "Share your experience",
    experiencePlaceholder: "Tell us what you loved or what we could improve…",
    charCount: (n: number) => `${n}/2000 (min 10)`,
    consentLabel:
      "I consent to teChia using this as a testimonial on their website",
    consentNote: "Your name may be displayed alongside your quote",
    submit: "Submit feedback",
    submitting: "Submitting…",
    successTitle: "Thank you for your feedback!",
    successNote:
      "Your response helps us improve and build better products. We truly appreciate your time.",
    empty: "No completed projects yet",
    emptyNote: "Feedback can be submitted once a project has been delivered.",
    errors: {
      noRating: "Please rate your overall satisfaction.",
      tooShort: "Please write at least 10 characters.",
    },
  },
};

// ── French ────────────────────────────────────────────────────────────────────
const fr = {
  locale: "fr" as PortalLocale,
  intlLocale: "fr-FR",

  shell: {
    yourWorkspace: "Votre espace",
    navigation: "Navigation",
    client: "Client",
    closeMenu: "Fermer le menu",
    openMenu: "Ouvrir le menu",
    notifications: "Notifications",
    signOut: "Se déconnecter",
    signingOut: "Déconnexion…",
    langToggleLabel: "Passer en anglais",
    langToggleCode: "EN",
  },

  nav: {
    overview: "Tableau de bord",
    projects: "Projets",
    messages: "Messages",
    files: "Fichiers",
    invoices: "Factures",
    requests: "Demandes",
    feedback: "Avis",
  },

  login: {
    badge: "Portail client",
    heading: "Bienvenue",
    subheading:
      "Saisissez votre adresse e-mail et le code d'accès fourni par teChia pour accéder à votre espace de travail.",
    emailLabel: "Adresse e-mail",
    emailPlaceholder: "vous@exemple.com",
    codeLabel: "Code d'accès",
    codePlaceholder: "XXXX-XXXX",
    showCode: "Afficher le code",
    hideCode: "Masquer le code",
    submit: "Accéder à mon espace",
    submitting: "Connexion…",
    noCode: "Vous n'avez pas de code d'accès ?",
    contactUs: "Contacter teChia",
    copyright: (year: number) => `© ${year} teChia Digital Solutions. Tous droits réservés.`,
    errors: {
      invalidCredentials: "E-mail ou code d'accès invalide. Veuillez réessayer.",
      networkError:
        "Une erreur réseau s'est produite. Vérifiez votre connexion et réessayez.",
    },
  },

  overview: {
    pageTitle: "Tableau de bord",
    pageDescription: "Bienvenue. Voici l'état de vos projets.",
    activeProjects: "Projets actifs",
    unreadMessages: "Messages non lus",
    pendingInvoices: "Factures en attente",
    openRequests: "Demandes ouvertes",
    activeProjectsSection: "Projets actifs",
    latestMessages: "Derniers messages",
    recentFiles: "Fichiers récents",
    viewAll: "Voir tout →",
    noProjectsYet: "Aucun projet pour l'instant.",
    noMessagesYet: "Aucun message pour l'instant.",
    noFilesYet: "Aucun fichier pour l'instant.",
    noInvoicesYet: "Aucune facture pour l'instant.",
    pendingRequestsAlert: (n: number) =>
      `Vous avez ${n} demande${n !== 1 ? "s" : ""} en attente`,
    pendingRequestsSubtext:
      "teChia attend votre réponse pour poursuivre votre projet.",
    respondNow: "Répondre maintenant →",
    completed: "Terminés",
    projects: "projets",
    filesShared: "Fichiers partagés",
    total: "total",
    totalInvoiced: "Total facturé",
    due: "Échéance",
    unableToLoad: "Impossible de charger votre espace. Veuillez réessayer.",
  },

  projects: {
    pageTitle: "Projets",
    pageDescription:
      "Avancement en temps réel, jalons et statut de livraison de tous vos projets.",
    overallProgress: "Avancement global",
    started: (date: string) => `Démarré le ${date}`,
    due: (date: string) => `Échéance ${date}`,
    delivered: (date: string) => `Livré le ${date}`,
    files: (n: number) => `${n} fichier${n !== 1 ? "s" : ""}`,
    invoices: (n: number) => `${n} facture${n !== 1 ? "s" : ""}`,
    requests: (n: number) => `${n} demande${n !== 1 ? "s" : ""}`,
    sectionActive: (n: number) => `Actifs (${n})`,
    sectionOther: "Autres projets",
    empty: "Aucun projet pour l'instant",
    emptyNote: "Vos projets teChia apparaîtront ici.",
    status: {
      PLANNED: "Planifié",
      ACTIVE: "Actif",
      REVIEW: "En révision",
      ON_HOLD: "En pause",
      DELIVERED: "Livré",
      ARCHIVED: "Archivé",
    },
  },

  messages: {
    pageTitle: "Messages",
    pageDescription:
      "Communications de votre équipe teChia — mises à jour, questions et notes de jalons.",
    unreadSection: (n: number) => `Non lus (${n})`,
    earlierSection: "Plus tôt",
    newBadge: "Nouveau",
    replies: (n: number) => `${n} réponse${n !== 1 ? "s" : ""}`,
    teChiaTeam: "Équipe teChia",
    you: "Vous",
    replyPlaceholder: "Rédigez une réponse…",
    sendReply: "Envoyer",
    sending: "Envoi…",
    replySent: "Réponse envoyée !",
    empty: "Aucun message pour l'instant",
    emptyNote: "Les messages de votre équipe teChia apparaîtront ici.",
  },

  files: {
    pageTitle: "Fichiers",
    pageDescription: "Livrables, ressources et documents partagés pour vos projets.",
    upload: "Téléverser",
    modalTitle: "Téléverser un fichier",
    selectFile: "Cliquez pour sélectionner un fichier",
    cancel: "Annuler",
    uploadBtn: "Téléverser",
    uploading: "Téléversement…",
    download: "Télécharger",
    empty: "Aucun fichier trouvé",
    emptyNote: (filter: string) =>
      filter === "ALL"
        ? "Les fichiers partagés pour vos projets apparaîtront ici."
        : `Aucun fichier de type ${filter.toLowerCase()} pour l'instant.`,
    categories: {
      ALL: "Tous les fichiers",
      DELIVERABLE: "Livrable",
      ASSET: "Ressource",
      DOCUMENT: "Document",
      DESIGN: "Design",
      CONTRACT: "Contrat",
      OTHER: "Autre",
    },
    status: {
      PENDING: "en attente",
      APPROVED: "approuvé",
      REJECTED: "refusé",
      ARCHIVED: "archivé",
    },
    today: "Aujourd'hui",
    yesterday: "Hier",
    daysAgo: (n: number) => `il y a ${n} j`,
    errors: {
      uploadFailed: "Échec du téléversement",
      networkError: "Erreur réseau. Veuillez réessayer.",
    },
  },

  invoices: {
    pageTitle: "Factures",
    pageDescription:
      "Jalons, statut des paiements et historique des factures de vos projets.",
    summaryTotalInvoiced: "Total facturé",
    summaryPaid: "Payé",
    summaryOutstanding: "Restant dû",
    summaryCount: "Factures",
    tableDescription: "Description",
    tableQty: "Qté",
    tableUnitPrice: "Prix unitaire",
    tableTotal: "Total",
    paid: (date: string) => `Payé le ${date}`,
    due: (date: string) => `Échéance ${date}`,
    empty: "Aucune facture pour l'instant",
    emptyNote: "Les factures de vos projets teChia apparaîtront ici.",
    status: {
      PAID: "Payé",
      SENT: "À payer",
      OVERDUE: "En retard",
      DRAFT: "Brouillon",
    },
  },

  requests: {
    pageTitle: "Demandes",
    pageDescription:
      "Informations, approbations et contenus que teChia vous demande pour avancer sur vos projets.",
    pendingSection: (n: number) => `En attente de votre réponse (${n})`,
    completedSection: "Terminé",
    yourResponse: "Votre réponse",
    submitted: (date: string) => `Soumis le ${date}`,
    techiaFeedback: "Retour de teChia",
    needsRevisionNote:
      "Votre réponse nécessite une révision. Veuillez mettre à jour et soumettre à nouveau.",
    submitSection: "Soumettre votre réponse",
    responsePlaceholder: "Rédigez votre réponse ici…",
    attachFile: "Joindre un fichier (optionnel)",
    submit: "Envoyer la réponse",
    submitting: "Envoi…",
    successNote: "Réponse envoyée ! teChia la vérifiera sous peu.",
    empty: "Aucune demande",
    emptyNote: "Lorsque teChia aura besoin de quelque chose de votre part, cela apparaîtra ici.",
    due: (date: string) => `Échéance ${date}`,
    status: {
      PENDING: "En attente de votre réponse",
      SUBMITTED: "Réponse envoyée",
      APPROVED: "Approuvé",
      REJECTED: "À réviser",
    },
    types: {
      CONTENT: "Contenu",
      APPROVAL: "Approbation",
      DOCUMENT: "Document",
      INFORMATION: "Information",
      FEEDBACK: "Avis",
      OTHER: "Autre",
    },
  },

  feedback: {
    pageTitle: "Avis",
    pageDescription:
      "Partagez votre expérience avec teChia. Votre avis guide notre processus.",
    projectLabel: "Pour quel projet souhaitez-vous laisser un avis ?",
    satisfactionLabel: "Satisfaction globale",
    ratingLabels: ["", "Insuffisant", "En dessous de la moyenne", "Moyen", "Bien", "Excellent"],
    nameLabel: "Votre nom",
    roleLabel: "Votre rôle",
    optional: "(optionnel)",
    rolePlaceholder: "ex. PDG, Responsable marketing",
    experienceLabel: "Partagez votre expérience",
    experiencePlaceholder: "Dites-nous ce que vous avez aimé ou ce que nous pouvons améliorer…",
    charCount: (n: number) => `${n}/2000 (min 10)`,
    consentLabel:
      "J'autorise teChia à utiliser cet avis comme témoignage sur son site web",
    consentNote: "Votre nom pourra être affiché avec votre citation",
    submit: "Envoyer l'avis",
    submitting: "Envoi…",
    successTitle: "Merci pour votre avis !",
    successNote:
      "Votre retour nous aide à nous améliorer et à créer de meilleurs produits. Nous apprécions sincèrement votre temps.",
    empty: "Aucun projet terminé pour l'instant",
    emptyNote: "Un avis peut être soumis une fois qu'un projet a été livré.",
    errors: {
      noRating: "Veuillez noter votre satisfaction globale.",
      tooShort: "Veuillez écrire au moins 10 caractères.",
    },
  },
};

// ── Exports ───────────────────────────────────────────────────────────────────
export type PortalDict = typeof en;

const dicts: Record<PortalLocale, PortalDict> = { en, fr: fr as unknown as PortalDict };

export function getPortalDict(locale: PortalLocale): PortalDict {
  return dicts[locale] ?? dicts.en;
}

// ── Date & time helpers (locale-aware) ───────────────────────────────────────
export function formatPortalDate(
  iso: string | null,
  locale: PortalLocale,
  opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", opts).format(new Date(iso));
}

export function formatPortalCurrency(
  amount: number,
  currency: string,
  locale: PortalLocale
): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency,
  }).format(amount / 100);
}

export function timeAgoPortal(iso: string | null, locale: PortalLocale): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (locale === "fr") {
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `il y a ${mins} min`;
    if (hours < 24) return `il y a ${hours} h`;
    if (days < 7) return `il y a ${days} j`;
    return new Intl.DateTimeFormat("fr-FR", { month: "short", day: "numeric" }).format(
      new Date(iso)
    );
  }

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(iso)
  );
}
