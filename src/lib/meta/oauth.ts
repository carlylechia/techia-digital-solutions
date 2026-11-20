import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import {
  META_OAUTH_SCOPES,
  getMetaAppCredentials,
  getMetaGraphVersion,
  getMetaOAuthRedirectUri,
  getMetaOAuthStateTtlMs,
} from "./config";
import { encryptMetaToken } from "./crypto";
import {
  MetaGraphError,
  debugMetaToken,
  getMetaIdentity,
  metaOAuthRequest,
  type MetaDebugTokenData,
} from "./graph";

export class MetaOAuthError extends Error {
  readonly code:
    | "state_missing"
    | "state_invalid"
    | "state_expired"
    | "state_replayed"
    | "state_wrong_admin"
    | "access_denied"
    | "code_missing"
    | "not_configured"
    | "token_exchange_failed"
    | "invalid_token"
    | "wrong_app"
    | "provider_error";

  constructor(code: MetaOAuthError["code"], message: string) {
    super(message);
    this.name = "MetaOAuthError";
    this.code = code;
  }
}

export function hashMetaOAuthState(state: string) {
  return createHash("sha256").update(state, "utf8").digest("hex");
}

/** Used only to choose the redirect locale after a failed callback. */
export async function getMetaOAuthStateLocale(state: string | null) {
  if (!state) return "en" as const;
  const prisma = getPrisma();
  if (!prisma) return "en" as const;
  const row = await prisma.metaOAuthState.findUnique({
    where: { stateHash: hashMetaOAuthState(state) },
    select: { returnLocale: true },
  });
  return normalizeReturnLocale(row?.returnLocale);
}

export function normalizeReturnLocale(
  locale: string | null | undefined,
): "en" | "fr" {
  return locale === "fr" ? "fr" : "en";
}

export async function createMetaOAuthState(
  adminUserId: string,
  returnLocale: string,
) {
  const prisma = getPrisma();
  if (!prisma)
    throw new MetaOAuthError("not_configured", "The database is unavailable.");
  const state = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + getMetaOAuthStateTtlMs());

  await prisma.$transaction(async (tx) => {
    // Opportunistic cleanup only. Consumption still validates expiry.
    await tx.metaOAuthState.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) } },
          { consumedAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) } },
        ],
      },
    });
    await tx.metaOAuthState.create({
      data: {
        stateHash: hashMetaOAuthState(state),
        adminUserId,
        returnLocale: normalizeReturnLocale(returnLocale),
        expiresAt,
      },
    });
  });

  return { state, expiresAt };
}

export function buildMetaAuthorizationUrl(state: string) {
  const { appId } = getMetaAppCredentials();
  const url = new URL(
    `https://www.facebook.com/${getMetaGraphVersion()}/dialog/oauth`,
  );
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", getMetaOAuthRedirectUri());
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", META_OAUTH_SCOPES.join(","));
  // Re-ask if the administrator previously declined one of the required scopes.
  url.searchParams.set("auth_type", "rerequest");
  return url.toString();
}

/**
 * Atomically consumes a state value. The conditional update is the replay
 * barrier: only one concurrent callback can change consumedAt from NULL.
 */
export async function consumeMetaOAuthState(
  state: string,
  adminUserId: string,
) {
  if (!state || state.length < 20 || state.length > 200) {
    throw new MetaOAuthError(
      "state_missing",
      "The Meta sign-in response did not include a valid state.",
    );
  }
  const prisma = getPrisma();
  if (!prisma)
    throw new MetaOAuthError("not_configured", "The database is unavailable.");
  const stateHash = hashMetaOAuthState(state);

  return prisma.$transaction(async (tx) => {
    const row = await tx.metaOAuthState.findUnique({ where: { stateHash } });
    if (!row)
      throw new MetaOAuthError(
        "state_invalid",
        "This Meta sign-in request is not recognised.",
      );
    if (row.adminUserId !== adminUserId) {
      throw new MetaOAuthError(
        "state_wrong_admin",
        "This Meta sign-in request belongs to a different administrator.",
      );
    }
    if (row.consumedAt)
      throw new MetaOAuthError(
        "state_replayed",
        "This Meta sign-in request was already used.",
      );
    if (row.expiresAt.getTime() <= Date.now()) {
      throw new MetaOAuthError(
        "state_expired",
        "This Meta sign-in request expired. Start again.",
      );
    }

    const consumed = await tx.metaOAuthState.updateMany({
      where: { id: row.id, consumedAt: null, expiresAt: { gt: new Date() } },
      data: { consumedAt: new Date() },
    });
    if (consumed.count !== 1) {
      throw new MetaOAuthError(
        "state_replayed",
        "This Meta sign-in request was already used.",
      );
    }
    return {
      returnLocale: normalizeReturnLocale(row.returnLocale),
      stateId: row.id,
    };
  });
}

type TokenExchangeResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
};
type LongLivedTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
};

export async function exchangeMetaAuthorizationCode(code: string) {
  const { appId, appSecret } = getMetaAppCredentials();
  const response = await metaOAuthRequest<TokenExchangeResponse>(
    "oauth/access_token",
    {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: getMetaOAuthRedirectUri(),
      code,
    },
  );
  if (!response.access_token) {
    throw new MetaOAuthError(
      "token_exchange_failed",
      "Meta did not return an access token.",
    );
  }
  return response.access_token;
}

export async function exchangeMetaLongLivedToken(shortToken: string) {
  const { appId, appSecret } = getMetaAppCredentials();
  const response = await metaOAuthRequest<LongLivedTokenResponse>(
    "oauth/access_token",
    {
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortToken,
    },
  );
  if (!response.access_token) {
    throw new MetaOAuthError(
      "token_exchange_failed",
      "Meta did not return a long-lived access token.",
    );
  }
  return {
    accessToken: response.access_token,
    expiresInSeconds:
      typeof response.expires_in === "number" ? response.expires_in : null,
  };
}

function expiryFromDebug(
  debug: MetaDebugTokenData,
  fallbackSeconds: number | null,
) {
  if (typeof debug.expires_at === "number" && debug.expires_at > 0)
    return new Date(debug.expires_at * 1000);
  if (fallbackSeconds && fallbackSeconds > 0)
    return new Date(Date.now() + fallbackSeconds * 1000);
  return null;
}

function dataAccessExpiry(debug: MetaDebugTokenData) {
  if (
    typeof debug.data_access_expires_at === "number" &&
    debug.data_access_expires_at > 0
  ) {
    return new Date(debug.data_access_expires_at * 1000);
  }
  return null;
}

export type CompleteMetaOAuthResult = {
  connectionId: string;
  returnLocale: "en" | "fr";
  missingScopes: string[];
};

/**
 * Full server-side callback: consumes state, exchanges the one-time code,
 * upgrades to a long-lived token, verifies it through debug_token, and stores
 * only the encrypted credential. It never returns a token to the caller.
 */
