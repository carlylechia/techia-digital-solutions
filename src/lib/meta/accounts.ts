import "server-only";

import type { MetaConnectedAccount, MetaConnection } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import {
  META_OAUTH_SCOPES,
  META_PAGE_PUBLISHING_TASKS,
  getMetaAppCredentials,
  getMetaAppAccessToken,
} from "./config";
import { decryptMetaToken, encryptMetaToken } from "./crypto";
import {
  MetaGraphError,
  debugMetaToken,
  getMetaPageAccounts,
  metaGraphRequest,
  type MetaPageAccount,
} from "./graph";

export class MetaAccountError extends Error {
  readonly code:
    | "not_connected"
    | "connection_not_found"
    | "connection_disconnected"
    | "account_not_found"
    | "account_ineligible"
    | "invalid_selection"
    | "permission_missing"
    | "database_unavailable"
    | "reauthorization_required";

  constructor(code: MetaAccountError["code"], message: string) {
    super(message);
    this.name = "MetaAccountError";
    this.code = code;
  }
}

export type MetaAccountDto = {
  id: string;
  platform: "FACEBOOK_PAGE" | "INSTAGRAM";
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

export type DiscoverableInstagram = {
  id: string;
  username: string | null;
  name: string | null;
  profilePictureUrl: string | null;
  isEligible: boolean;
  ineligibilityReason: string | null;
  alreadyConnected: boolean;
  connectedAccountId: string | null;
};

export type DiscoverablePage = {
  id: string;
  name: string;
  category: string | null;
  tasks: string[];
  isEligible: boolean;
  ineligibilityReason: string | null;
  alreadyConnected: boolean;
  connectedAccountId: string | null;
  instagram: DiscoverableInstagram | null;
};

export function toAccountDto(account: MetaConnectedAccount): MetaAccountDto {
  return {
    id: account.id,
    platform: account.platform,
    platformAccountId: account.platformAccountId,
    displayName: account.displayName,
    username: account.username,
    pageId: account.pageId,
    pageName: account.pageName,
    linkedInstagramId: account.linkedInstagramId,
    tasks: account.tasks,
    isEligible: account.isEligible,
    ineligibilityReason: account.ineligibilityReason,
    permissionStatus: account.permissionStatus,
    healthStatus: account.healthStatus,
    healthMessage: account.healthMessage,
    tokenExpiresAt: account.tokenExpiresAt?.toISOString() || null,
    lastValidatedAt: account.lastValidatedAt?.toISOString() || null,
    lastHealthCheckAt: account.lastHealthCheckAt?.toISOString() || null,
    disconnectedAt: account.disconnectedAt?.toISOString() || null,
  };
}

export function toConnectionDto(
  connection: MetaConnection & { accounts: MetaConnectedAccount[] },
): MetaConnectionDto {
  return {
    id: connection.id,
    metaUserId: connection.metaUserId,
    metaUserName: connection.metaUserName,
    status: connection.status,
    healthMessage: connection.healthMessage,
    grantedPermissions: connection.grantedPermissions,
    tokenExpiresAt: connection.tokenExpiresAt?.toISOString() || null,
    dataAccessExpiresAt: connection.dataAccessExpiresAt?.toISOString() || null,
    lastValidatedAt: connection.lastValidatedAt?.toISOString() || null,
    lastHealthCheckAt: connection.lastHealthCheckAt?.toISOString() || null,
    connectedAt: connection.connectedAt.toISOString(),
    disconnectedAt: connection.disconnectedAt?.toISOString() || null,
    accounts: connection.accounts
      .filter((account) => !account.disconnectedAt)
      .map(toAccountDto),
  };
}

function prismaOrThrow() {
  const prisma = getPrisma();
  if (!prisma)
    throw new MetaAccountError(
      "database_unavailable",
      "Meta data is unavailable.",
    );
  return prisma;
}

export async function getMetaConnectionForAdmin(
  adminUserId: string,
  connectionId?: string | null,
) {
  const prisma = prismaOrThrow();
  const connection = await prisma.metaConnection.findFirst({
    where: connectionId
      ? { id: connectionId, adminUserId, status: { not: "DISCONNECTED" } }
      : { adminUserId, status: { not: "DISCONNECTED" } },
    include: {
      accounts: {
        where: { disconnectedAt: null },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { connectedAt: "desc" },
  });
  if (!connection)
    throw new MetaAccountError(
      "connection_not_found",
      "No active Meta connection was found.",
    );
  return connection;
}

export function decryptConnectionUserToken(connection: MetaConnection) {
  if (!connection.encryptedUserToken) {
    throw new MetaAccountError(
      "reauthorization_required",
      "Reconnect Meta to restore access.",
    );
  }
  try {
    return decryptMetaToken(connection.encryptedUserToken);
  } catch {
    throw new MetaAccountError(
      "reauthorization_required",
      "The stored Meta authorization could not be decrypted. Reconnect Meta.",
    );
  }
}

export function hasPagePublishingCapability(tasks: string[]) {
  return META_PAGE_PUBLISHING_TASKS.some((task) => tasks.includes(task));
}

export function evaluatePagePublishingEligibility(input: {
  tasks: string[];
  grantedScopes: string[];
  hasPageToken: boolean;
}) {
  if (!input.hasPageToken) {
    return {
      eligible: false,
      reason: "Meta did not return a Page access token for this Page.",
    };
  }
  const requiredScopes = [
    "pages_manage_posts",
    "pages_read_engagement",
    "pages_read_user_content",
    "pages_show_list",
  ];
  const missingScopes = requiredScopes.filter(
    (scope) => !input.grantedScopes.includes(scope),
  );
  if (missingScopes.length) {
    return {
      eligible: false,
      reason: `Missing permissions: ${missingScopes.join(", ")}.`,
    };
  }
  if (!hasPagePublishingCapability(input.tasks)) {
    return {
      eligible: false,
      reason:
        "The authorizing user is missing a Page publishing task (CREATE_CONTENT or MANAGE).",
    };
  }
  return { eligible: true, reason: null };
}

function pageEligibility(page: MetaPageAccount, grantedScopes: string[]) {
  const tasks = Array.isArray(page.tasks) ? page.tasks : [];
  return evaluatePagePublishingEligibility({
    tasks,
    grantedScopes,
    hasPageToken: Boolean(page.access_token),
  });
}

export function evaluateInstagramPublishingEligibility(input: {
  pageEligible: boolean;
  grantedScopes: string[];
  hasParentToken?: boolean;
}) {
  if (!input.pageEligible) {
    return {
      eligible: false,
      reason: "The parent Facebook Page is not eligible for publishing.",
    };
  }
  const requiredScopes = ["instagram_basic", "instagram_content_publish"];
  const missingScopes = requiredScopes.filter(
    (scope) => !input.grantedScopes.includes(scope),
  );
  if (missingScopes.length) {
    return {
      eligible: false,
      reason: `Missing permissions: ${missingScopes.join(", ")}.`,
    };
  }
  if (input.hasParentToken === false) {
    return {
      eligible: false,
      reason: "The parent Facebook Page access token is unavailable.",
    };
  }
  return { eligible: true, reason: null };
}

function instagramEligibility(
  page: MetaPageAccount,
  pageEligible: boolean,
  grantedScopes: string[],
) {
  const ig = page.instagram_business_account;
  if (!ig?.id) return { present: false, eligible: false, reason: null };
  const result = evaluateInstagramPublishingEligibility({
    pageEligible,
    grantedScopes,
    hasParentToken: Boolean(page.access_token),
  });
  return { present: true, eligible: result.eligible, reason: result.reason };
}

/**
 * Live discovery. Never persists anything, never returns access tokens, and
 * never trusts browser-provided account metadata.
 */
export async function discoverMetaAssets(
  connectionId: string | null | undefined,
  adminUserId: string,
) {
  const connection = await getMetaConnectionForAdmin(adminUserId, connectionId);
  const userToken = decryptConnectionUserToken(connection);
  const grantedScopes = connection.grantedPermissions.length
    ? connection.grantedPermissions
    : [];
  const pages = await getMetaPageAccounts(userToken);

  const connected = await prismaOrThrow().metaConnectedAccount.findMany({
    where: { connectionId: connection.id, disconnectedAt: null },
    select: { id: true, platform: true, platformAccountId: true },
  });
  const connectedMap = new Map(
    connected.map((account) => [
      `${account.platform}:${account.platformAccountId}`,
      account.id,
    ]),
  );

  const result: DiscoverablePage[] = pages.map((page) => {
    const pageState = pageEligibility(page, grantedScopes);
    const igState = instagramEligibility(
      page,
      pageState.eligible,
      grantedScopes,
    );
    return {
      id: page.id,
      name: page.name || "Facebook Page",
      category: page.category || null,
      tasks: Array.isArray(page.tasks) ? page.tasks : [],
      isEligible: pageState.eligible,
      ineligibilityReason: pageState.reason,
      alreadyConnected: connectedMap.has(`FACEBOOK_PAGE:${page.id}`),
      connectedAccountId: connectedMap.get(`FACEBOOK_PAGE:${page.id}`) || null,
      instagram:
        igState.present && page.instagram_business_account
          ? {
              id: page.instagram_business_account.id,
              username: page.instagram_business_account.username || null,
              name: page.instagram_business_account.name || null,
              profilePictureUrl:
                page.instagram_business_account.profile_picture_url || null,
              isEligible: igState.eligible,
              ineligibilityReason: igState.reason,
              alreadyConnected: connectedMap.has(
                `INSTAGRAM:${page.instagram_business_account.id}`,
              ),
              connectedAccountId:
                connectedMap.get(
                  `INSTAGRAM:${page.instagram_business_account.id}`,
                ) || null,
            }
          : null,
    };
  });

  return {
    connection: toConnectionDto(connection),
    pages: result,
    discoveredAt: new Date().toISOString(),
  };
}

export type MetaAccountSelection = {
  platform: "FACEBOOK_PAGE" | "INSTAGRAM";
  platformAccountId: string;
};

/**
 * Persists only selected assets. The server re-discovers live Meta data and
 * validates eligibility again; client IDs are treated as untrusted hints.
 */
export async function connectMetaAccounts(input: {
  connectionId: string;
  adminUserId: string;
  selections: MetaAccountSelection[];
}) {
  if (!input.selections.length)
    throw new MetaAccountError(
      "invalid_selection",
      "Select at least one account.",
    );
  if (input.selections.length > 20)
    throw new MetaAccountError(
      "invalid_selection",
      "Select no more than 20 accounts at once.",
    );

  const prisma = prismaOrThrow();
  const connection = await getMetaConnectionForAdmin(
    input.adminUserId,
    input.connectionId,
  );
  const userToken = decryptConnectionUserToken(connection);
  const grantedScopes = connection.grantedPermissions;
  const pages = await getMetaPageAccounts(userToken);

  const pageMap = new Map(pages.map((page) => [page.id, page]));
  const igMap = new Map<string, { page: MetaPageAccount; igId: string }>();
  for (const page of pages) {
    if (page.instagram_business_account?.id) {
      igMap.set(page.instagram_business_account.id, {
        page,
        igId: page.instagram_business_account.id,
      });
    }
  }

  const existing = await prisma.metaConnectedAccount.findMany({
    where: { connectionId: connection.id, disconnectedAt: null },
    select: { platform: true, platformAccountId: true },
  });
  const existingKeys = new Set(
    existing.map(
      (account) => `${account.platform}:${account.platformAccountId}`,
    ),
  );

  const accepted: Array<{
    platform: "FACEBOOK_PAGE" | "INSTAGRAM";
    platformAccountId: string;
    displayName: string;
    username: string | null;
    pageId: string;
    pageName: string;
    linkedInstagramId: string | null;
    encryptedAccessToken: string | null;
    tasks: string[];
    isEligible: boolean;
    ineligibilityReason: string | null;
  }> = [];
  const skipped: Array<{ platform: string; id: string; reason: string }> = [];

  for (const selection of input.selections) {
    if (selection.platform === "FACEBOOK_PAGE") {
      const page = pageMap.get(selection.platformAccountId);
      if (!page) {
        skipped.push({
          platform: selection.platform,
          id: selection.platformAccountId,
          reason: "The Page is not available to this Meta user.",
        });
        continue;
      }
      const eligibility = pageEligibility(page, grantedScopes);
      if (!eligibility.eligible || !page.access_token) {
        skipped.push({
          platform: selection.platform,
          id: selection.platformAccountId,
          reason:
            eligibility.reason || "The Page is not eligible for publishing.",
        });
        continue;
      }
      accepted.push({
        platform: "FACEBOOK_PAGE",
        platformAccountId: page.id,
        displayName: page.name || "Facebook Page",
        username: null,
        pageId: page.id,
        pageName: page.name || "Facebook Page",
        linkedInstagramId: page.instagram_business_account?.id || null,
        encryptedAccessToken: encryptMetaToken(page.access_token),
        tasks: Array.isArray(page.tasks) ? page.tasks : [],
        isEligible: true,
        ineligibilityReason: null,
      });
      continue;
    }

    const match = igMap.get(selection.platformAccountId);
    if (!match) {
      skipped.push({
        platform: selection.platform,
        id: selection.platformAccountId,
        reason:
          "No Instagram professional account with that ID is linked to an available Page.",
      });
      continue;
    }
    const pageState = pageEligibility(match.page, grantedScopes);
    const igState = instagramEligibility(
      match.page,
      pageState.eligible,
      grantedScopes,
    );
    if (!igState.eligible) {
      skipped.push({
        platform: selection.platform,
        id: selection.platformAccountId,
        reason: igState.reason || "The Instagram account is not eligible.",
      });
      continue;
    }
    const parentSelected =
      input.selections.some(
        (item) =>
          item.platform === "FACEBOOK_PAGE" &&
          item.platformAccountId === match.page.id,
      ) || existingKeys.has(`FACEBOOK_PAGE:${match.page.id}`);
    if (!parentSelected) {
      skipped.push({
        platform: selection.platform,
        id: selection.platformAccountId,
        reason:
          "Connect the parent Facebook Page first. Instagram publishing uses the Page access token.",
      });
      continue;
    }
    accepted.push({
      platform: "INSTAGRAM",
      platformAccountId: match.igId,
      displayName:
        match.page.instagram_business_account?.name ||
        match.page.instagram_business_account?.username ||
        "Instagram account",
      username: match.page.instagram_business_account?.username || null,
      pageId: match.page.id,
      pageName: match.page.name || "Facebook Page",
      linkedInstagramId: match.igId,
      encryptedAccessToken: null,
      tasks: Array.isArray(match.page.tasks) ? match.page.tasks : [],
      isEligible: true,
      ineligibilityReason: null,
    });
  }

  const saved = await prisma.$transaction(async (tx) => {
    for (const account of accepted) {
      await tx.metaConnectedAccount.upsert({
        where: {
          connectionId_platform_platformAccountId: {
            connectionId: connection.id,
            platform: account.platform,
            platformAccountId: account.platformAccountId,
          },
        },
        create: {
          connectionId: connection.id,
          platform: account.platform,
          platformAccountId: account.platformAccountId,
          displayName: account.displayName,
          username: account.username,
          pageId: account.pageId,
          pageName: account.pageName,
          linkedInstagramId: account.linkedInstagramId,
          encryptedAccessToken: account.encryptedAccessToken,
          tokenEncryptionVersion: "v1",
          tasks: account.tasks,
          isEligible: account.isEligible,
          ineligibilityReason: account.ineligibilityReason,
          permissionStatus: "OK",
          healthStatus: "HEALTHY",
          healthMessage: null,
          lastValidatedAt: new Date(),
          lastHealthCheckAt: new Date(),
        },
        update: {
          displayName: account.displayName,
          username: account.username,
          pageId: account.pageId,
          pageName: account.pageName,
          linkedInstagramId: account.linkedInstagramId,
          encryptedAccessToken: account.encryptedAccessToken,
          tokenEncryptionVersion: "v1",
          tasks: account.tasks,
          isEligible: account.isEligible,
          ineligibilityReason: account.ineligibilityReason,
          permissionStatus: "OK",
          healthStatus: "HEALTHY",
          healthMessage: null,
          lastValidatedAt: new Date(),
          lastHealthCheckAt: new Date(),
          disconnectedAt: null,
        },
      });
    }
    return tx.metaConnectedAccount.findMany({
      where: { connectionId: connection.id, disconnectedAt: null },
      orderBy: { createdAt: "asc" },
    });
  });

  return { accounts: saved.map(toAccountDto), skipped };
}

/** Explicit, bounded health refresh. Never called on page render. */
export async function refreshMetaConnectionHealth(
  connectionId: string,
  adminUserId: string,
) {
  const prisma = prismaOrThrow();
  const connection = await getMetaConnectionForAdmin(adminUserId, connectionId);
  const userToken = decryptConnectionUserToken(connection);
  const app = getMetaAppCredentials();
  const now = new Date();

  let debug;
  try {
    debug = await debugMetaToken(userToken);
  } catch (error) {
    if (error instanceof MetaGraphError) {
      const revoked = error.category === "authentication";
      await prisma.metaConnection.update({
        where: { id: connection.id },
        data: {
          status: revoked ? "REVOKED" : "ATTENTION_REQUIRED",
          healthMessage: error.message,
          lastHealthCheckAt: now,
        },
      });
      await prisma.metaConnectedAccount.updateMany({
        where: { connectionId: connection.id, disconnectedAt: null },
        data: {
          healthStatus: revoked ? "TOKEN_REVOKED" : "ATTENTION_REQUIRED",
          healthMessage: error.message,
          lastHealthCheckAt: now,
        },
      });
      throw new MetaAccountError(
        "reauthorization_required",
        "Meta rejected the stored authorization. Reconnect Meta.",
      );
    }
    throw error;
  }

  const valid = debug.is_valid !== false && debug.app_id === app.appId;
  const expiresAt =
    typeof debug.expires_at === "number" && debug.expires_at > 0
      ? new Date(debug.expires_at * 1000)
      : null;
  const dataAccessExpiresAt =
    typeof debug.data_access_expires_at === "number" &&
    debug.data_access_expires_at > 0
      ? new Date(debug.data_access_expires_at * 1000)
      : null;
  const expired = Boolean(expiresAt && expiresAt.getTime() <= Date.now());
  const granted = Array.isArray(debug.scopes) ? debug.scopes : [];
  const missingScopes = META_OAUTH_SCOPES.filter(
    (scope) => !granted.includes(scope),
  );
  const pageRequiredScopes = [
    "pages_manage_posts",
    "pages_read_engagement",
    "pages_read_user_content",
    "pages_show_list",
  ];
  const instagramRequiredScopes = ["instagram_basic", "instagram_content_publish"];
  const missingPageScopes = pageRequiredScopes.filter(
    (scope) => !granted.includes(scope),
  );
  const missingInstagramScopes = instagramRequiredScopes.filter(
    (scope) => !granted.includes(scope),
  );

  const connectionStatus = !valid
    ? "REVOKED"
    : expired
      ? "EXPIRED"
      : missingScopes.length
        ? "ATTENTION_REQUIRED"
        : "CONNECTED";
  const connectionMessage = !valid
    ? "Meta no longer accepts the stored authorization."
    : expired
      ? "The Meta authorization expired."
      : missingScopes.length
        ? `Missing permissions: ${missingScopes.join(", ")}`
        : null;

  await prisma.metaConnection.update({
    where: { id: connection.id },
    data: {
      status: connectionStatus,
      healthMessage: connectionMessage,
      grantedPermissions: granted,
      tokenExpiresAt: expiresAt,
      dataAccessExpiresAt,
      lastValidatedAt: now,
      lastHealthCheckAt: now,
    },
  });

  if (!valid || expired) {
    await prisma.metaConnectedAccount.updateMany({
      where: { connectionId: connection.id, disconnectedAt: null },
      data: {
        healthStatus: expired ? "TOKEN_EXPIRED" : "TOKEN_REVOKED",
        healthMessage: connectionMessage,
        lastHealthCheckAt: now,
      },
    });
    return prisma.metaConnection
      .findUniqueOrThrow({
        where: { id: connection.id },
        include: { accounts: { where: { disconnectedAt: null } } },
      })
      .then(toConnectionDto);
  }

  const accounts = await prisma.metaConnectedAccount.findMany({
    where: { connectionId: connection.id, disconnectedAt: null },
    take: 25,
  });
  const orderedAccounts = [...accounts].sort((a, b) =>
    a.platform === b.platform ? 0 : a.platform === "FACEBOOK_PAGE" ? -1 : 1,
  );
  const pageEligibilityByPageId = new Map<string, boolean>();
  const pageTokens = new Map<string, string>();
  for (const account of orderedAccounts) {
    if (account.platform === "FACEBOOK_PAGE" && account.pageId) {
      try {
        if (account.encryptedAccessToken)
          pageTokens.set(
            account.pageId,
            decryptMetaToken(account.encryptedAccessToken),
          );
      } catch {
        // handled when the account is checked below
      }
    }
  }

  for (const account of accounts) {
    let healthStatus:
      | "HEALTHY"
      | "ATTENTION_REQUIRED"
      | "PERMISSION_MISSING"
      | "TOKEN_EXPIRED"
      | "TOKEN_REVOKED"
      | "DISCONNECTED" = "HEALTHY";
    let healthMessage: string | null = null;
    let tasks = account.tasks;
    let eligible = account.isEligible;

    if (missingScopes.length) {
      healthStatus = "PERMISSION_MISSING";
      healthMessage = `Missing permissions: ${missingScopes.join(", ")}`;
      eligible = false;
    } else if (account.platform === "FACEBOOK_PAGE") {
      if (missingPageScopes.length) {
        healthStatus = "PERMISSION_MISSING";
        healthMessage = `Missing permissions: ${missingPageScopes.join(", ")}`;
        eligible = false;
      } else {
        const token = account.pageId ? pageTokens.get(account.pageId) : null;
        if (!token) {
          healthStatus = "TOKEN_REVOKED";
          healthMessage =
            "The Page access token is unavailable. Reconnect this Page.";
          eligible = false;
        } else {
          try {
            const page = await metaGraphRequest<{
              id: string;
              name?: string;
              tasks?: string[];
            }>(account.platformAccountId, {
              method: "GET",
              params: { fields: "id,name,tasks" },
              accessToken: token,
              retry: false,
            });
            tasks = Array.isArray(page.tasks) ? page.tasks : [];
            const pageEligibilityResult = evaluatePagePublishingEligibility({
              tasks,
              grantedScopes: granted,
              hasPageToken: true,
            });
            eligible = pageEligibilityResult.eligible;
            if (!eligible) {
              if (pageEligibilityResult.reason?.includes("permissions")) {
                healthStatus = "PERMISSION_MISSING";
                healthMessage = pageEligibilityResult.reason;
              } else {
                healthStatus = "ATTENTION_REQUIRED";
                healthMessage = pageEligibilityResult.reason;
              }
            }
          } catch (error) {
            if (error instanceof MetaGraphError) {
              healthStatus =
                error.category === "permission"
                  ? "PERMISSION_MISSING"
                  : "TOKEN_REVOKED";
              healthMessage = error.message;
              eligible = false;
            } else {
              healthStatus = "ATTENTION_REQUIRED";
              healthMessage = "The Page could not be validated.";
              eligible = false;
            }
          }
        }
      }
      pageEligibilityByPageId.set(account.platformAccountId, eligible);
    } else {
      const relevantMissingScopes = [
        ...missingPageScopes,
        ...missingInstagramScopes,
      ];
      if (relevantMissingScopes.length) {
        healthStatus = "PERMISSION_MISSING";
        healthMessage = `Missing permissions: ${relevantMissingScopes.join(", ")}`;
        eligible = false;
      } else {
        const parentEligible =
          pageEligibilityByPageId.get(account.pageId || "") ??
          hasPagePublishingCapability(account.tasks);
        const parentToken = account.pageId
          ? pageTokens.get(account.pageId)
          : null;
        const instagramEligibilityResult =
          evaluateInstagramPublishingEligibility({
            pageEligible: parentEligible,
            grantedScopes: granted,
            hasParentToken: Boolean(parentToken),
          });
        eligible = instagramEligibilityResult.eligible;
        if (!eligible) {
          if (instagramEligibilityResult.reason?.includes("permissions")) {
            healthStatus = "PERMISSION_MISSING";
            healthMessage = instagramEligibilityResult.reason;
          } else if (!parentToken) {
            healthStatus = "ATTENTION_REQUIRED";
            healthMessage =
              "Reconnect the parent Facebook Page so Instagram publishing can use its token.";
          } else {
            healthStatus = "ATTENTION_REQUIRED";
            healthMessage =
              instagramEligibilityResult.reason ||
              "The Instagram account could not be validated.";
          }
        } else if (parentToken) {
          try {
            await metaGraphRequest<{ id: string }>(account.platformAccountId, {
              method: "GET",
              params: { fields: "id,username" },
              accessToken: parentToken,
              retry: false,
            });
          } catch (error) {
            if (error instanceof MetaGraphError) {
              healthStatus =
                error.category === "permission"
                  ? "PERMISSION_MISSING"
                  : "ATTENTION_REQUIRED";
              healthMessage = error.message;
              eligible = false;
            } else {
              healthStatus = "ATTENTION_REQUIRED";
              healthMessage = "The Instagram account could not be validated.";
              eligible = false;
            }
          }
        }
      }
    }

    await prisma.metaConnectedAccount.update({
      where: { id: account.id },
      data: {
        tasks,
        isEligible: eligible,
        permissionStatus: missingScopes.length ? "MISSING" : "OK",
        healthStatus,
        healthMessage,
        lastValidatedAt: now,
        lastHealthCheckAt: now,
      },
    });
  }

  const refreshed = await prisma.metaConnection.findUniqueOrThrow({
    where: { id: connection.id },
    include: {
      accounts: {
        where: { disconnectedAt: null },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return toConnectionDto(refreshed);
}

export async function disconnectMetaAccount(
  accountId: string,
  adminUserId: string,
) {
  const prisma = prismaOrThrow();
  const account = await prisma.metaConnectedAccount.findFirst({
    where: { id: accountId, connection: { adminUserId }, disconnectedAt: null },
    include: { connection: { select: { id: true } } },
  });
  if (!account)
    throw new MetaAccountError(
      "account_not_found",
      "This connected account was not found.",
    );

  await prisma.$transaction(async (tx) => {
    await tx.metaConnectedAccount.update({
      where: { id: account.id },
      data: {
        disconnectedAt: new Date(),
        healthStatus: "DISCONNECTED",
        healthMessage: "Disconnected by an administrator.",
        encryptedAccessToken: null,
        isEligible: false,
      },
    });
    if (account.platform === "FACEBOOK_PAGE") {
      await tx.metaConnectedAccount.updateMany({
        where: {
          connectionId: account.connectionId,
          platform: "INSTAGRAM",
          pageId: account.platformAccountId,
          disconnectedAt: null,
        },
        data: {
          disconnectedAt: new Date(),
          healthStatus: "DISCONNECTED",
          healthMessage: "The parent Facebook Page was disconnected.",
          isEligible: false,
        },
      });
    }
  });

  return { disconnected: true };
}

export async function disconnectMetaConnection(
  connectionId: string,
  adminUserId: string,
) {
  const prisma = prismaOrThrow();
  const connection = await prisma.metaConnection.findFirst({
    where: { id: connectionId, adminUserId, status: { not: "DISCONNECTED" } },
    select: { id: true },
  });
  if (!connection)
    throw new MetaAccountError(
      "connection_not_found",
      "This Meta connection was not found.",
    );

  await prisma.$transaction(async (tx) => {
    await tx.metaConnection.update({
      where: { id: connection.id },
      data: {
        status: "DISCONNECTED",
        disconnectedAt: new Date(),
        encryptedUserToken: null,
        healthMessage: "Disconnected by an administrator.",
      },
    });
    await tx.metaConnectedAccount.updateMany({
      where: { connectionId: connection.id, disconnectedAt: null },
      data: {
        disconnectedAt: new Date(),
        healthStatus: "DISCONNECTED",
        healthMessage: "The Meta connection was disconnected.",
        encryptedAccessToken: null,
        isEligible: false,
      },
    });
  });

  return { disconnected: true };
}

export async function getMetaConnectionStatusForAdmin(adminUserId: string) {
  const prisma = prismaOrThrow();
  const connection = await prisma.metaConnection.findFirst({
    where: { adminUserId },
    include: {
      accounts: {
        where: { disconnectedAt: null },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { connectedAt: "desc" },
  });
  return connection ? toConnectionDto(connection) : null;
}

export type MetaPublishingSettingsDto = {
  publishingEnabled: boolean;
  updatedAt: string | null;
};

export async function getMetaPublishingSettings(): Promise<MetaPublishingSettingsDto> {
  const prisma = getPrisma();
  if (!prisma) return { publishingEnabled: false, updatedAt: null };
  const row = await prisma.metaPublishingSettings.findUnique({
    where: { id: "global" },
  });
  return {
    publishingEnabled: row?.publishingEnabled === true,
    updatedAt: row?.updatedAt.toISOString() || null,
  };
}

export async function setMetaPublishingEnabled(
  enabled: boolean,
  adminUserId: string,
) {
  const prisma = prismaOrThrow();
  const row = await prisma.metaPublishingSettings.upsert({
    where: { id: "global" },
    create: {
      id: "global",
      publishingEnabled: enabled,
      updatedById: adminUserId,
    },
    update: { publishingEnabled: enabled, updatedById: adminUserId },
  });
  return {
    publishingEnabled: row.publishingEnabled,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Server-only helper used by publishing. The caller must not serialise this. */
export async function getPublishingAccount(input: {
  accountId: string;
  adminUserId: string;
  platform: "FACEBOOK" | "INSTAGRAM";
}) {
  const prisma = prismaOrThrow();
  const expectedPlatform =
    input.platform === "FACEBOOK" ? "FACEBOOK_PAGE" : "INSTAGRAM";
  const account = await prisma.metaConnectedAccount.findFirst({
    where: {
      id: input.accountId,
      platform: expectedPlatform,
      disconnectedAt: null,
      connection: {
        adminUserId: input.adminUserId,
        status: { not: "DISCONNECTED" },
      },
    },
    include: { connection: true },
  });
  if (!account)
    throw new MetaAccountError(
      "account_not_found",
      "The selected destination is not connected.",
    );
  if (!account.isEligible) {
    throw new MetaAccountError(
      "account_ineligible",
      account.ineligibilityReason ||
        "This destination is not eligible for publishing.",
    );
  }
  if (
    account.healthStatus === "TOKEN_REVOKED" ||
    account.healthStatus === "TOKEN_EXPIRED" ||
    account.healthStatus === "DISCONNECTED"
  ) {
    throw new MetaAccountError(
      "reauthorization_required",
      "Reconnect this destination before publishing.",
    );
  }

  let pageToken: string | null = null;
  if (input.platform === "FACEBOOK") {
    if (!account.encryptedAccessToken) {
      throw new MetaAccountError(
        "reauthorization_required",
        "Reconnect this Page before publishing.",
      );
    }
    try {
      pageToken = decryptMetaToken(account.encryptedAccessToken);
    } catch {
      throw new MetaAccountError(
        "reauthorization_required",
        "The Page credential could not be decrypted. Reconnect it.",
      );
    }
  } else {
    const pageId = account.pageId;
    if (!pageId)
      throw new MetaAccountError(
        "account_ineligible",
        "The Instagram account has no parent Facebook Page.",
      );
    const parent = await prisma.metaConnectedAccount.findFirst({
      where: {
        connectionId: account.connectionId,
        platform: "FACEBOOK_PAGE",
        platformAccountId: pageId,
        disconnectedAt: null,
      },
    });
    if (!parent?.encryptedAccessToken) {
      throw new MetaAccountError(
        "reauthorization_required",
        "Reconnect the parent Facebook Page before publishing to Instagram.",
      );
    }
    try {
      pageToken = decryptMetaToken(parent.encryptedAccessToken);
    } catch {
      throw new MetaAccountError(
        "reauthorization_required",
        "The parent Page credential could not be decrypted. Reconnect it.",
      );
    }
  }

  return {
    account,
    connection: account.connection,
    pageToken,
    destinationId: account.platformAccountId,
    pageId: account.pageId,
  };
}

export { getMetaAppAccessToken };
