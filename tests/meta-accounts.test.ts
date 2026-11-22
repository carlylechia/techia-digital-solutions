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

  it("keeps a Facebook Page eligible when only Instagram permissions are missing", async () => {
    if (!prisma) return;
    const admin = await createAdmin();
    if (!admin) return;
    grantedScopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_read_user_content",
      "pages_manage_posts",
    ];
    const connection = await createConnection(admin.id, grantedScopes);
    if (!connection) return;

    const discovery = await discoverMetaAssets(connection.id, admin.id);
    expect(discovery.pages[0].isEligible).toBe(true);
    expect(discovery.pages[0].instagram?.isEligible).toBe(false);
    expect(discovery.pages[0].instagram?.ineligibilityReason).toMatch(
      /instagram_basic|instagram_content_publish/i,
    );
  });

  it("keeps a MANAGE Page eligible when instagram_content_publish is missing", async () => {
    if (!prisma) return;
    const admin = await createAdmin();
    if (!admin) return;
    grantedScopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_read_user_content",
      "pages_manage_posts",
    ];
    const connection = await prisma.metaConnection.create({
      data: {
        adminUserId: admin.id,
        metaUserId: "meta-user-manage",
        metaUserName: "Meta Manager",
        encryptedUserToken: encryptMetaToken("user-token"),
        status: "CONNECTED",
        grantedPermissions: grantedScopes,
        connectedById: admin.id,
      },
    });
    created.connectionIds.push(connection.id);

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
      if (url.includes("me/accounts")) {
        return jsonResponse({
          data: [
            {
              id: "page-manage",
              name: "Managed Page",
              access_token: "page-token-456",
              tasks: ["MANAGE"],
            },
          ],
        });
      }
      return jsonResponse({});
    }) as typeof fetch;

    const discovery = await discoverMetaAssets(connection.id, admin.id);
    expect(discovery.pages[0].isEligible).toBe(true);
  });

  it("marks a Page ineligible during health refresh when its token is missing", async () => {
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
    const connection = await createConnection(admin.id, grantedScopes);
    if (!connection) return;
    const account = await prisma.metaConnectedAccount.create({
      data: {
        connectionId: connection.id,
        platform: "FACEBOOK_PAGE",
        platformAccountId: "page-tokenless",
        displayName: "Tokenless Page",
        pageId: "page-tokenless",
        pageName: "Tokenless Page",
        encryptedAccessToken: null,
        tasks: ["CREATE_CONTENT"],
        isEligible: true,
        permissionStatus: "OK",
        healthStatus: "HEALTHY",
      },
    });

    const refreshed = await refreshMetaConnectionHealth(connection.id, admin.id);
    const refreshedAccount = refreshed.accounts.find((item) => item.id === account.id);
    expect(refreshedAccount?.healthStatus).toBe("TOKEN_REVOKED");
    expect(refreshedAccount?.isEligible).toBe(false);
    expect(refreshedAccount?.healthMessage).toMatch(/access token/i);
  });

  it("restores Page eligibility when the missing permission is granted", async () => {
    if (!prisma) return;
    const admin = await createAdmin();
    if (!admin) return;
    grantedScopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
    ];
    const connection = await createConnection(admin.id, grantedScopes);
    if (!connection) return;
    const account = await prisma.metaConnectedAccount.create({
      data: {
        connectionId: connection.id,
        platform: "FACEBOOK_PAGE",
        platformAccountId: "page-restore",
        displayName: "Restored Page",
        pageId: "page-restore",
        pageName: "Restored Page",
        encryptedAccessToken: encryptMetaToken("page-token-789"),
        tasks: ["CREATE_CONTENT"],
        isEligible: false,
        permissionStatus: "MISSING",
        healthStatus: "PERMISSION_MISSING",
      },
    });

    // First refresh keeps it ineligible.
    let refreshed = await refreshMetaConnectionHealth(connection.id, admin.id);
    let refreshedAccount = refreshed.accounts.find((item) => item.id === account.id);
    expect(refreshedAccount?.isEligible).toBe(false);

    // Grant the missing permission and refresh again.
    grantedScopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_read_user_content",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_content_publish",
    ];
    await prisma.metaConnection.update({
      where: { id: connection.id },
      data: { grantedPermissions: grantedScopes },
    });

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
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
      if (url.includes("page-restore")) {
        return jsonResponse({ id: "page-restore", name: "Restored Page", tasks: ["CREATE_CONTENT"] });
      }
      return jsonResponse({});
    }) as typeof fetch;

    refreshed = await refreshMetaConnectionHealth(connection.id, admin.id);
    refreshedAccount = refreshed.accounts.find((item) => item.id === account.id);
    expect(refreshed.status).toBe("CONNECTED");
    expect(refreshedAccount?.permissionStatus).toBe("OK");
    expect(refreshedAccount?.healthStatus).toBe("HEALTHY");
    expect(refreshedAccount?.isEligible).toBe(true);
  });


  it("keeps a CREATE_CONTENT Page eligible when only instagram_basic is missing", async () => {
    if (!prisma) return;
    const admin = await createAdmin();
    if (!admin) return;
    grantedScopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_read_user_content",
      "pages_manage_posts",
      "instagram_content_publish",
    ];
    const connection = await createConnection(admin.id, grantedScopes);
    if (!connection) return;
    const pageAccount = await prisma.metaConnectedAccount.create({
      data: {
        connectionId: connection.id,
        platform: "FACEBOOK_PAGE",
        platformAccountId: "page-fb-only",
        displayName: "Facebook Only Page",
        pageId: "page-fb-only",
        pageName: "Facebook Only Page",
        encryptedAccessToken: encryptMetaToken("page-token-fb"),
        tasks: ["CREATE_CONTENT"],
        isEligible: false,
        permissionStatus: "MISSING",
        healthStatus: "PERMISSION_MISSING",
      },
    });
    const instagramAccount = await prisma.metaConnectedAccount.create({
      data: {
        connectionId: connection.id,
        platform: "INSTAGRAM",
        platformAccountId: "ig-fb-only",
        displayName: "Instagram Account",
        pageId: "page-fb-only",
        pageName: "Facebook Only Page",
        tasks: ["CREATE_CONTENT"],
        isEligible: true,
        permissionStatus: "OK",
        healthStatus: "HEALTHY",
      },
    });

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
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
      if (url.includes("page-fb-only")) {
        return jsonResponse({ id: "page-fb-only", name: "Facebook Only Page", tasks: ["CREATE_CONTENT"] });
      }
      if (url.includes("ig-fb-only")) {
        return jsonResponse({ id: "ig-fb-only", username: "igfbonly" });
      }
      return jsonResponse({});
    }) as typeof fetch;

    const refreshed = await refreshMetaConnectionHealth(connection.id, admin.id);
    const refreshedPage = refreshed.accounts.find((item) => item.id === pageAccount.id);
    const refreshedInstagram = refreshed.accounts.find((item) => item.id === instagramAccount.id);

    expect(refreshed.status).toBe("ATTENTION_REQUIRED");
    expect(refreshed.healthMessage).toMatch(/instagram_basic/i);
    expect(refreshedPage?.permissionStatus).toBe("OK");
    expect(refreshedPage?.healthStatus).toBe("HEALTHY");
    expect(refreshedPage?.isEligible).toBe(true);
    expect(refreshedInstagram?.permissionStatus).toBe("MISSING");
    expect(refreshedInstagram?.isEligible).toBe(false);
  });

  it("keeps a MANAGE Page eligible when only instagram_content_publish is missing", async () => {
    if (!prisma) return;
    const admin = await createAdmin();
    if (!admin) return;
    grantedScopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_read_user_content",
      "pages_manage_posts",
      "instagram_basic",
    ];
    const connection = await createConnection(admin.id, grantedScopes);
    if (!connection) return;
    const pageAccount = await prisma.metaConnectedAccount.create({
      data: {
        connectionId: connection.id,
        platform: "FACEBOOK_PAGE",
        platformAccountId: "page-manage-only",
        displayName: "Managed Page",
        pageId: "page-manage-only",
        pageName: "Managed Page",
        encryptedAccessToken: encryptMetaToken("page-token-manage"),
        tasks: ["MANAGE"],
        isEligible: false,
        permissionStatus: "MISSING",
        healthStatus: "PERMISSION_MISSING",
      },
    });

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
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
      if (url.includes("page-manage-only")) {
        return jsonResponse({ id: "page-manage-only", name: "Managed Page", tasks: ["MANAGE"] });
      }
      return jsonResponse({});
    }) as typeof fetch;

    const refreshed = await refreshMetaConnectionHealth(connection.id, admin.id);
    const refreshedPage = refreshed.accounts.find((item) => item.id === pageAccount.id);

    expect(refreshedPage?.permissionStatus).toBe("OK");
    expect(refreshedPage?.healthStatus).toBe("HEALTHY");
    expect(refreshedPage?.isEligible).toBe(true);
  });

  it("marks a Page ineligible when pages_read_user_content is missing", async () => {
    if (!prisma) return;
    const admin = await createAdmin();
    if (!admin) return;
    grantedScopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_content_publish",
    ];
    const connection = await createConnection(admin.id, grantedScopes);
    if (!connection) return;
    const pageAccount = await prisma.metaConnectedAccount.create({
      data: {
        connectionId: connection.id,
        platform: "FACEBOOK_PAGE",
        platformAccountId: "page-missing-read",
        displayName: "Read Permission Page",
        pageId: "page-missing-read",
        pageName: "Read Permission Page",
        encryptedAccessToken: encryptMetaToken("page-token-read"),
        tasks: ["CREATE_CONTENT"],
        isEligible: true,
        permissionStatus: "OK",
        healthStatus: "HEALTHY",
      },
    });

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
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
      if (url.includes("page-missing-read")) {
        return jsonResponse({ id: "page-missing-read", name: "Read Permission Page", tasks: ["CREATE_CONTENT"] });
      }
      return jsonResponse({});
    }) as typeof fetch;

    const refreshed = await refreshMetaConnectionHealth(connection.id, admin.id);
    const refreshedPage = refreshed.accounts.find((item) => item.id === pageAccount.id);

    expect(refreshedPage?.permissionStatus).toBe("MISSING");
    expect(refreshedPage?.healthStatus).toBe("PERMISSION_MISSING");
    expect(refreshedPage?.isEligible).toBe(false);
    expect(refreshedPage?.healthMessage).toMatch(/pages_read_user_content/i);
  });

  it("marks a Page ineligible when it has neither publishing task", async () => {
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
    const connection = await createConnection(admin.id, grantedScopes);
    if (!connection) return;
    const pageAccount = await prisma.metaConnectedAccount.create({
      data: {
        connectionId: connection.id,
        platform: "FACEBOOK_PAGE",
        platformAccountId: "page-no-task",
        displayName: "No Task Page",
        pageId: "page-no-task",
        pageName: "No Task Page",
        encryptedAccessToken: encryptMetaToken("page-token-task"),
        tasks: ["MODERATE"],
        isEligible: true,
        permissionStatus: "OK",
        healthStatus: "HEALTHY",
      },
    });

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
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
      if (url.includes("page-no-task")) {
        return jsonResponse({ id: "page-no-task", name: "No Task Page", tasks: ["MODERATE"] });
      }
      return jsonResponse({});
    }) as typeof fetch;

    const refreshed = await refreshMetaConnectionHealth(connection.id, admin.id);
    const refreshedPage = refreshed.accounts.find((item) => item.id === pageAccount.id);

    expect(refreshedPage?.permissionStatus).toBe("OK");
    expect(refreshedPage?.healthStatus).toBe("ATTENTION_REQUIRED");
    expect(refreshedPage?.isEligible).toBe(false);
    expect(refreshedPage?.healthMessage).toMatch(/publishing task/i);
  });

  it("marks a Page with an undecryptable token ineligible", async () => {
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
    const connection = await createConnection(admin.id, grantedScopes);
    if (!connection) return;
    const pageAccount = await prisma.metaConnectedAccount.create({
      data: {
        connectionId: connection.id,
        platform: "FACEBOOK_PAGE",
        platformAccountId: "page-bad-token",
        displayName: "Bad Token Page",
        pageId: "page-bad-token",
        pageName: "Bad Token Page",
        encryptedAccessToken: "not-a-valid-token",
        tasks: ["CREATE_CONTENT"],
        isEligible: true,
        permissionStatus: "OK",
        healthStatus: "HEALTHY",
      },
    });

    const refreshed = await refreshMetaConnectionHealth(connection.id, admin.id);
    const refreshedPage = refreshed.accounts.find((item) => item.id === pageAccount.id);

    expect(refreshedPage?.healthStatus).toBe("TOKEN_REVOKED");
    expect(refreshedPage?.isEligible).toBe(false);
  });

  it("marks an expired connection and its accounts ineligible", async () => {
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
        metaUserId: "meta-user-expired",
        metaUserName: "Expired User",
        encryptedUserToken: encryptMetaToken("user-token"),
        status: "CONNECTED",
        grantedPermissions: grantedScopes,
        tokenExpiresAt: new Date(Date.now() - 60_000),
        connectedById: admin.id,
      },
    });
    created.connectionIds.push(connection.id);
    const pageAccount = await prisma.metaConnectedAccount.create({
      data: {
        connectionId: connection.id,
        platform: "FACEBOOK_PAGE",
        platformAccountId: "page-expired",
        displayName: "Expired Page",
        pageId: "page-expired",
        pageName: "Expired Page",
        encryptedAccessToken: encryptMetaToken("page-token-expired"),
        tasks: ["CREATE_CONTENT"],
        isEligible: true,
        permissionStatus: "OK",
        healthStatus: "HEALTHY",
      },
    });

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
      if (url.includes("debug_token")) {
        return jsonResponse({
          data: {
            is_valid: true,
            app_id: "1234567890",
            scopes: grantedScopes,
            expires_at: Math.floor(Date.now() / 1000) - 60,
          },
        });
      }
      return jsonResponse({});
    }) as typeof fetch;

    const refreshed = await refreshMetaConnectionHealth(connection.id, admin.id);
    const refreshedPage = refreshed.accounts.find((item) => item.id === pageAccount.id);

    expect(refreshed.status).toBe("EXPIRED");
    expect(refreshedPage?.healthStatus).toBe("TOKEN_EXPIRED");
    expect(refreshedPage?.isEligible).toBe(false);
  });

  it("restores Instagram eligibility when Instagram permissions are granted", async () => {
    if (!prisma) return;
    const admin = await createAdmin();
    if (!admin) return;
    grantedScopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_read_user_content",
      "pages_manage_posts",
    ];
    const connection = await createConnection(admin.id, grantedScopes);
    if (!connection) return;
    const pageAccount = await prisma.metaConnectedAccount.create({
      data: {
        connectionId: connection.id,
        platform: "FACEBOOK_PAGE",
        platformAccountId: "page-ig-restore",
        displayName: "Parent Page",
        pageId: "page-ig-restore",
        pageName: "Parent Page",
        encryptedAccessToken: encryptMetaToken("page-token-ig"),
        tasks: ["CREATE_CONTENT"],
        isEligible: true,
        permissionStatus: "OK",
        healthStatus: "HEALTHY",
      },
    });
    const instagramAccount = await prisma.metaConnectedAccount.create({
      data: {
        connectionId: connection.id,
        platform: "INSTAGRAM",
        platformAccountId: "ig-restore",
        displayName: "Instagram Restore",
        pageId: "page-ig-restore",
        pageName: "Parent Page",
        tasks: ["CREATE_CONTENT"],
        isEligible: false,
        permissionStatus: "MISSING",
        healthStatus: "PERMISSION_MISSING",
      },
    });

    let refreshed = await refreshMetaConnectionHealth(connection.id, admin.id);
    let refreshedInstagram = refreshed.accounts.find((item) => item.id === instagramAccount.id);
    expect(refreshedInstagram?.isEligible).toBe(false);

    grantedScopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_read_user_content",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_content_publish",
    ];
    await prisma.metaConnection.update({
      where: { id: connection.id },
      data: { grantedPermissions: grantedScopes },
    });

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
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
      if (url.includes("page-ig-restore")) {
        return jsonResponse({ id: "page-ig-restore", name: "Parent Page", tasks: ["CREATE_CONTENT"] });
      }
      if (url.includes("ig-restore")) {
        return jsonResponse({ id: "ig-restore", username: "igrestore" });
      }
      return jsonResponse({});
    }) as typeof fetch;

    refreshed = await refreshMetaConnectionHealth(connection.id, admin.id);
    refreshedInstagram = refreshed.accounts.find((item) => item.id === instagramAccount.id);
    expect(refreshedInstagram?.permissionStatus).toBe("OK");
    expect(refreshedInstagram?.healthStatus).toBe("HEALTHY");
    expect(refreshedInstagram?.isEligible).toBe(true);
  });

});
