import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import {
  consumeMetaOAuthState,
  createMetaOAuthState,
  hashMetaOAuthState,
  MetaOAuthError,
} from "@/lib/meta/oauth";

const prisma = getPrisma();
const createdStateIds: string[] = [];
const createdAdminIds: string[] = [];

async function createAdmin(label: string) {
  if (!prisma) return null;
  const admin = await prisma.adminUser.create({
    data: { email: `meta-oauth-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`, name: "Meta OAuth Test", role: "super_admin" },
  });
  createdAdminIds.push(admin.id);
  return admin;
}

afterEach(async () => {
  if (!prisma) return;
  for (const id of createdStateIds) {
    await prisma.metaOAuthState.delete({ where: { id } }).catch(() => undefined);
  }
  createdStateIds.length = 0;
  for (const id of createdAdminIds) {
    await prisma.adminUser.delete({ where: { id } }).catch(() => undefined);
  }
  createdAdminIds.length = 0;
});

describe("meta oauth state", () => {
  it("stores only a hash and binds the state to the initiating administrator", async () => {
    if (!prisma) return;
    const admin = await createAdmin("a");
    if (!admin) return;

    const { state, expiresAt } = await createMetaOAuthState(admin.id, "fr");
    const row = await prisma.metaOAuthState.findUnique({ where: { stateHash: hashMetaOAuthState(state) } });
    expect(row).not.toBeNull();
    expect(row?.adminUserId).toBe(admin.id);
    expect(row?.returnLocale).toBe("fr");
    expect(row?.expiresAt.getTime()).toBe(expiresAt.getTime());
    expect(row?.consumedAt).toBeNull();
    expect(row?.stateHash).not.toBe(state);
    expect(row?.stateHash).toBe(createHash("sha256").update(state, "utf8").digest("hex"));
    if (row) createdStateIds.push(row.id);
  });

  it("rejects a state that belongs to a different administrator", async () => {
    if (!prisma) return;
    const owner = await createAdmin("owner");
    const other = await createAdmin("other");
    if (!owner || !other) return;

    const { state } = await createMetaOAuthState(owner.id, "en");
    const row = await prisma.metaOAuthState.findUnique({ where: { stateHash: hashMetaOAuthState(state) } });
    if (row) createdStateIds.push(row.id);

    await expect(consumeMetaOAuthState(state, other.id)).rejects.toMatchObject({ code: "state_wrong_admin" });
    const untouched = await prisma.metaOAuthState.findUnique({ where: { stateHash: hashMetaOAuthState(state) } });
    expect(untouched?.consumedAt).toBeNull();
  });

  it("rejects an expired state without consuming it", async () => {
    if (!prisma) return;
    const admin = await createAdmin("expired");
    if (!admin) return;

    const state = "expired-state-value-with-enough-length";
    const row = await prisma.metaOAuthState.create({
      data: {
        stateHash: hashMetaOAuthState(state),
        adminUserId: admin.id,
        returnLocale: "en",
        expiresAt: new Date(Date.now() - 60_000),
      },
    });
    createdStateIds.push(row.id);

    await expect(consumeMetaOAuthState(state, admin.id)).rejects.toMatchObject({ code: "state_expired" });
    const untouched = await prisma.metaOAuthState.findUnique({ where: { id: row.id } });
    expect(untouched?.consumedAt).toBeNull();
  });

  it("rejects a replayed state", async () => {
    if (!prisma) return;
    const admin = await createAdmin("replay");
    if (!admin) return;

    const { state } = await createMetaOAuthState(admin.id, "en");
    const row = await prisma.metaOAuthState.findUnique({ where: { stateHash: hashMetaOAuthState(state) } });
    if (row) createdStateIds.push(row.id);

    const first = await consumeMetaOAuthState(state, admin.id);
    expect(first.returnLocale).toBe("en");
    await expect(consumeMetaOAuthState(state, admin.id)).rejects.toMatchObject({ code: "state_replayed" });
  });

  it("allows only one concurrent consumer", async () => {
    if (!prisma) return;
    const admin = await createAdmin("concurrent");
    if (!admin) return;

    const { state } = await createMetaOAuthState(admin.id, "en");
    const row = await prisma.metaOAuthState.findUnique({ where: { stateHash: hashMetaOAuthState(state) } });
    if (row) createdStateIds.push(row.id);

    const results = await Promise.allSettled([
      consumeMetaOAuthState(state, admin.id),
      consumeMetaOAuthState(state, admin.id),
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    const reason = (rejected[0] as PromiseRejectedResult).reason;
    expect(reason).toBeInstanceOf(MetaOAuthError);
    expect((reason as MetaOAuthError).code).toBe("state_replayed");
  });

  it("rejects unknown, malformed, and blank states", async () => {
    if (!prisma) return;
    const admin = await createAdmin("blank");
    if (!admin) return;
    await expect(consumeMetaOAuthState("", admin.id)).rejects.toBeInstanceOf(MetaOAuthError);
    await expect(consumeMetaOAuthState("short", admin.id)).rejects.toBeInstanceOf(MetaOAuthError);
    await expect(consumeMetaOAuthState("a".repeat(201), admin.id)).rejects.toBeInstanceOf(MetaOAuthError);
    await expect(consumeMetaOAuthState("not-a-real-state", admin.id)).rejects.toMatchObject({ code: "state_invalid" });
  });
});
