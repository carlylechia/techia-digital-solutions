import "server-only";

import {
  getMetaApiTimeoutMs,
  getMetaAppAccessToken,
  getMetaGraphVersion,
} from "./config";

export type MetaErrorCategory =
  | "authentication"
  | "permission"
  | "ineligible"
  | "unsupported_media"
  | "rate_limit"
  | "outage"
  | "invalid_request"
  | "processing_pending"
  | "publication_failed"
  | "ambiguous"
  | "configuration";

export class MetaGraphError extends Error {
  readonly category: MetaErrorCategory;
  readonly httpStatus: number | null;
  readonly code: number | null;
  readonly subcode: number | null;
  readonly traceId: string | null;
  readonly retryAfterSeconds: number | null;
  readonly technicalMessage: string;

  constructor(input: {
    category: MetaErrorCategory;
    message: string;
    technicalMessage?: string;
    httpStatus?: number | null;
    code?: number | null;
    subcode?: number | null;
    traceId?: string | null;
    retryAfterSeconds?: number | null;
  }) {
    super(input.message);
    this.name = "MetaGraphError";
    this.category = input.category;
    this.httpStatus = input.httpStatus ?? null;
    this.code = input.code ?? null;
    this.subcode = input.subcode ?? null;
    this.traceId = input.traceId ?? null;
    this.retryAfterSeconds = input.retryAfterSeconds ?? null;
    this.technicalMessage = sanitizeMetaErrorText(
      input.technicalMessage || input.message,
    );
  }
}

/** Removes anything token-like before an error is logged or persisted. */
export function sanitizeMetaErrorText(input: string) {
  return input
    .replace(/EAA[A-Za-z0-9_-]{10,}/g, "[redacted-token]")
    .replace(/IGQV[A-Za-z0-9_-]{10,}/g, "[redacted-token]")
    .replace(/(access_token=)[^&\s]+/gi, "$1[redacted]")
    .slice(0, 500);
}

const SAFE_MESSAGES: Record<MetaErrorCategory, string> = {
  authentication:
    "Meta authorization is no longer valid. Reconnect the Meta account.",
  permission: "The connected Meta account is missing a required permission.",
  ineligible:
    "This Meta account is not currently eligible for direct publishing.",
  unsupported_media:
    "Meta rejected the selected image. Use a supported JPEG image.",
  rate_limit: "Meta is rate-limiting requests. Wait and try again.",
  outage: "Meta is temporarily unavailable. Try again shortly.",
  invalid_request:
    "Meta rejected the request. Review the destination and content.",
  processing_pending:
    "Meta is still processing the media. Check the status again shortly.",
  publication_failed: "Meta did not publish this content.",
  ambiguous:
    "The Meta response was interrupted, so the publication result is unknown. Check history before retrying.",
  configuration: "The Meta integration is not configured correctly.",
};

