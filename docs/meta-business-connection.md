# Meta Business Connection & Direct Publishing

This document describes **Release 3**: a secure, human-approved direct publishing
integration for Facebook Pages and Instagram professional accounts. It is an
**additive layer** on top of the existing Social Share Kit and does not replace
manual publishing, captions, graphics, logos, translation, SEO, outreach,
Academy, portfolio, scheduled blog publishing, authentication, or any existing
dependency.

## Scope and non-goals

Supported:
- Facebook Page **text/link** posts and **single-image** Page posts.
- Instagram professional account **single-image feed** posts (JPEG, supported
  aspect ratio).

Explicitly not supported (by design):
- Instagram Stories, Reels, video, carousels, or any multi-media post.
- Autonomous, scheduled, bulk, or automatically retried publishing.
- Instagram Login or Unified Login tokens (Facebook Login / Page-linked
  Instagram only).
- Any write to production credentials or activation of live publishing from
  this branch.

## Pinned Graph API version

All Meta requests use a single pinned version:

- Default: **`v27.0`** (introduced 4 November 2026).
- Override: `META_GRAPH_API_VERSION` (must match `^v\d+\.\d+$`).
- No unversioned calls exist. The version is part of every URL built by
  `src/lib/meta/graph.ts` and `src/lib/meta/oauth.ts`, including the OAuth
  dialog.

## Facebook Login model

This integration uses **Instagram API with Facebook Login** exclusively:

- A Meta user logs in through Facebook Login.
- The app requests Page access tokens via `me/accounts`.
- Each Page may expose a linked `instagram_business_account`.
- Instagram publishing reuses the **parent Page access token**; no separate
  Instagram token is stored.

Required OAuth scopes (all five are requested on every authorization):

1. `pages_show_list`
2. `pages_read_engagement`
3. `pages_manage_posts`
4. `instagram_basic`
5. `instagram_content_publish`

Page publishing eligibility requires the authorizing user to hold the
`CREATE_CONTENT`, `MANAGE`, and `MODERATE` tasks on the Page (Meta Pages API
requirement). Page Publishing Authorization (PPA) may still block an account;
such failures surface as `ATTENTION_REQUIRED` / `PERMISSION_MISSING` health.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `META_PUBLISHING_ENABLED` | **Environment kill switch.** Must be exactly `true`. Overrides the DB switch. |
| `META_APP_ID` | Meta app id. |
| `META_APP_SECRET` | Meta app secret. Never logged. |
| `META_GRAPH_API_VERSION` | Optional override, validated (`v27.0` default). |
| `META_OAUTH_REDIRECT_URI` | Exact redirect URI registered in the Meta app; must end in `/api/meta/oauth/callback`. |
| `META_TOKEN_ENCRYPTION_KEY` | 32 bytes (base64 or 64 hex chars). **Required** to store any token. |
| `META_TOKEN_ENCRYPTION_KEY_PREVIOUS` | Optional previous 32-byte key used during rotation. |
| `META_API_TIMEOUT_MS` | Graph request timeout (default 15000). |
| `META_OAUTH_STATE_TTL_MINUTES` | OAuth state lifetime (default 10). |
| `META_MEDIA_PROCESSING_TIMEOUT_MS` | Instagram container polling budget (default 30000). |
| `META_MEDIA_POLL_INTERVAL_MS` | Instagram container poll interval (default 2000). |

`NEXT_PUBLIC_SITE_URL`, `NEXTAUTH_URL`, and Cloudinary configuration are reused.

## Database schema (additive)

New models (see `prisma/schema.prisma`):

- `MetaConnection` — one active connection per administrator, encrypted
  long-lived user token, granted/declined scopes, status, health.
- `MetaConnectedAccount` — selected Facebook Page or Instagram account, with
  an encrypted **Page** access token, tasks, eligibility, health.
- `MetaOAuthState` — hashed, single-use, expiring OAuth state bound to an
  administrator.
- `MetaPublication` — direct-publication state/history, **separate** from
  `SocialPublishStatus`. Stores the caption snapshot, media URL/format,
  article, destination, idempotency key, active concurrency key, container id,
  external id/url, timestamps, and error summary.
- `MetaPublicationAttempt` — per-provider-call audit (request/response,
  outcome, HTTP status, error code, Meta request id).
- `MetaPublishingSettings` — the DB-level publishing switch (defaults off).

Migration: `prisma/migrations/20261120150000_meta_business_connection/migration.sql`.
It is additive only; unrelated pre-existing drift was deliberately excluded.

## OAuth flow and state security

1. `GET /api/meta/oauth/start?locale=...` (SuperAdmin only):
   - validates Meta configuration and encryption readiness;
   - creates a 32-byte random state, stores only its **SHA-256 hash**;
   - binds the state to the initiating administrator and locale;
   - sets a short expiry (`META_OAUTH_STATE_TTL_MINUTES`);
   - redirects to `https://www.facebook.com/v27.0/dialog/oauth` with
     `auth_type=rerequest`.