export async function completeMetaOAuth(input: {
  state: string | null;
  code: string | null;
  errorCode: string | null;
  adminUserId: string;
}): Promise<CompleteMetaOAuthResult> {
  if (!input.state)
    throw new MetaOAuthError(
      "state_missing",
      "The Meta sign-in response did not include state.",
    );
  const { returnLocale } = await consumeMetaOAuthState(
    input.state,
    input.adminUserId,
  );

  if (input.errorCode) {
    throw new MetaOAuthError(
      "access_denied",
      "Meta authorization was cancelled or denied.",
    );
  }
  if (!input.code || input.code.length < 10 || input.code.length > 4096) {
    throw new MetaOAuthError(
      "code_missing",
      "Meta did not return an authorization code.",
    );
  }

  const prisma = getPrisma();
  if (!prisma)
    throw new MetaOAuthError("not_configured", "The database is unavailable.");

  let shortToken: string;
  try {
    shortToken = await exchangeMetaAuthorizationCode(input.code);
  } catch (error) {
    if (error instanceof MetaOAuthError) throw error;
    throw new MetaOAuthError(
      "token_exchange_failed",
      "Meta could not exchange the authorization code.",
    );
  }

  let longToken: { accessToken: string; expiresInSeconds: number | null };
  try {
    longToken = await exchangeMetaLongLivedToken(shortToken);
  } catch {
    // Falling back to the short-lived token would create a connection that
    // silently stops working within the hour. Fail closed instead.
    throw new MetaOAuthError(
      "token_exchange_failed",
      "Meta could not issue a long-lived access token.",
    );
  }

  let debug: MetaDebugTokenData;
  let identity: { id: string; name?: string };
  try {
    debug = await debugMetaToken(longToken.accessToken);
    identity = await getMetaIdentity(longToken.accessToken);
  } catch (error) {
    if (error instanceof MetaGraphError) {
      throw new MetaOAuthError("provider_error", error.message);
    }
    throw new MetaOAuthError(
      "invalid_token",
      "Meta could not validate the new access token.",
    );
  }

  const { appId } = getMetaAppCredentials();
  if (
    debug.is_valid === false ||
    !debug.app_id ||
    debug.app_id !== appId ||
    !identity.id
  ) {
    throw new MetaOAuthError(
      "wrong_app",
      "The returned Meta token is not valid for this application.",
    );
  }

  const granted = Array.isArray(debug.scopes) ? debug.scopes : [];
  const missingScopes = META_OAUTH_SCOPES.filter(
    (scope) => !granted.includes(scope),
  );
  const encrypted = encryptMetaToken(longToken.accessToken);
  const tokenExpiresAt = expiryFromDebug(debug, longToken.expiresInSeconds);
  const dataAccessExpiresAt = dataAccessExpiry(debug);
  const status = missingScopes.length ? "ATTENTION_REQUIRED" : "CONNECTED";
  const healthMessage = missingScopes.length
    ? `Missing permissions: ${missingScopes.join(", ")}`
    : null;

  const connectionId = await prisma.$transaction(async (tx) => {
    const existing = await tx.metaConnection.findFirst({
      where: {
        adminUserId: input.adminUserId,
        status: { not: "DISCONNECTED" },
      },
      orderBy: { connectedAt: "desc" },
      select: { id: true, metaUserId: true },
    });

    if (existing) {
      // A different Meta identity must not inherit the previous account
      // selections. Historical publications are preserved through snapshots.
      if (existing.metaUserId !== identity.id) {
        await tx.metaConnectedAccount.updateMany({
          where: { connectionId: existing.id, disconnectedAt: null },
          data: {
            disconnectedAt: new Date(),
            healthStatus: "DISCONNECTED",
            healthMessage: "The Meta identity was replaced by a reconnect.",
            encryptedAccessToken: null,
          },
        });
      }
      await tx.metaConnection.updateMany({
        where: {
          id: { not: existing.id },
          adminUserId: input.adminUserId,
          status: { not: "DISCONNECTED" },
        },
        data: {
          status: "DISCONNECTED",
          disconnectedAt: new Date(),
          encryptedUserToken: null,
        },
      });
      await tx.metaConnection.update({
        where: { id: existing.id },
        data: {
          metaUserId: identity.id,
          metaUserName: identity.name || null,
          encryptedUserToken: encrypted,
          tokenEncryptionVersion: "v1",
          tokenExpiresAt,
          dataAccessExpiresAt,
          grantedPermissions: granted,
          declinedPermissions: [],
          status,
          healthMessage,
          lastValidatedAt: new Date(),
          connectedById: input.adminUserId,
          disconnectedAt: null,
        },
      });
      return existing.id;
    }

    const created = await tx.metaConnection.create({
      data: {
        adminUserId: input.adminUserId,
        metaUserId: identity.id,
        metaUserName: identity.name || null,
        encryptedUserToken: encrypted,
        tokenEncryptionVersion: "v1",
        tokenExpiresAt,
        dataAccessExpiresAt,
        grantedPermissions: granted,
        declinedPermissions: [],
        status,
        healthMessage,
        lastValidatedAt: new Date(),
        connectedById: input.adminUserId,
      },
    });
    return created.id;
  });

  return { connectionId, returnLocale, missingScopes };
}
