import "dotenv/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import { encryptMetaToken } from "@/lib/meta/crypto";
import { discoverMetaAssets, refreshMetaConnectionHealth, connectMetaAccounts } from "@/lib/meta/accounts";

const prisma = getPrisma();

let originalFetch: typeof fetch;
let grantedScopes: string[] = [];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const created = { connectionIds: [] as string[], adminIds: [] as string[] };

async function createAdmin() {
  if (!prisma) return null;
  const admin = await prisma.adminUser.create({
    data: { email: `meta-accounts-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`, name: "Meta Accounts Test", role: "super_admin" },
  });
  created.adminIds.push(admin.id);
  return admin;
}

beforeEach(() => {
  process.env.META_PUBLISHING_ENABLED = "false";
  process.env.META_APP_ID = "1234567890";
  process.env.META_APP_SECRET = "super-secret-value";
  process.env.META_OAUTH_REDIRECT_URI = "https://techiadigital.com/api/meta/oauth/callback";
  process.env.META_TOKEN_ENCRYPTION_KEY = "0".repeat(64);
  if (!process.env.NEXT_PUBLIC_SITE_URL) process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";

  grantedScopes = ["pages_show_list", "pages_read_engagement", "pages_manage_posts"];

  originalFetch = global.fetch;
  global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
    const method = (init?.method || "GET").toUpperCase();
    if (url.includes("me/accounts")) {
      return jsonResponse({
        data: [
          {
            id: "page-1",
            name: "Test Page",
            access_token: "page-token-123",
            tasks: ["CREATE_CONTENT"],
            instagram_business_account: { id: "ig-1", username: "testig" },
          },
        ],
      });
    }
    if (url.includes("debug_token")) {
      return jsonResponse({
        data: {
          is_valid: true,
          app_id: "1234567890",
          scopes: grantedScopes,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      });
    }
    if (url.includes("page-1") && method === "GET") {
      return jsonResponse({ id: "page-1", name: "Test Page", tasks: ["CREATE_CONTENT"] });
    }
    return jsonResponse({});
  }) as typeof fetch;
});

afterEach(async () => {
  global.fetch = originalFetch;
  for (const id of created.connectionIds) {
    await prisma?.metaConnectedAccount.deleteMany({ where: { connectionId: id } }).catch(() => undefined);
    await prisma?.metaConnection.delete({ where: { id } }).catch(() => undefined);
  }
  created.connectionIds.length = 0;
  for (const id of created.adminIds) await prisma?.adminUser.delete({ where: { id } }).catch(() => undefined);
  created.adminIds.length = 0;
});

async function createConnection(adminId: string, scopes: string[]) {
  if (!prisma) return null;
  const connection = await prisma.metaConnection.create({
    data: {
      adminUserId: adminId,
      metaUserId: "meta-user-1",
      metaUserName: "Meta Tester",
      encryptedUserToken: encryptMetaToken("user-token"),
      status: "CONNECTED",
      grantedPermissions: scopes,
      connectedById: adminId,
    },
  });
  created.connectionIds.push(connection.id);
  return connection;
}

describe("meta accounts permission eligibility", () => {
  it("discovery rejects a Page missing pages_read_user_content", async () => {
    if (!prisma) return;
    const admin = await createAdmin();
    if (!admin) return;
    const connection = await createConnection(admin.id, grantedScopes);
    if (!connection) return;

    const discovery = await discoverMetaAssets(connection.id, admin.id);
    expect(discovery.pages).toHaveLength(1);
    expect(discovery.pages[0].isEligible).toBe(false);
    expect(discovery.pages[0].ineligibilityReason).toMatch(/pages_read_user_content/i);
  });

  it("persistence skips a Page missing pages_read_user_content", async () => {
    if (!prisma) return;
    const admin = await createAdmin();
    if (!admin) return;
    const connection = await createConnection(admin.id, grantedScopes);
    if (!connection) return;

    const result = await connectMetaAccounts({
      connectionId: connection.id,
      adminUserId: admin.id,
      selections: [{ platform: "FACEBOOK_PAGE", platformAccountId: "page-1" }],
    });
    expect(result.accounts).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].reason).toMatch(/pages_read_user_content/i);
  });

  it("health refresh reports the missing permission and updates eligibility", async () => {
    if (!prisma) return;
    const admin = await createAdmin();
    if (!admin) return;
    const connection = await createConnection(admin.id, grantedScopes);
    if (!connection) return;
    const account = await prisma.metaConnectedAccount.create({
      data: {
        connectionId: connection.id,
        platform: "FACEBOOK_PAGE",
        platformAccountId: "page-1",
        displayName: "Test Page",
        pageId: "page-1",
        pageName: "Test Page",
        encryptedAccessToken: encryptMetaToken("page-token-123"),
        tasks: ["CREATE_CONTENT"],
        isEligible: true,
        permissionStatus: "OK",
        healthStatus: "HEALTHY",
      },
    });

    const refreshed = await refreshMetaConnectionHealth(connection.id, admin.id);
    expect(refreshed.status).toBe("ATTENTION_REQUIRED");
    const refreshedAccount = refreshed.accounts.find((item) => item.id === account.id);
    expect(refreshedAccount?.permissionStatus).toBe("MISSING");
    expect(refreshedAccount?.healthStatus).toBe("PERMISSION_MISSING");
    expect(refreshedAccount?.healthMessage).toMatch(/pages_read_user_content/i);
    expect(refreshedAccount?.isEligible).toBe(false);
  });

  it("health refresh keeps a Page eligible when all permissions are present", async () => {
    if (!prisma) return;
    const admin = await createAdmin();
    if (!admin) return;
    grantedScopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_read_user_content",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_content_publish",
    ];
    const connection = await prisma.metaConnection.create({
      data: {
        adminUserId: admin.id,
        metaUserId: "meta-user-2",
        metaUserName: "Meta Tester 2",
        encryptedUserToken: encryptMetaToken("user-token"),
        status: "CONNECTED",
        grantedPermissions: grantedScopes,
        connectedById: admin.id,
      },
    });
    created.connectionIds.push(connection.id);
    const account = await prisma.metaConnectedAccount.create({
      data: {
        connectionId: connection.id,
        platform: "FACEBOOK_PAGE",
        platformAccountId: "page-2",
        displayName: "Healthy Page",
        pageId: "page-2",
        pageName: "Healthy Page",
        encryptedAccessToken: encryptMetaToken("page-token-456"),
        tasks: ["CREATE_CONTENT"],
        isEligible: true,
        permissionStatus: "OK",
        healthStatus: "HEALTHY",
      },
    });

    // mock page fetch returns tasks
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
      if (url.includes("debug_token")) {
        return jsonResponse({
          data: {
            is_valid: true,
            app_id: "1234567890",
            scopes: grantedScopes,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          },
        });
      }
      if (url.includes("page-2")) {
        return jsonResponse({ id: "page-2", name: "Healthy Page", tasks: ["CREATE_CONTENT"] });
      }
      return jsonResponse({});
    }) as typeof fetch;

    const refreshed = await refreshMetaConnectionHealth(connection.id, admin.id);
    expect(refreshed.status).toBe("CONNECTED");
    const refreshedAccount = refreshed.accounts.find((item) => item.id === account.id);
    expect(refreshedAccount?.permissionStatus).toBe("OK");
    expect(refreshedAccount?.healthStatus).toBe("HEALTHY");
    expect(refreshedAccount?.isEligible).toBe(true);
  });
});