export function effectiveMetaHttpStatus(status: number) {
  return Number.isFinite(status) ? status : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function mapMetaGraphError(input: {
  httpStatus?: number | null;
  payload?: unknown;
  fallbackMessage?: string;
  network?: boolean;
  aborted?: boolean;
}): MetaGraphError {
  const httpStatus = effectiveMetaHttpStatus(input.httpStatus ?? 0);
  const payload = input.payload as
    | { error?: Record<string, unknown> }
    | null
    | undefined;
  const raw = payload?.error;
  const code = numberOrNull(raw?.code);
  const subcode = numberOrNull(raw?.error_subcode);
  const traceId = stringOrNull(raw?.fbtrace_id);
  const technicalMessage =
    stringOrNull(raw?.message) ||
    input.fallbackMessage ||
    "Meta request failed.";

  let category: MetaErrorCategory = "publication_failed";
  if (input.aborted) category = "ambiguous";
  else if (input.network) category = "outage";
  else if (code === 190 || code === 102 || httpStatus === 401)
    category = "authentication";
  else if (
    (code !== null &&
      (code === 10 || (code >= 200 && code <= 299) || code === 272)) ||
    httpStatus === 403
  )
    category = "permission";
  else if (
    code === 4 ||
    code === 17 ||
    code === 32 ||
    code === 613 ||
    httpStatus === 429
  )
    category = "rate_limit";
  else if (
    code === 1 ||
    code === 2 ||
    (httpStatus !== null && httpStatus >= 500)
  )
    category = "outage";
  else if (code === 368) category = "ineligible";
  else if (
    code === 9004 ||
    code === 9007 ||
    code === 2207001 ||
    code === 2207026 ||
    code === 2207027
  )
    category = "unsupported_media";
  else if (code === 100 || httpStatus === 400 || httpStatus === 422)
    category = "invalid_request";

  // Instagram container processing is a normal intermediate state, not a hard
  // failure. Meta returns code 9007 with a "media not ready" style message.
  if (
    technicalMessage.toLowerCase().includes("not ready") ||
    technicalMessage.toLowerCase().includes("in progress")
  ) {
    category = "processing_pending";
  }

  return new MetaGraphError({
    category,
    message: SAFE_MESSAGES[category],
    technicalMessage,
    httpStatus,
    code,
    subcode,
    traceId,
  });
}

export function isAmbiguousMetaFailure(error: unknown) {
  return (
    error instanceof MetaGraphError &&
    (error.category === "ambiguous" || error.category === "outage")
  );
}

type QueryValue = string | number | boolean | null | undefined;

function applyParams(url: URL, params?: Record<string, QueryValue>) {
  if (!params) return;
  for (const [key, entry] of Object.entries(params)) {
    if (entry === undefined || entry === null || entry === "") continue;
    url.searchParams.set(key, String(entry));
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type MetaGraphRequestOptions = {
  method?: "GET" | "POST" | "DELETE";
  params?: Record<string, QueryValue>;
  accessToken: string;
  timeoutMs?: number;
  /** Safe read retries are only allowed for idempotent GET requests. */
  retry?: boolean;
};

/**
 * Minimal Graph API client. It pins the version, uses bearer auth so tokens do
 * not appear in URLs, applies a timeout, validates JSON, and maps provider
 * failures into safe categories. It never retries a mutating request.
 */
export async function metaGraphRequest<T>(
  path: string,
  options: MetaGraphRequestOptions,
): Promise<T> {
  const method = options.method || "GET";
  const version = getMetaGraphVersion();
  const base = `https://graph.facebook.com/${version}/${path.replace(/^\//, "")}`;
  const timeoutMs = options.timeoutMs ?? getMetaApiTimeoutMs();
  const canRetry = method === "GET" && options.retry !== false;
  const attempts = canRetry ? 2 : 1;

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const url = new URL(base);
    if (method === "GET" || method === "DELETE")
      applyParams(url, options.params);

    let body: URLSearchParams | undefined;
    if (method === "POST") {
      body = new URLSearchParams();
      for (const [key, entry] of Object.entries(options.params || {})) {
        if (entry === undefined || entry === null || entry === "") continue;
        body.set(key, String(entry));
      }
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${options.accessToken}`,
          Accept: "application/json",
          ...(body
            ? { "Content-Type": "application/x-www-form-urlencoded" }
            : {}),
        },
        body,
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      });

      const text = await response.text();
      let json: unknown = {};
      if (text) {
        try {
          json = JSON.parse(text);
        } catch {
          if (response.ok) {
            throw new MetaGraphError({
              category: "outage",
              message: SAFE_MESSAGES.outage,
              technicalMessage: "Meta returned a non-JSON response.",
              httpStatus: response.status,
            });
          }
        }
      }

      if (
        !response.ok ||
        (json && typeof json === "object" && "error" in json)
      ) {
        const mapped = mapMetaGraphError({
          httpStatus: response.status,
          payload: json,
          fallbackMessage: text.slice(0, 300),
        });
        if (
          canRetry &&
          attempt < attempts &&
          (mapped.category === "rate_limit" || mapped.category === "outage")
        ) {
          lastError = mapped;
          await sleep(Math.min((mapped.retryAfterSeconds || 1) * 1000, 1500));
          continue;
        }
        throw mapped;
      }

      return json as T;
    } catch (error) {
      if (error instanceof MetaGraphError) {
        if (
          canRetry &&
          attempt < attempts &&
          (error.category === "rate_limit" || error.category === "outage")
        ) {
          lastError = error;
          await sleep(Math.min((error.retryAfterSeconds || 1) * 1000, 1500));
          continue;
        }
        throw error;
      }
      const aborted =
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError");
      const mapped = mapMetaGraphError({
        network: !aborted,
        aborted,
        fallbackMessage:
          error instanceof Error ? error.message : "Network request failed.",
      });
      if (canRetry && attempt < attempts && mapped.category !== "ambiguous") {
        lastError = mapped;
        await sleep(1000);
        continue;
      }
      throw mapped;
    }
  }

  if (lastError instanceof MetaGraphError) throw lastError;
  throw new MetaGraphError({
    category: "outage",
    message: SAFE_MESSAGES.outage,
    technicalMessage: "Meta request failed after retry.",
  });
}

/**
 * OAuth token endpoints are separate because they authenticate with the app
 * secret, not a bearer token. Never log the request URL: it contains the secret.
 */
export async function metaOAuthRequest<T>(
  path: string,
  params: Record<string, QueryValue>,
): Promise<T> {
  const version = getMetaGraphVersion();
  const url = new URL(
    `https://graph.facebook.com/${version}/${path.replace(/^\//, "")}`,
  );
  applyParams(url, params);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(getMetaApiTimeoutMs()),
      cache: "no-store",
    });
    const text = await response.text();
    let json: unknown = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = {};
    }
    if (!response.ok || (json && typeof json === "object" && "error" in json)) {
      throw mapMetaGraphError({
        httpStatus: response.status,
        payload: json,
        fallbackMessage: "Meta OAuth exchange failed.",
      });
    }
    return json as T;
  } catch (error) {
    if (error instanceof MetaGraphError) throw error;
    const aborted =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    throw mapMetaGraphError({
      aborted,
      network: !aborted,
      fallbackMessage: "Meta OAuth request could not be completed.",
    });
  }
}

