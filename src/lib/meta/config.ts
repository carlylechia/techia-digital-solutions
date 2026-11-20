import "server-only";

/**
 * Central configuration for the Meta Business integration.
 *
 * The Graph API version is pinned here and only overridable through an explicit
 * environment variable. It is never left implicit in a request URL.
 * Current stable version per Meta's changelog (November 2026): v27.0.
 */
export const META_GRAPH_VERSION_DEFAULT = "v27.0";

/**
 * Facebook Login (Page-linked Instagram model). This is the only model used by
 * this integration: it yields Facebook Page tokens and discovers the Instagram
 * professional account linked to each Page. We intentionally do not mix it with
 * Instagram Login or Unified Login tokens.
 */
export const META_OAUTH_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
] as const;

export const META_REQUIRED_PAGE_TASKS = [
  "CREATE_CONTENT",
  "MANAGE",
  "MODERATE",
] as const;

export const META_LOGO_SCOPES = [...META_OAUTH_SCOPES];

export class MetaConfigurationError extends Error {
  readonly code:
    | "not_configured"
    | "invalid_configuration"
    | "encryption_key_missing"
    | "encryption_key_invalid";

  constructor(code: MetaConfigurationError["code"], message: string) {
    super(message);
    this.name = "MetaConfigurationError";
    this.code = code;
  }
}

function value(name: string) {
  return (process.env[name] || "").trim();
}

export function getMetaGraphVersion() {
  const configured = value("META_GRAPH_API_VERSION");
  if (!configured) return META_GRAPH_VERSION_DEFAULT;
  if (!/^v\d+\.\d+$/.test(configured)) {
    throw new MetaConfigurationError(
      "invalid_configuration",
      "META_GRAPH_API_VERSION must look like v27.0.",
    );
  }
  return configured;
}

export function getMetaAppCredentials() {
  const appId = value("META_APP_ID");
  const appSecret = value("META_APP_SECRET");
  if (!appId || !appSecret) {
    throw new MetaConfigurationError(
      "not_configured",
      "Meta is not configured. Set META_APP_ID and META_APP_SECRET.",
    );
  }
  if (!/^\d{6,32}$/.test(appId)) {
    throw new MetaConfigurationError(
      "invalid_configuration",
      "META_APP_ID is not a valid Meta app id.",
    );
  }
  return { appId, appSecret };
}

export function getMetaAppAccessToken() {
  const { appId, appSecret } = getMetaAppCredentials();
  return `${appId}|${appSecret}`;
}

/**
 * The OAuth redirect URI must be exact and is never derived from an untrusted
 * Host header. Prefer the explicit environment variable; fall back to the
 * configured canonical site URL for local/preview convenience.
 */
export function getMetaOAuthRedirectUri() {
  const explicit = value("META_OAUTH_REDIRECT_URI");
  const candidate =
    explicit ||
    (value("NEXTAUTH_URL")
      ? `${value("NEXTAUTH_URL").replace(/\/$/, "")}/api/meta/oauth/callback`
      : "");
  if (!candidate) {
    throw new MetaConfigurationError(
      "not_configured",
      "Meta OAuth redirect URI is not configured. Set META_OAUTH_REDIRECT_URI.",
    );
  }
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new MetaConfigurationError(
      "invalid_configuration",
      "META_OAUTH_REDIRECT_URI must be an absolute URL.",
    );
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !local) {
    throw new MetaConfigurationError(
      "invalid_configuration",
      "META_OAUTH_REDIRECT_URI must use HTTPS outside local development.",
    );
  }
  if (url.pathname !== "/api/meta/oauth/callback") {
    throw new MetaConfigurationError(
      "invalid_configuration",
      "META_OAUTH_REDIRECT_URI must point to /api/meta/oauth/callback.",
    );
  }
  return url.toString();
}

export function isMetaConfigured() {
  try {
    getMetaAppCredentials();
    getMetaOAuthRedirectUri();
    getMetaGraphVersion();
    return true;
  } catch {
    return false;
  }
}

export function isMetaTokenEncryptionConfigured() {
  return Boolean(value("META_TOKEN_ENCRYPTION_KEY"));
}

export type MetaConfigurationSummary = {
  configured: boolean;
  graphVersion: string;
  redirectUri: string | null;
  encryptionKeyConfigured: boolean;
  envPublishingEnabled: boolean;
};

export function getMetaConfigurationSummary(): MetaConfigurationSummary {
  let configured = false;
  let redirectUri: string | null = null;
  let graphVersion = META_GRAPH_VERSION_DEFAULT;
  try {
    getMetaAppCredentials();
    redirectUri = getMetaOAuthRedirectUri();
    graphVersion = getMetaGraphVersion();
    configured = true;
  } catch {
    configured = false;
  }
  return {
    configured: configured && isMetaTokenEncryptionConfigured(),
    graphVersion,
    redirectUri,
    encryptionKeyConfigured: isMetaTokenEncryptionConfigured(),
    envPublishingEnabled: isMetaEnvPublishingEnabled(),
  };
}

/**
 * Environment kill switch. Only the literal string "true" enables publishing.
 * It always takes precedence over the database setting.
 */
export function isMetaEnvPublishingEnabled() {
  return process.env.META_PUBLISHING_ENABLED === "true";
}

function boundedInt(name: string, fallback: number, min: number, max: number) {
  const raw = Number(value(name));
  if (!Number.isFinite(raw) || raw < min) return fallback;
  return Math.min(Math.floor(raw), max);
}

export function getMetaApiTimeoutMs() {
  return boundedInt("META_API_TIMEOUT_MS", 15_000, 2_000, 60_000);
}

export function getMetaOAuthStateTtlMs() {
  return boundedInt("META_OAUTH_STATE_TTL_MINUTES", 10, 2, 60) * 60_000;
}

export function getMetaMediaProcessingTimeoutMs() {
  return boundedInt("META_MEDIA_PROCESSING_TIMEOUT_MS", 30_000, 5_000, 55_000);
}

export function getMetaMediaPollIntervalMs() {
  return boundedInt("META_MEDIA_POLL_INTERVAL_MS", 2_000, 500, 10_000);
}
