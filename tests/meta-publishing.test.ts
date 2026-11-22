import "dotenv/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import { encryptMetaToken } from "@/lib/meta/crypto";
import { publishMetaPublication, getMetaPublishingOverview } from "@/lib/meta/publishing";
import { MetaPublishingError } from "@/lib/meta/publishing";
import type { MetaPublishInput } from "@/lib/meta/types";

const prisma = getPrisma();

const ORIGINAL_ENV = {
  META_PUBLISHING_ENABLED: process.env.META_PUBLISHING_ENABLED,
  META_APP_ID: process.env.META_APP_ID,
  META_APP_SECRET: process.env.META_APP_SECRET,
  META_OAUTH_REDIRECT_URI: process.env.META_OAUTH_REDIRECT_URI,
  META_TOKEN_ENCRYPTION_KEY: process.env.META_TOKEN_ENCRYPTION_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
};

let originalFetch: typeof fetch;
let savedCaption = "Saved Facebook/Instagram caption with article link.";
let failNextPost = false;
let facebookFeedMode = "match";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function setupEnv() {
  process.env.META_PUBLISHING_ENABLED = "true";
  process.env.META_APP_ID = "1234567890";
  process.env.META_APP_SECRET = "super-secret-value";
  process.env.META_OAUTH_REDIRECT_URI = "https://techiadigital.com/api/meta/oauth/callback";
  process.env.META_TOKEN_ENCRYPTION_KEY = "0".repeat(64);
  process.env.CLOUDINARY_CLOUD_NAME = "test";
  if (!process.env.NEXT_PUBLIC_SITE_URL) process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
}

const created = {
  postIds: [] as string[],
  kitIds: [] as string[],
  connectionIds: [] as string[],
  adminIds: [] as string[],
};

