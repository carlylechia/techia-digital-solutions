/**
 * Shared, browser-safe view types and labels for the Meta direct-publishing UI.
 * No server-only values (tokens, secrets, Graph internals) belong here.
 */

export type MetaAccountPlatform = "FACEBOOK_PAGE" | "INSTAGRAM";

export type MetaAccountDto = {
  id: string;
  platform: MetaAccountPlatform;
  platformAccountId: string;
  displayName: string;
  username: string | null;
  pageId: string | null;
  pageName: string | null;
  linkedInstagramId: string | null;
  tasks: string[];
  isEligible: boolean;
  ineligibilityReason: string | null;
  permissionStatus: string;
  healthStatus: string;
  healthMessage: string | null;
  tokenExpiresAt: string | null;
  lastValidatedAt: string | null;
  lastHealthCheckAt: string | null;
  disconnectedAt: string | null;
};

export type MetaConnectionDto = {
  id: string;
  metaUserId: string;
  metaUserName: string | null;
  status: string;
  healthMessage: string | null;
  grantedPermissions: string[];
  tokenExpiresAt: string | null;
  dataAccessExpiresAt: string | null;
  lastValidatedAt: string | null;
  lastHealthCheckAt: string | null;
  connectedAt: string;
  disconnectedAt: string | null;
  accounts: MetaAccountDto[];
};

export type MetaOverviewDto = {
  configured: boolean;
  graphVersion: string;
  encryptionKeyConfigured: boolean;
  envPublishingEnabled: boolean;
  databasePublishingEnabled: boolean;
  publishingEnabled: boolean;
  settingsUpdatedAt: string | null;
  connection: MetaConnectionDto | null;
};

export type MetaDiscoverableInstagram = {
  id: string;
  username: string | null;
  name: string | null;
  profilePictureUrl: string | null;
  isEligible: boolean;
  ineligibilityReason: string | null;
  alreadyConnected: boolean;
  connectedAccountId: string | null;
};

export type MetaDiscoverablePage = {
  id: string;
  name: string;
  category: string | null;
  tasks: string[];
  isEligible: boolean;
  ineligibilityReason: string | null;
  alreadyConnected: boolean;
  connectedAccountId: string | null;
  instagram: MetaDiscoverableInstagram | null;
};

export type MetaDiscoveryDto = {
  connection: MetaConnectionDto;
  pages: MetaDiscoverablePage[];
  discoveredAt: string;
};

export type MetaPublicationAttemptDto = {
  attemptNumber: number;
  requestAt: string;
  responseAt: string | null;
  outcome: string;
  httpStatus: number | null;
  errorCode: string | null;
  errorSummary: string | null;
  metaRequestId: string | null;
};

export type MetaPublicationDto = {
  id: string;
  platform: string;
  status: string;
  caption: string;
  mediaUrl: string | null;
  mediaFormat: string | null;
  articleId: string | null;
  articleTitle: string | null;
  articleUrl: string | null;
  destinationName: string | null;
  destinationAccountId: string | null;
  externalId: string | null;
  externalUrl: string | null;
  startedAt: string;
  publishedAt: string | null;
  completedAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  attemptCount: number;
  reconciliationAttemptedAt: string | null;
  canRetry: boolean;
  canReconcile: boolean;
  canResolve: boolean;
  hashPending: boolean;
  attempts: MetaPublicationAttemptDto[];
  initiatedBy: string | null;
};

export const metaAccountPlatformLabel: Record<MetaAccountPlatform, string> = {
  FACEBOOK_PAGE: "Facebook Page",
  INSTAGRAM: "Instagram",
};

export function metaConnectionTone(status: string) {
  switch (status) {
    case "CONNECTED":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    case "ATTENTION_REQUIRED":
    case "EXPIRED":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    case "REVOKED":
    case "DISCONNECTED":
      return "border-red-500/40 bg-red-500/10 text-red-300";
    default:
      return "border-border bg-surface text-muted";
  }
}

export function metaHealthTone(health: string) {
  switch (health) {
    case "HEALTHY":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    case "ATTENTION_REQUIRED":
    case "UNKNOWN":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    case "PERMISSION_MISSING":
    case "TOKEN_EXPIRED":
    case "TOKEN_REVOKED":
    case "DISCONNECTED":
      return "border-red-500/40 bg-red-500/10 text-red-300";
    default:
      return "border-border bg-surface text-muted";
  }
}

export function metaHealthLabel(health: string) {
  switch (health) {
    case "HEALTHY":
      return "Healthy";
    case "ATTENTION_REQUIRED":
      return "Needs attention";
    case "PERMISSION_MISSING":
      return "Permission missing";
    case "TOKEN_EXPIRED":
      return "Token expired";
    case "TOKEN_REVOKED":
      return "Token revoked";
    case "DISCONNECTED":
      return "Disconnected";
    default:
      return "Not checked";
  }
}

export function metaConnectionLabel(status: string) {
  switch (status) {
    case "CONNECTED":
      return "Connected";
    case "ATTENTION_REQUIRED":
      return "Attention required";
    case "EXPIRED":
      return "Expired";
    case "REVOKED":
      return "Revoked";
    case "DISCONNECTED":
      return "Disconnected";
    default:
      return status;
  }
}

export function metaPublicationTone(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    case "PROCESSING":
    case "PENDING":
      return "border-sky-500/40 bg-sky-500/10 text-sky-300";
    case "UNKNOWN_RESULT":
    case "REQUIRES_REAUTHORIZATION":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    case "FAILED":
    case "CANCELLED":
      return "border-red-500/40 bg-red-500/10 text-red-300";
    default:
      return "border-border bg-surface text-muted";
  }
}

export function metaPublicationLabel(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "Published";
    case "PROCESSING":
      return "Processing";
    case "PENDING":
      return "Pending";
    case "UNKNOWN_RESULT":
      return "Result unknown";
    case "REQUIRES_REAUTHORIZATION":
      return "Reconnect required";
    case "FAILED":
      return "Failed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

export function formatMetaDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function isMetaActivePublication(status: string) {
  return (
    status === "PENDING" ||
    status === "PROCESSING" ||
    status === "UNKNOWN_RESULT"
  );
}
