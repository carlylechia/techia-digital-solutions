import { NextResponse } from "next/server";
import { BlogAuthorizationError } from "@/lib/blog/auth";
import { MetaConfigurationError } from "./config";
import { MetaTokenEncryptionError } from "./crypto";
import { MetaGraphError } from "./graph";
import { MetaOAuthError } from "./oauth";
import { MetaAccountError } from "./accounts";
import { MetaPublishingError } from "./publishing";

export function metaNoStore<T>(body: T, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function logSafe(context: string, error: unknown) {
  if (error instanceof MetaGraphError) {
    console.error(context, {
      category: error.category,
      code: error.code,
      subcode: error.subcode,
      httpStatus: error.httpStatus,
      traceId: error.traceId,
      message: error.technicalMessage,
    });
    return;
  }
  if (error instanceof Error) {
    console.error(context, {
      name: error.name,
      message: error.message.slice(0, 300),
    });
    return;
  }
  console.error(context, { message: "Unknown error" });
}

export function metaApiError(context: string, error: unknown) {
  if (error instanceof BlogAuthorizationError) {
    return metaNoStore(
      { ok: false, error: error.message, code: "authorization" },
      error.status,
    );
  }
  if (error instanceof MetaOAuthError) {
    const status =
      error.code === "state_wrong_admin"
        ? 403
        : error.code === "not_configured"
          ? 503
          : error.code === "provider_error"
            ? 502
            : 400;
    logSafe(context, error);
    return metaNoStore(
      { ok: false, error: error.message, code: error.code },
      status,
    );
  }
  if (error instanceof MetaAccountError) {
    const status =
      error.code === "database_unavailable"
        ? 503
        : error.code === "connection_not_found" ||
            error.code === "account_not_found"
          ? 404
          : error.code === "permission_missing"
            ? 403
            : error.code === "account_ineligible" ||
                error.code === "invalid_selection"
              ? 422
              : 409;
    logSafe(context, error);
    return metaNoStore(
      { ok: false, error: error.message, code: error.code },
      status,
    );
  }
  if (error instanceof MetaPublishingError) {
    const status =
      error.code === "not_configured" || error.code === "database_unavailable"
        ? 503
        : error.code === "disabled"
          ? 403
          : error.code === "not_found"
            ? 404
            : error.code === "not_public" ||
                error.code === "no_variant" ||
                error.code === "no_caption" ||
                error.code === "caption_too_long" ||
                error.code === "media_unsupported" ||
                error.code === "media_unavailable"
              ? 422
              : 409;
    logSafe(context, error);
    return metaNoStore(
      { ok: false, error: error.message, code: error.code },
      status,
    );
  }
  if (error instanceof MetaGraphError) {
    const status =
      error.category === "authentication"
        ? 409
        : error.category === "permission"
          ? 403
          : error.category === "rate_limit"
            ? 429
            : error.category === "ineligible" ||
                error.category === "unsupported_media" ||
                error.category === "invalid_request"
              ? 422
              : error.category === "processing_pending"
                ? 202
                : 502;
    logSafe(context, error);
    return metaNoStore(
      {
        ok: false,
        error: error.message,
        code: error.category,
        traceId: error.traceId,
      },
      status,
    );
  }
  if (error instanceof MetaConfigurationError) {
    console.error(context, { code: error.code, message: error.message });
    return metaNoStore(
      { ok: false, error: error.message, code: error.code },
      503,
    );
  }
  if (error instanceof MetaTokenEncryptionError) {
    console.error(context, { code: error.code });
    return metaNoStore(
      { ok: false, error: error.message, code: error.code },
      500,
    );
  }
  logSafe(context, error);
  return metaNoStore(
    { ok: false, error: "The Meta operation could not be completed safely." },
    500,
  );
}