2. `GET /api/meta/oauth/callback`:
   - re-validates SuperAdmin session;
   - **atomically consumes** the state (conditional `updateMany` where
     `consumedAt IS NULL` and not expired) — the replay barrier;
   - rejects wrong administrator, expired, replayed, or unknown states;
   - exchanges the code for a short-lived token, then upgrades to a
     **long-lived** token (fails closed if the upgrade fails);
   - verifies the token through `debug_token` (app id, validity, scopes);
   - encrypts and stores only the long-lived user token;
   - discovers Pages later through an explicit, separate discovery step (no
     token is ever returned to the browser).

State properties: random, hashed, single-use, expiring, CSRF-safe (SameSite
session cookie + `assertSameOrigin`), bound to the initiating SuperAdmin.

## Token encryption

- Algorithm: **AES-256-GCM**, fresh 96-bit nonce per encryption.
- Stored format: `v1.<iv>.<auth-tag>.<ciphertext>` (base64url).
- Both the user token and every Page token are encrypted at rest.
- Decryption requires `META_TOKEN_ENCRYPTION_KEY` (32 bytes). If the key is
  missing or invalid, the integration **fails closed** — no token is stored or
  read.
- `META_TOKEN_ENCRYPTION_KEY_PREVIOUS` allows a documented rotation window.
- Tokens are never logged. Error text is sanitized for token-like substrings
  before logging or persistence.

## Publishing eligibility

- A Page is eligible only when the authorizing user holds `CREATE_CONTENT`,
  `MANAGE`, and `MODERATE`.
- Instagram accounts are eligible only when their parent Page is eligible and
  the required Instagram scopes were granted.
- Health is refreshed explicitly through `POST /api/meta/accounts/health`
  (never on page render). Revoked/expired tokens mark the connection and its
  accounts as requiring re-authorization.

## Direct publishing workflow

1. The article must be **publicly available** (`status = PUBLISHED`,
   `published = true`, `publishedAt <= now`). The server rejects otherwise.
2. A saved Social Share Kit variant for the platform must exist; its
   **saved** caption is used. Client-supplied caption text is never accepted.
3. An eligible destination for the platform must be connected.
4. The administrator chooses the destination and (optionally for Facebook) a
   graphic, then clicks **Review & publish**.
5. A confirmation panel requires an explicit **Yes, publish now**. Nothing is
   scheduled, bulk-published, or retried automatically.
6. The server re-validates everything, creates a `PENDING` publication with a
   unique idempotency key and a unique active concurrency key, then calls Meta.

Facebook:
- Text/link post: `POST /{page-id}/feed` with `message`, `link`, `published=true`.
- Image post: `POST /{page-id}/photos` with `url` (Cloudinary JPEG derivative),
  `caption`, `published=true`.

Instagram (single image only):
1. `POST /{ig-user-id}/media` with `image_url`, `caption` → container id
   (persisted immediately).
2. Poll `GET /{container-id}?fields=status_code` with a bounded timeout.
3. `POST /{ig-user-id}/media_publish` with `creation_id`.
4. Permalink fetched when available.

If the container is still `IN_PROGRESS` at the timeout, the publication stays
`PROCESSING` and is completed through reconciliation (no duplicate post).

## Media handling

- Existing graphics are Cloudinary SVG assets. Meta requires a publicly
  reachable image; the server builds a JPEG derivative dynamically:
  `f_jpg,q_90` inserted into the Cloudinary delivery URL.
- Only the **square 1080×1080** asset is accepted for Instagram. The vertical
  1080×1920 asset is rejected as an unsupported feed aspect ratio.
- The server verifies the derivative with a `HEAD` request and confirms the
  final host is the application's own Cloudinary cloud, the content type is
  `image/jpeg` (Instagram) or an image (Facebook), and the size is within
  limits.
- The browser never supplies a media URL; it is derived from a stored graphic
  record.

## Idempotency and concurrency

- Every publish request carries a client-generated idempotency key (validated
  format). The database enforces uniqueness.
- An `activeKey` (`variantId:connectedAccountId`) is unique and is held while a
  publication is `PENDING`, `PROCESSING`, or `UNKNOWN_RESULT`. Concurrent or
  duplicate submissions for the same content and destination are rejected with
  `in_progress` / `ambiguous`.
- Re-submitting the same idempotency key returns the existing record
  (`replayed: true`) without calling Meta again.
- Reusing a key for different content is rejected (`idempotency_conflict`).
- An exact duplicate of already-published content to the same destination is
  rejected (`already_published`).
- The slot is released only on a definitive terminal state (`PUBLISHED`,
  `FAILED`, `REQUIRES_REAUTHORIZATION`, `CANCELLED`). Ambiguous results keep
  the slot until reconciled or manually resolved.