async function createAdmin() {
  if (!prisma) return null;
  const admin = await prisma.adminUser.create({
    data: {
      email: `meta-pub-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      name: "Meta Publisher",
      role: "super_admin",
    },
  });
  created.adminIds.push(admin.id);
  return admin;
}

type FixtureOptions = {
  published?: boolean;
  caption?: string;
  graphicFormat?: "SQUARE" | "VERTICAL";
  graphicUrl?: string;
  ig?: boolean;
  longCaption?: boolean;
};

async function createFixture(options: FixtureOptions = {}) {
  if (!prisma) return null;
  const admin = await createAdmin();
  if (!admin) return null;

  const published = options.published !== false;
  const now = new Date();
  const post = await prisma.blogPost.create({
    data: {
      slug: `meta-pub-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: "Meta Publishing Test Article",
      excerpt: "A sufficiently long excerpt for validation purposes here.",
      content: "<p>Test content for Meta publishing.</p>",
      contentText: "Test content for Meta publishing.",
      locale: "en",
      status: published ? "PUBLISHED" : "DRAFT",
      published,
      publishedAt: published ? now : null,
      canonicalUrl: "https://techiadigital.com/blog/meta-publishing-test",
    },
  });
  created.postIds.push(post.id);

  const kit = await prisma.socialShareKit.create({ data: { postId: post.id, createdById: admin.id } });
  created.kitIds.push(kit.id);

  const caption = options.longCaption
    ? `${savedCaption} ${"x".repeat(2300)}`
    : options.caption || savedCaption;
  await prisma.socialShareVariant.create({
    data: { kitId: kit.id, platform: "FACEBOOK", generatedCaption: caption, editedCaption: caption },
  });
  await prisma.socialShareVariant.create({
    data: { kitId: kit.id, platform: "INSTAGRAM", generatedCaption: caption, editedCaption: caption },
  });

  const graphicUrl = options.graphicUrl || "https://res.cloudinary.com/test/image/upload/v1/square.jpg";
  const graphic = await prisma.socialShareGraphic.create({
    data: {
      kitId: kit.id,
      format: options.graphicFormat || "SQUARE",
      url: graphicUrl,
      publicId: `meta-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      width: 1080,
      height: options.graphicFormat === "VERTICAL" ? 1920 : 1080,
      bytes: 1000,
      formatMime: "image/png",
    },
  });

  const connection = await prisma.metaConnection.create({
    data: {
      adminUserId: admin.id,
      metaUserId: "meta-user-1",
      metaUserName: "Meta Tester",
      encryptedUserToken: encryptMetaToken("user-token"),
      status: "CONNECTED",
      grantedPermissions: [
        "pages_show_list",
        "pages_read_engagement",
        "pages_read_user_content",
        "pages_manage_posts",
        "instagram_basic",
        "instagram_content_publish",
      ],
      connectedById: admin.id,
    },
  });
  created.connectionIds.push(connection.id);

  const pageAccount = await prisma.metaConnectedAccount.create({
    data: {
      connectionId: connection.id,
      platform: "FACEBOOK_PAGE",
      platformAccountId: "page-1",
      displayName: "Test Page",
      pageId: "page-1",
      pageName: "Test Page",
      encryptedAccessToken: encryptMetaToken("page-token-123"),
      tasks: ["CREATE_CONTENT", "MANAGE", "MODERATE"],
      isEligible: true,
      permissionStatus: "OK",
      healthStatus: "HEALTHY",
    },
  });

  let instagramAccount = null;
  if (options.ig !== false) {
    instagramAccount = await prisma.metaConnectedAccount.create({
      data: {
        connectionId: connection.id,
        platform: "INSTAGRAM",
        platformAccountId: "ig-1",
        displayName: "Test Instagram",
        username: "testig",
        pageId: "page-1",
        pageName: "Test Page",
        linkedInstagramId: "ig-1",
        tasks: ["CREATE_CONTENT", "MANAGE", "MODERATE"],
        isEligible: true,
        permissionStatus: "OK",
        healthStatus: "HEALTHY",
      },
    });
  }

  await prisma.metaPublishingSettings.upsert({
    where: { id: "global" },
    create: { id: "global", publishingEnabled: true, updatedById: admin.id },
    update: { publishingEnabled: true, updatedById: admin.id },
  });

  return { admin, post, kit, graphic, connection, pageAccount, instagramAccount };
}

beforeEach(async () => {
  setupEnv();
  failNextPost = false;
  facebookFeedMode = "match";
  savedCaption = "Saved Facebook/Instagram caption with article link.";
  originalFetch = global.fetch;
  global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
    const method = (init?.method || "GET").toUpperCase();
    if (method === "HEAD") {
      const res = new Response(null, {
        status: 200,
        headers: { "content-type": "image/jpeg", "content-length": "1200" },
      });
      Object.defineProperty(res, "url", { value: "https://res.cloudinary.com/test/image/upload/v1/square.jpg" });
      return res;
    }
    if (url.includes("container_123") && url.includes("status_code")) {
      return jsonResponse({ status_code: "FINISHED" });
    }
    if (url.includes("/media_publish")) {
      return jsonResponse({ id: "ig_media_456" });
    }
    if (url.includes("/media")) {
      if (method === "POST") {
        if (failNextPost) {
          failNextPost = false;
          throw new Error("network down");
        }
        return jsonResponse({ id: "container_123" });
      }
      return jsonResponse({
        data: [{ id: "ig_media_456", caption: savedCaption, timestamp: new Date().toISOString(), permalink: "https://instagram.com/p/ig_456" }],
      });
    }
    if (url.includes("/photos") || url.includes("/feed")) {
      if (method === "POST") {
        if (failNextPost) {
          failNextPost = false;
          throw new Error("network down");
        }
        return jsonResponse({ id: "post_123", post_id: "post_123" });
      }
      if (facebookFeedMode === "empty") {
        return jsonResponse({ data: [] });
      }
      if (facebookFeedMode === "permission") {
        return jsonResponse({ error: { message: "permission denied", code: 10 } }, 403);
      }
      if (facebookFeedMode === "auth") {
        return jsonResponse({ error: { message: "invalid token", code: 190 } }, 401);
      }
      if (facebookFeedMode === "rate_limit") {
        return jsonResponse({ error: { message: "rate limited", code: 4 } }, 429);
      }
      if (facebookFeedMode === "provider") {
        return jsonResponse({ error: { message: "server error", code: 1 } }, 500);
      }
      if (facebookFeedMode === "timeout") {
        const error = new Error("timeout");
        error.name = "TimeoutError";
        throw error;
      }
      // map timeout throw to TimeoutError name
      return jsonResponse({
        data: [{ id: "post_123", message: savedCaption, created_time: new Date().toISOString(), permalink_url: "https://www.facebook.com/post_123" }],
      });
    }
    return jsonResponse({});
  }) as typeof fetch;
});

afterEach(async () => {
  global.fetch = originalFetch;
  for (const id of created.postIds) await prisma?.blogPost.delete({ where: { id } }).catch(() => undefined);
  for (const id of created.kitIds) {
    await prisma?.socialShareGraphic.deleteMany({ where: { kitId: id } }).catch(() => undefined);
    await prisma?.socialShareVariant.deleteMany({ where: { kitId: id } }).catch(() => undefined);
    await prisma?.socialShareKit.delete({ where: { id } }).catch(() => undefined);
  }
  for (const id of created.connectionIds) {
    await prisma?.metaPublication.deleteMany({ where: { connectedAccountId: { in: await prisma.metaConnectedAccount.findMany({ where: { connectionId: id }, select: { id: true } }).then((rows) => rows.map((row) => row.id)) } } }).catch(() => undefined);
    await prisma?.metaConnectedAccount.deleteMany({ where: { connectionId: id } }).catch(() => undefined);
    await prisma?.metaConnection.delete({ where: { id } }).catch(() => undefined);
  }
  for (const id of created.adminIds) await prisma?.adminUser.delete({ where: { id } }).catch(() => undefined);
  created.postIds.length = 0;
  created.kitIds.length = 0;
  created.connectionIds.length = 0;
  created.adminIds.length = 0;
  if (prisma) await prisma.metaPublishingSettings.deleteMany({ where: { id: "global" } }).catch(() => undefined);
  for (const [name, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe("meta direct publishing", () => {
  it("requires the article to be public", async () => {
    if (!prisma) return;
    const fixture = await createFixture({ published: false });
    if (!fixture) return;
    const input: MetaPublishInput = {
      postId: fixture.post.id,
      platform: "FACEBOOK",
      connectedAccountId: fixture.pageAccount.id,
      graphicId: null,
      idempotencyKey: `key-${Math.random()}`,
      confirm: true,
    };
    await expect(publishMetaPublication(input, fixture.admin.id)).rejects.toMatchObject({ code: "not_public" });
  });

  it("requires a saved caption variant", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    await prisma.socialShareVariant.deleteMany({ where: { kitId: fixture.kit.id, platform: "FACEBOOK" } });
    const input: MetaPublishInput = {
      postId: fixture.post.id,
      platform: "FACEBOOK",
      connectedAccountId: fixture.pageAccount.id,
      graphicId: null,
      idempotencyKey: `key-${Math.random()}`,
      confirm: true,
    };
    await expect(publishMetaPublication(input, fixture.admin.id)).rejects.toMatchObject({ code: "no_variant" });
  });

  it("rejects an over-long Instagram caption", async () => {
    if (!prisma) return;
    const fixture = await createFixture({ longCaption: true });
    if (!fixture) return;
    const input: MetaPublishInput = {
      postId: fixture.post.id,
      platform: "INSTAGRAM",
      connectedAccountId: fixture.instagramAccount!.id,
      graphicId: fixture.graphic.id,
      idempotencyKey: `key-${Math.random()}`,
      confirm: true,
    };
    await expect(publishMetaPublication(input, fixture.admin.id)).rejects.toMatchObject({ code: "caption_too_long" });
  });

  it("rejects an unsupported Instagram graphic orientation", async () => {
    if (!prisma) return;
    const fixture = await createFixture({ graphicFormat: "VERTICAL" });
    if (!fixture) return;
    const input: MetaPublishInput = {
      postId: fixture.post.id,
      platform: "INSTAGRAM",
      connectedAccountId: fixture.instagramAccount!.id,
      graphicId: fixture.graphic.id,
      idempotencyKey: `key-${Math.random()}`,
      confirm: true,
    };
    await expect(publishMetaPublication(input, fixture.admin.id)).rejects.toMatchObject({ code: "media_unsupported" });
  });

  it("rejects an untrusted media host", async () => {
    if (!prisma) return;
    const fixture = await createFixture({ graphicUrl: "https://evil.example.com/x.png" });
    if (!fixture) return;
    const input: MetaPublishInput = {
      postId: fixture.post.id,
      platform: "FACEBOOK",
      connectedAccountId: fixture.pageAccount.id,
      graphicId: fixture.graphic.id,
      idempotencyKey: `key-${Math.random()}`,
      confirm: true,
    };
    await expect(publishMetaPublication(input, fixture.admin.id)).rejects.toMatchObject({ code: "media_unavailable" });
  });

  it("publishes a Facebook text/link post and records success", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    const input: MetaPublishInput = {
      postId: fixture.post.id,
      platform: "FACEBOOK",
      connectedAccountId: fixture.pageAccount.id,
      graphicId: null,
      idempotencyKey: `key-${Math.random()}`,
      confirm: true,
    };
    const result = await publishMetaPublication(input, fixture.admin.id);
    expect(result.replayed).toBe(false);
    expect(result.publication.status).toBe("PUBLISHED");
    expect(result.publication.externalId).toBe("post_123");
    const row = await prisma.metaPublication.findUnique({ where: { id: result.publication.id } });
    expect(row?.activeKey).toBeNull();
    expect(row?.attemptCount).toBe(1);
  });

  it("publishes an Instagram single-image feed post", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    const input: MetaPublishInput = {
      postId: fixture.post.id,
      platform: "INSTAGRAM",
      connectedAccountId: fixture.instagramAccount!.id,
      graphicId: fixture.graphic.id,
      idempotencyKey: `key-${Math.random()}`,
      confirm: true,
    };
    const result = await publishMetaPublication(input, fixture.admin.id);
    expect(result.publication.status).toBe("PUBLISHED");
    expect(result.publication.externalId).toBe("ig_media_456");
    const row = await prisma.metaPublication.findUnique({ where: { id: result.publication.id } });
    expect(row?.containerId).toBe("container_123");
  });

  it("replays an identical idempotency key instead of duplicating", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    const key = `key-${Math.random()}`;
    const input: MetaPublishInput = {
      postId: fixture.post.id,
      platform: "FACEBOOK",
      connectedAccountId: fixture.pageAccount.id,
      graphicId: null,
      idempotencyKey: key,
      confirm: true,
    };
    const first = await publishMetaPublication(input, fixture.admin.id);
    const before = await prisma.metaPublication.count({ where: { articleId: fixture.post.id } });
    const second = await publishMetaPublication({ ...input, idempotencyKey: key }, fixture.admin.id);
    const after = await prisma.metaPublication.count({ where: { articleId: fixture.post.id } });
    expect(second.replayed).toBe(true);
    expect(second.publication.id).toBe(first.publication.id);
    expect(after).toBe(before);
  });

  it("conflicts when the same key is reused for different content", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    const key = `key-${Math.random()}`;
    await publishMetaPublication(
      {
        postId: fixture.post.id,
        platform: "FACEBOOK",
        connectedAccountId: fixture.pageAccount.id,
        graphicId: null,
        idempotencyKey: key,
        confirm: true,
      },
      fixture.admin.id,
    );
    const variant = await prisma.socialShareVariant.findUnique({
      where: { kitId_platform: { kitId: fixture.kit.id, platform: "FACEBOOK" } },
    });
    await prisma.socialShareVariant.update({
      where: { id: variant!.id },
      data: { editedCaption: "A different saved caption." },
    });
    await expect(
      publishMetaPublication(
        {
          postId: fixture.post.id,
          platform: "FACEBOOK",
          connectedAccountId: fixture.pageAccount.id,
          graphicId: null,
          idempotencyKey: key,
          confirm: true,
        },
        fixture.admin.id,
      ),
    ).rejects.toMatchObject({ code: "idempotency_conflict" });
  });

  it("blocks a second concurrent publication for the same content", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    const firstKey = `key-${Math.random()}`;
    const secondKey = `key-${Math.random()}`;
    const input = (key: string): MetaPublishInput => ({
      postId: fixture.post.id,
      platform: "FACEBOOK",
      connectedAccountId: fixture.pageAccount.id,
      graphicId: null,
      idempotencyKey: key,
      confirm: true,
    });
    const results = await Promise.allSettled([
      publishMetaPublication(input(firstKey), fixture.admin.id),
      publishMetaPublication(input(secondKey), fixture.admin.id),
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    const reason = (rejected[0] as PromiseRejectedResult).reason as MetaPublishingError;
    expect(reason).toBeInstanceOf(MetaPublishingError);
    expect(["in_progress", "already_published"]).toContain(reason.code);
  });

  it("records an ambiguous result and keeps the slot locked", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    failNextPost = true;
    const key = `key-${Math.random()}`;
    const result = await publishMetaPublication(
      {
        postId: fixture.post.id,
        platform: "FACEBOOK",
        connectedAccountId: fixture.pageAccount.id,
        graphicId: null,
        idempotencyKey: key,
        confirm: true,
      },
      fixture.admin.id,
    );
    expect(result.publication.status).toBe("UNKNOWN_RESULT");
    const row = await prisma.metaPublication.findUnique({ where: { id: result.publication.id } });
    expect(row?.activeKey).not.toBeNull();

    await expect(
      publishMetaPublication(
        {
          postId: fixture.post.id,
          platform: "FACEBOOK",
          connectedAccountId: fixture.pageAccount.id,
          graphicId: null,
          idempotencyKey: `key-${Math.random()}`,
          confirm: true,
        },
        fixture.admin.id,
      ),
    ).rejects.toMatchObject({ code: "ambiguous" });
  });

  it("reconciles an ambiguous Facebook result from the Page feed", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    failNextPost = true;
    const result = await publishMetaPublication(
      {
        postId: fixture.post.id,
        platform: "FACEBOOK",
        connectedAccountId: fixture.pageAccount.id,
        graphicId: null,
        idempotencyKey: `key-${Math.random()}`,
        confirm: true,
      },
      fixture.admin.id,
    );
    expect(result.publication.status).toBe("UNKNOWN_RESULT");
    const { reconcileMetaPublication } = await import("@/lib/meta/publishing");
    const reconciled = await reconcileMetaPublication(result.publication.id, fixture.admin.id);
    expect(reconciled.status).toBe("PUBLISHED");
    expect(reconciled.externalId).toBe("post_123");
  });

  it("supports manual resolution as failed", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    failNextPost = true;
    const result = await publishMetaPublication(
      {
        postId: fixture.post.id,
        platform: "FACEBOOK",
        connectedAccountId: fixture.pageAccount.id,
        graphicId: null,
        idempotencyKey: `key-${Math.random()}`,
        confirm: true,
      },
      fixture.admin.id,
    );
    const { resolveMetaPublication } = await import("@/lib/meta/publishing");
    const resolved = await resolveMetaPublication({
      publicationId: result.publication.id,
      adminUserId: fixture.admin.id,
      action: "mark_failed",
    });
    expect(resolved.status).toBe("FAILED");
    const row = await prisma.metaPublication.findUnique({ where: { id: result.publication.id } });
    expect(row?.activeKey).toBeNull();
  });

  it("blocks publishing when the environment kill switch is off", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    process.env.META_PUBLISHING_ENABLED = "false";
    await expect(
      publishMetaPublication(
        {
          postId: fixture.post.id,
          platform: "FACEBOOK",
          connectedAccountId: fixture.pageAccount.id,
          graphicId: null,
          idempotencyKey: `key-${Math.random()}`,
          confirm: true,
        },
        fixture.admin.id,
      ),
    ).rejects.toMatchObject({ code: "disabled" });
  });

  it("blocks publishing when the database switch is off", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    await prisma.metaPublishingSettings.update({ where: { id: "global" }, data: { publishingEnabled: false } });
    await expect(
      publishMetaPublication(
        {
          postId: fixture.post.id,
          platform: "FACEBOOK",
          connectedAccountId: fixture.pageAccount.id,
          graphicId: null,
          idempotencyKey: `key-${Math.random()}`,
          confirm: true,
        },
        fixture.admin.id,
      ),
    ).rejects.toMatchObject({ code: "disabled" });
  });

  it("reports kill-switch state in the publishing overview", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    process.env.META_PUBLISHING_ENABLED = "false";
    const overview = await getMetaPublishingOverview(fixture.admin.id);
    expect(overview.publishingEnabled).toBe(false);
    expect(overview.envPublishingEnabled).toBe(false);
  });

  it("never exposes a stored token through the overview", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    const overview = await getMetaPublishingOverview(fixture.admin.id);
    const serialized = JSON.stringify(overview);
    expect(serialized).not.toContain("page-token-123");
    expect(serialized).not.toContain("user-token");
  });

  it("reconciles when Facebook feed returns a matching post", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    failNextPost = true;
    const result = await publishMetaPublication(
      {
        postId: fixture.post.id,
        platform: "FACEBOOK",
        connectedAccountId: fixture.pageAccount.id,
        graphicId: null,
        idempotencyKey: `key-${Math.random()}`,
        confirm: true,
      },
      fixture.admin.id,
    );
    facebookFeedMode = "match";
    const { reconcileMetaPublication } = await import("@/lib/meta/publishing");
    const reconciled = await reconcileMetaPublication(result.publication.id, fixture.admin.id);
    expect(reconciled.status).toBe("PUBLISHED");
    expect(reconciled.externalId).toBe("post_123");
  });

  it("keeps the lock when Facebook feed succeeds but has no matching post", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    failNextPost = true;
    const result = await publishMetaPublication(
      {
        postId: fixture.post.id,
        platform: "FACEBOOK",
        connectedAccountId: fixture.pageAccount.id,
        graphicId: null,
        idempotencyKey: `key-${Math.random()}`,
        confirm: true,
      },
      fixture.admin.id,
    );
    facebookFeedMode = "empty";
    const { reconcileMetaPublication } = await import("@/lib/meta/publishing");
    const reconciled = await reconcileMetaPublication(result.publication.id, fixture.admin.id);
    expect(reconciled.status).toBe("UNKNOWN_RESULT");
    expect(reconciled.lastErrorCode).toBe("no_matching_post");
    const row = await prisma.metaPublication.findUnique({ where: { id: result.publication.id } });
    expect(row?.activeKey).not.toBeNull();
  });

  it("keeps the lock on a Facebook permission error", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    failNextPost = true;
    const result = await publishMetaPublication(
      {
        postId: fixture.post.id,
        platform: "FACEBOOK",
        connectedAccountId: fixture.pageAccount.id,
        graphicId: null,
        idempotencyKey: `key-${Math.random()}`,
        confirm: true,
      },
      fixture.admin.id,
    );
    facebookFeedMode = "permission";
    const { reconcileMetaPublication } = await import("@/lib/meta/publishing");
    const reconciled = await reconcileMetaPublication(result.publication.id, fixture.admin.id);
    expect(reconciled.status).toBe("UNKNOWN_RESULT");
    expect(reconciled.lastErrorCode).toBe("permission");
    const row = await prisma.metaPublication.findUnique({ where: { id: result.publication.id } });
    expect(row?.activeKey).not.toBeNull();
  });

  it("keeps the lock on a Facebook authentication error", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    failNextPost = true;
    const result = await publishMetaPublication(
      {
        postId: fixture.post.id,
        platform: "FACEBOOK",
        connectedAccountId: fixture.pageAccount.id,
        graphicId: null,
        idempotencyKey: `key-${Math.random()}`,
        confirm: true,
      },
      fixture.admin.id,
    );
    facebookFeedMode = "auth";
    const { reconcileMetaPublication } = await import("@/lib/meta/publishing");
    const reconciled = await reconcileMetaPublication(result.publication.id, fixture.admin.id);
    expect(reconciled.status).toBe("UNKNOWN_RESULT");
    expect(reconciled.lastErrorCode).toBe("authentication");
    const row = await prisma.metaPublication.findUnique({ where: { id: result.publication.id } });
    expect(row?.activeKey).not.toBeNull();
  });

  it("keeps the lock on a Facebook rate-limit error", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    failNextPost = true;
    const result = await publishMetaPublication(
      {
        postId: fixture.post.id,
        platform: "FACEBOOK",
        connectedAccountId: fixture.pageAccount.id,
        graphicId: null,
        idempotencyKey: `key-${Math.random()}`,
        confirm: true,
      },
      fixture.admin.id,
    );
    facebookFeedMode = "rate_limit";
    const { reconcileMetaPublication } = await import("@/lib/meta/publishing");
    const reconciled = await reconcileMetaPublication(result.publication.id, fixture.admin.id);
    expect(reconciled.status).toBe("UNKNOWN_RESULT");
    expect(reconciled.lastErrorCode).toBe("rate_limit");
    const row = await prisma.metaPublication.findUnique({ where: { id: result.publication.id } });
    expect(row?.activeKey).not.toBeNull();
  });

  it("keeps the lock on a Facebook timeout", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    failNextPost = true;
    const result = await publishMetaPublication(
      {
        postId: fixture.post.id,
        platform: "FACEBOOK",
        connectedAccountId: fixture.pageAccount.id,
        graphicId: null,
        idempotencyKey: `key-${Math.random()}`,
        confirm: true,
      },
      fixture.admin.id,
    );
    facebookFeedMode = "timeout";
    const { reconcileMetaPublication } = await import("@/lib/meta/publishing");
    const reconciled = await reconcileMetaPublication(result.publication.id, fixture.admin.id);
    expect(reconciled.status).toBe("UNKNOWN_RESULT");
    const row = await prisma.metaPublication.findUnique({ where: { id: result.publication.id } });
    expect(row?.activeKey).not.toBeNull();
  });

  it("keeps the lock on a Facebook provider error", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    failNextPost = true;
    const result = await publishMetaPublication(
      {
        postId: fixture.post.id,
        platform: "FACEBOOK",
        connectedAccountId: fixture.pageAccount.id,
        graphicId: null,
        idempotencyKey: `key-${Math.random()}`,
        confirm: true,
      },
      fixture.admin.id,
    );
    facebookFeedMode = "provider";
    const { reconcileMetaPublication } = await import("@/lib/meta/publishing");
    const reconciled = await reconcileMetaPublication(result.publication.id, fixture.admin.id);
    expect(reconciled.status).toBe("UNKNOWN_RESULT");
    const row = await prisma.metaPublication.findUnique({ where: { id: result.publication.id } });
    expect(row?.activeKey).not.toBeNull();
  });

  it("cannot release a stale PENDING lock after a failed lookup", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    failNextPost = true;
    const result = await publishMetaPublication(
      {
        postId: fixture.post.id,
        platform: "FACEBOOK",
        connectedAccountId: fixture.pageAccount.id,
        graphicId: null,
        idempotencyKey: `key-${Math.random()}`,
        confirm: true,
      },
      fixture.admin.id,
    );
    // Force the record to look stale.
    await prisma.metaPublication.update({
      where: { id: result.publication.id },
      data: { startedAt: new Date(Date.now() - 5 * 60_000) },
    });
    facebookFeedMode = "provider";
    const { reconcileMetaPublication } = await import("@/lib/meta/publishing");
    const reconciled = await reconcileMetaPublication(result.publication.id, fixture.admin.id);
    expect(reconciled.status).toBe("UNKNOWN_RESULT");
    const row = await prisma.metaPublication.findUnique({ where: { id: result.publication.id } });
    expect(row?.activeKey).not.toBeNull();
    expect(row?.completedAt).toBeNull();
  });

  it("cannot release an UNKNOWN_RESULT lock after a failed lookup", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    failNextPost = true;
    const result = await publishMetaPublication(
      {
        postId: fixture.post.id,
        platform: "FACEBOOK",
        connectedAccountId: fixture.pageAccount.id,
        graphicId: null,
        idempotencyKey: `key-${Math.random()}`,
        confirm: true,
      },
      fixture.admin.id,
    );
    expect(result.publication.status).toBe("UNKNOWN_RESULT");
    facebookFeedMode = "auth";
    const { reconcileMetaPublication } = await import("@/lib/meta/publishing");
    const reconciled = await reconcileMetaPublication(result.publication.id, fixture.admin.id);
    expect(reconciled.status).toBe("UNKNOWN_RESULT");
    const row = await prisma.metaPublication.findUnique({ where: { id: result.publication.id } });
    expect(row?.activeKey).not.toBeNull();
  });

  it("allows a second publish request to be blocked while unresolved", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    failNextPost = true;
    const result = await publishMetaPublication(
      {
        postId: fixture.post.id,
        platform: "FACEBOOK",
        connectedAccountId: fixture.pageAccount.id,
        graphicId: null,
        idempotencyKey: `key-${Math.random()}`,
        confirm: true,
      },
      fixture.admin.id,
    );
    facebookFeedMode = "empty";
    await expect(
      publishMetaPublication(
        {
          postId: fixture.post.id,
          platform: "FACEBOOK",
          connectedAccountId: fixture.pageAccount.id,
          graphicId: null,
          idempotencyKey: `key-${Math.random()}`,
          confirm: true,
        },
        fixture.admin.id,
      ),
    ).rejects.toMatchObject({ code: "ambiguous" });
    const row = await prisma.metaPublication.findUnique({ where: { id: result.publication.id } });
    expect(row?.activeKey).not.toBeNull();
  });

  it("releases the lock after human-confirmed failure", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    if (!fixture) return;
    failNextPost = true;
    const result = await publishMetaPublication(
      {
        postId: fixture.post.id,
        platform: "FACEBOOK",
        connectedAccountId: fixture.pageAccount.id,
        graphicId: null,
        idempotencyKey: `key-${Math.random()}`,
        confirm: true,
      },
      fixture.admin.id,
    );
    const { resolveMetaPublication } = await import("@/lib/meta/publishing");
    const resolved = await resolveMetaPublication({
      publicationId: result.publication.id,
      adminUserId: fixture.admin.id,
      action: "mark_failed",
    });
    expect(resolved.status).toBe("FAILED");
    const row = await prisma.metaPublication.findUnique({ where: { id: result.publication.id } });
    expect(row?.activeKey).toBeNull();
  });

});
