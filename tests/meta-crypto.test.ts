import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  decryptMetaToken,
  encryptMetaToken,
  safeEqualHex,
  META_TOKEN_ENCRYPTION_VERSION,
} from "@/lib/meta/crypto";

const ORIGINAL_KEY = process.env.META_TOKEN_ENCRYPTION_KEY;
const ORIGINAL_PREVIOUS = process.env.META_TOKEN_ENCRYPTION_KEY_PREVIOUS;

function setKey(value: string | undefined) {
  if (value === undefined) delete process.env.META_TOKEN_ENCRYPTION_KEY;
  else process.env.META_TOKEN_ENCRYPTION_KEY = value;
}

const VALID_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const SECOND_KEY = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";

beforeEach(() => {
  setKey(VALID_KEY);
  delete process.env.META_TOKEN_ENCRYPTION_KEY_PREVIOUS;
});

afterEach(() => {
  setKey(ORIGINAL_KEY);
  if (ORIGINAL_PREVIOUS === undefined) delete process.env.META_TOKEN_ENCRYPTION_KEY_PREVIOUS;
  else process.env.META_TOKEN_ENCRYPTION_KEY_PREVIOUS = ORIGINAL_PREVIOUS;
});

describe("meta token encryption", () => {
  it("refuses to encrypt when the key is missing or invalid", () => {
    setKey(undefined);
    expect(() => encryptMetaToken("secret")).toThrow();

    setKey("too-short");
    expect(() => encryptMetaToken("secret")).toThrow();

    setKey("g".repeat(64));
    expect(() => encryptMetaToken("secret")).toThrow();
  });

  it("round-trips plaintext and uses the version prefix", () => {
    const token = "EAA-long-lived-user-token.example";
    const encrypted = encryptMetaToken(token);
    expect(encrypted.startsWith(`${META_TOKEN_ENCRYPTION_VERSION}.`)).toBe(true);
    expect(encrypted.split(".")).toHaveLength(4);
    expect(decryptMetaToken(encrypted)).toBe(token);
  });

  it("produces distinct ciphertexts for identical plaintext", () => {
    const first = encryptMetaToken("same-secret");
    const second = encryptMetaToken("same-secret");
    expect(first).not.toBe(second);
    expect(decryptMetaToken(first)).toBe("same-secret");
    expect(decryptMetaToken(second)).toBe("same-secret");
  });

  it("fails closed when the ciphertext is tampered with", () => {
    const encrypted = encryptMetaToken("secret");
    const parts = encrypted.split(".");
    const tampered = `${parts[0]}.${parts[1]}.${parts[2]}.${parts[3].slice(0, -2)}aa`;
    expect(() => decryptMetaToken(tampered)).toThrow();
  });

  it("fails closed when the authentication tag is altered", () => {
    const encrypted = encryptMetaToken("secret");
    const parts = encrypted.split(".");
    const badTag = `${parts[0]}.${parts[1]}.${parts[2].slice(0, -2)}aa.${parts[3]}`;
    expect(() => decryptMetaToken(badTag)).toThrow();
  });

  it("rejects an unsupported version prefix", () => {
    const encrypted = encryptMetaToken("secret");
    expect(() => decryptMetaToken(`v9.${encrypted.split(".").slice(1).join(".")}`)).toThrow();
  });

  it("decrypts with the previous key during a rotation window", () => {
    const encrypted = encryptMetaToken("rotated-secret");
    process.env.META_TOKEN_ENCRYPTION_KEY_PREVIOUS = VALID_KEY;
    setKey(SECOND_KEY);
    expect(decryptMetaToken(encrypted)).toBe("rotated-secret");
  });

  it("still fails when neither key can decrypt the payload", () => {
    const encrypted = encryptMetaToken("rotated-secret");
    process.env.META_TOKEN_ENCRYPTION_KEY_PREVIOUS = SECOND_KEY;
    setKey("0".repeat(64));
    expect(() => decryptMetaToken(encrypted)).toThrow();
  });

  it("rejects an empty payload", () => {
    expect(() => decryptMetaToken("")).toThrow();
  });

  it("compares hex values in constant time", () => {
    const value = "a".repeat(64);
    expect(safeEqualHex(value, value)).toBe(true);
    expect(safeEqualHex(value, "b".repeat(64))).toBe(false);
    expect(safeEqualHex(value, value.slice(0, 63))).toBe(false);
    expect(safeEqualHex("", "")).toBe(false);
  });
});