## Ambiguous results and reconciliation

A network timeout, 5xx, or interrupted response after a mutating Meta call is
treated as **ambiguous** (`UNKNOWN_RESULT`), never blindly retried.

Reconciliation (`POST /api/meta/publications/{id}` with `action: "check"`):
- Facebook: matches a recent Page feed entry by exact caption and timestamp.
- Instagram: reads the container status; if `FINISHED`, completes publishing;
  if `PUBLISHED`, matches recent media by caption and timestamp; otherwise
  reports processing/error/expired.
- A pending record older than two minutes with no external evidence is marked
  `FAILED` (no post was found).

Manual resolution (SuperAdmin only):
- `confirm_published` — marks the publication `PUBLISHED` (optional external
  URL), releases the slot.
- `mark_failed` — marks it `FAILED`, releases the slot.

Every reconciliation and resolution is audit-logged.

## Kill switches

Two levels, both required:
1. `META_PUBLISHING_ENABLED` must be exactly `true` (environment). It always
   overrides the database.
2. The DB switch in `MetaPublishingSettings` (defaults off), toggled by a
   SuperAdmin through the UI or `POST /api/meta/settings`.

Effective publishing requires: configured app + encryption key + env switch +
DB switch. If any is off, `publishMetaPublication` throws `disabled` before
any Meta call.

## API surface (SuperAdmin only)

- `GET /api/meta/status` — configuration + connection + switch state.
- `GET /api/meta/oauth/start?locale=...` — begins OAuth (redirect).
- `GET /api/meta/oauth/callback` — completes OAuth (redirect).
- `GET /api/meta/accounts?connectionId=...` — live discovery (read-only).
- `POST /api/meta/accounts` — persist selected accounts.
- `POST /api/meta/accounts/health` — explicit health refresh.
- `DELETE /api/meta/accounts/{id}` — disconnect one account.
- `DELETE /api/meta/connection` — disconnect everything.
- `POST /api/meta/settings` — toggle the DB switch.
- `GET /api/meta/publications?postId=...` — history.
- `POST /api/meta/publications` — publish (requires `confirm: true`).
- `GET /api/meta/publications/{id}` — single publication.
- `POST /api/meta/publications/{id}` — `check`, `confirm_published`, or
  `mark_failed`.

All endpoints enforce `requireSuperAdmin()` and `assertSameOrigin`.

## UI

- `src/components/blog/meta-connection-manager.tsx` — configuration summary,
  connect/reconnect/disconnect, discovery and selection, health refresh,
  publishing switch.
- `src/components/blog/meta-publish-panel.tsx` — destination selector,
  caption/media disclosure, confirmation, processing/ambiguous/result states,
  history with reconciliation and manual resolution.
- Both are integrated into `src/components/blog/social-share-kit.tsx` without
  altering existing workflows. Direct publishing appears only on the Facebook
  and Instagram tabs.

## Tests

- `tests/meta-crypto.test.ts` — encryption round-trip, uniqueness, tamper
  rejection, rotation, constant-time comparison.
- `tests/meta-oauth-state.test.ts` — hashing, binding, expiry, replay,
  concurrency.
- `tests/meta-config.test.ts` — kill-switch exactness, version pinning,
  configuration summary.
- `tests/meta-permissions.test.ts` — SuperAdmin recognition.
- `tests/meta-publishing.test.ts` — PostgreSQL integration: public-article
  requirement, missing caption, long caption, unsupported media, untrusted
  host, Facebook/Instagram success, idempotency replay/conflict, concurrency,
  ambiguous result + slot lock, reconciliation, manual resolution, kill
  switches, token non-exposure.

Run with `pnpm test`. CI provides PostgreSQL 16.

## Operational notes

- Never commit real Meta credentials or encryption keys.
- Rotate `META_TOKEN_ENCRYPTION_KEY` by setting `META_TOKEN_ENCRYPTION_KEY_PREVIOUS`
  to the old key, deploying the new key, then removing the previous key once
  all tokens have been re-encrypted.
- Disconnecting a connection deletes the stored user token and all Page tokens.
- Revoked tokens require a full reconnect (re-run OAuth).
- Publication history is shared across SuperAdmins and preserved across
  reconnects.

## Production activation checklist (not performed on this branch)

- [ ] App review for the five scopes (if serving non-admin users).
- [ ] Register the exact `META_OAUTH_REDIRECT_URI` in the Meta app.
- [ ] Set all environment variables in the deployment environment.
- [ ] Run `prisma migrate deploy`.
- [ ] Keep `META_PUBLISHING_ENABLED=false` until a deliberate activation.
- [ ] Verify with a test Page/account in a non-production environment.
- [ ] Document the activation decision and the responsible SuperAdmin.

This branch (`feature/meta-business-connection`) is not merged or deployed.
EOF
echo done