import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { MetaConfigurationError } from "./config";

/**
 * Authenticated encryption for Meta bearer tokens.
 *
 * Format: v1.<iv-base64url>.<auth-tag-base64url>.<ciphertext-base64url>
 * Algorithm: AES-256-GCM with a fresh 96-bit nonce per encryption.
 *
 * The version prefix is stored alongside every token so key/algorithm rotation
 * can be performed without guessing. Tokens are only decrypted inside a narrow
 * server-side scope immediately before a Meta API request.
 */
export const META_TOKEN_ENCRYPTION_VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

export class MetaTokenEncryptionError extends Error {
  readonly code = "token_encryption_failed";

  constructor(message = "The stored Meta credential could not be decrypted.") {
    super(message);
    this.name = "MetaTokenEncryptionError";
  }
}

function decodeKey(raw: string, envName: string): Buffer {
  const trimmed = raw.trim();
  let key: Buffer | null = null;
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    key = Buffer.from(trimmed, "hex");
  } else if (/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) {
    key = Buffer.from(trimmed, "base64");
  }
  if (!key || key.length !== 32) {
    throw new MetaConfigurationError(
      "encryption_key_invalid",
      `${envName} must be exactly 32 bytes encoded as base64 or 64 hexadecimal characters.`,
    );
  }
  return key;
}

function currentKey() {
  const raw = (process.env.META_TOKEN_ENCRYPTION_KEY || "").trim();
  if (!raw) {
    throw new MetaConfigurationError(
      "encryption_key_missing",
      "META_TOKEN_ENCRYPTION_KEY is required before Meta tokens can be stored.",
    );
  }
  return decodeKey(raw, "META_TOKEN_ENCRYPTION_KEY");
}

function previousKey(): Buffer | null {
  const raw = (process.env.META_TOKEN_ENCRYPTION_KEY_PREVIOUS || "").trim();
  if (!raw) return null;
  try {
    return decodeKey(raw, "META_TOKEN_ENCRYPTION_KEY_PREVIOUS");
  } catch {
    return null;
  }
}

export function isMetaTokenEncryptionReady() {
  try {
    currentKey();
    return true;
  } catch {
    return false;
  }
}

export function encryptMetaToken(plaintext: string): string {
  if (typeof plaintext !== "string" || plaintext.length < 1) {
    throw new MetaTokenEncryptionError(
      "Cannot encrypt an empty Meta credential.",
    );
  }
  const key = currentKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_BYTES,
  });
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    META_TOKEN_ENCRYPTION_VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function tryDecrypt(
  payload: string,
  key: Buffer,
  version: string,
): string | null {
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== version) return null;
  try {
    const iv = Buffer.from(parts[1], "base64url");
    const tag = Buffer.from(parts[2], "base64url");
    const ciphertext = Buffer.from(parts[3], "base64url");
    if (
      iv.length !== IV_BYTES ||
      tag.length !== TAG_BYTES ||
      ciphertext.length === 0
    )
      return null;
    const decipher = createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: TAG_BYTES,
    });
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
    return plaintext || null;
  } catch {
    return null;
  }
}

/**
 * Decrypts a stored credential. The current key is tried first; during a
 * documented rotation window the previous key is also tried. A failed
 * authentication tag is never treated as valid plaintext.
 */
export function decryptMetaToken(payload: string): string {
  if (!payload || typeof payload !== "string") {
    throw new MetaTokenEncryptionError();
  }
  const [version] = payload.split(".");
  if (version !== META_TOKEN_ENCRYPTION_VERSION) {
    throw new MetaTokenEncryptionError(
      "The stored Meta credential uses an unsupported encryption version.",
    );
  }
  const current = tryDecrypt(
    payload,
    currentKey(),
    META_TOKEN_ENCRYPTION_VERSION,
  );
  if (current) return current;

  const previous = previousKey();
  if (previous) {
    const old = tryDecrypt(payload, previous, META_TOKEN_ENCRYPTION_VERSION);
    if (old) return old;
  }
  throw new MetaTokenEncryptionError();
}

/** Constant-time comparison helper for hashed OAuth state values. */
export function safeEqualHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}