export type MetaPagedResult<T> = {
  data?: T[];
  paging?: { cursors?: { after?: string } };
};

export async function metaGraphPaged<T>(
  path: string,
  options: MetaGraphRequestOptions,
  maxPages = 10,
): Promise<T[]> {
  const results: T[] = [];
  let after: string | undefined;
  for (let page = 0; page < maxPages; page += 1) {
    const response = await metaGraphRequest<MetaPagedResult<T>>(path, {
      ...options,
      method: "GET",
      params: { ...(options.params || {}), after },
    });
    if (Array.isArray(response.data)) results.push(...response.data);
    const next = response.paging?.cursors?.after;
    if (!next || next === after || !response.data?.length) break;
    after = next;
  }
  return results;
}

export type MetaDebugTokenData = {
  app_id?: string;
  type?: string;
  application?: string;
  data_access_expires_at?: number;
  expires_at?: number;
  is_valid?: boolean;
  issued_at?: number;
  scopes?: string[];
  user_id?: string;
};

export async function debugMetaToken(
  inputToken: string,
): Promise<MetaDebugTokenData> {
  const response = await metaGraphRequest<{ data?: MetaDebugTokenData }>(
    "debug_token",
    {
      method: "GET",
      params: { input_token: inputToken },
      accessToken: getMetaAppAccessToken(),
      retry: false,
    },
  );
  return response.data || {};
}

export async function getMetaIdentity(accessToken: string) {
  return metaGraphRequest<{ id: string; name?: string }>("me", {
    method: "GET",
    params: { fields: "id,name" },
    accessToken,
  });
}

export type MetaPageAccount = {
  id: string;
  name: string;
  access_token?: string;
  tasks?: string[];
  category?: string;
  instagram_business_account?: {
    id: string;
    username?: string;
    name?: string;
    profile_picture_url?: string;
  };
};

export async function getMetaPageAccounts(accessToken: string) {
  return metaGraphPaged<MetaPageAccount>("me/accounts", {
    accessToken,
    params: {
      fields:
        "id,name,access_token,tasks,category,instagram_business_account{id,username,name,profile_picture_url}",
      limit: 100,
    },
  });
}
