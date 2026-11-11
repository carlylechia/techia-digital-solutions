# teChia Digital Academy e-commerce & payments

This document describes the additive Academy catalog/checkout implementation shipped on `feature/academy-ecommerce-payments-ai`.

## Catalog data model (Prisma)

Additive models/enums: `AcademyCategory`, `AcademyCourse`, `AcademyLesson`, `AcademyCoursePack`, `AcademyCoursePackItem`, `AcademyOrder`, `AcademyOrderItem`, `AcademyPayment`, `AcademyWebhookEvent`, `AcademyOrderBonusGrant` and related enums. Migration: `prisma/migrations/20261110120000_add_academy_catalog_and_payments/migration.sql`.

- Courses and packs are DB-backed and published-only on the storefront when the DB is connected.
- Prices are **admin-configurable** and stored as integer minor units (`priceMinor`, `currency`, default XAF). **Default pricing when an admin has not set a price** (`src/lib/courses/pricing.ts`): a single course sells at **2,000 FCFA** and a course pack at **5,000 FCFA** — applied only to XAF items; unpriced items in USD/CAD/EUR stay unpriced (no conversion is invented). The storefront, checkout resolution (`resolveCheckoutItem`), and the AI advisor all use the same effective price, and `/admin/academy` lists the effective price with a "· default" marker.
- Seed: `prisma/seed.ts` is idempotent and creates 16 courses, 48 lessons, 6 packs, 32 pack items from supplied catalog definitions. Existing Chariow product IDs are parsed where already present.

## Storefront & admin

- `/courses`: searchable/filterable/sortable storefront (server-side query params `q`, `category`, `sort`) with individual courses and preserved pack/bonus/FAQ content.
- `/courses/[slug]`: resolves existing pack slugs first (preserved URLs), then published individual course slugs.
- `/courses/checkout?item=<type>:<slug>` and `/courses/checkout/return`: internal hosted checkout flow (server-side return verification; redirect query params are never treated as payment proof).
- `/admin/academy`: catalog/pricing/Chariow mapping management and recent orders view (requires `academy.catalog.manage` and/or `academy.orders.view`).

### Admin console (academy)

- **Navigation**: the admin workspace sidebar has an **Academy** section with **Academy Catalog** (`/admin/academy`, gated by `academy.catalog.manage`/`academy.orders.view`) and **Bonus Claims** (`/admin/bonus-claims`, gated by `requests.manage`).
- **Creating courses**: administrators with `academy.catalog.manage` can create courses directly from `/admin/academy` (status, category, FR copy, skills, level, position, SEO, pricing, Chariow mapping). Only `PUBLISHED` courses appear on the storefront; saving revalidates `/courses`, `/courses/[slug]`, and the sitemap.
- **Currency**: a closed dropdown limited to `XAF`, `USD`, `CAD`, `EUR` (validated server-side in the admin actions).
- **Cover images**: `AcademyImageField` accepts a device upload or a direct https URL. Uploads go through `POST /api/courses/admin-media` — same-origin, permission re-read from the database (`academy.catalog.manage`), rate limited (12/min/admin), magic-byte image sniffing (JPEG/PNG/WebP/AVIF, ≤10 MB), signed Cloudinary upload into the `techia/academy` folder. The stored value is always the final image URL.
- **Course structure fields**: `AcademyCourse.moduleCount`, `lessonCount`, `pathCount` (additive, nullable — migration `20261111120000_add_academy_course_structure_counts`). Administrators enter modules, lessons (teaching units inside a course), and learning paths per course; unset values are never shown or invented. The admin row also shows the automatic lesson count from the database as a hint. On the public course detail page (`/courses/[slug]`), recorded values render as structure chips (modules · lessons · paths) above the skills/outline section — chips only appear for values an administrator entered.

## Payment integrations (official docs)

Provider abstraction: `src/lib/payments/providers.ts`, `checkout.ts`, `fulfillment.ts`, `chariow.ts`, `moneroo.ts`, `signatures.ts`.

- **Chariow**: `POST https://api.chariow.com/v1/checkout` (Bearer `CHARIOW_API_KEY`) with `product_id`, customer fields, `redirect_url`, `payment_currency`, `customer_ip`, `custom_metadata`; hosted `payment.checkout_url`. Sale verification: `GET /v1/sales/{saleId}`. Webhook ("Pulse") signature header `x-chariow-signature: sha256=<hex>` (HMAC-SHA256 of the raw body with the Pulse signing secret `whsec_…` = `CHARIOW_WEBHOOK_SECRET`; the legacy `x-pulse-signature` header name is still accepted), dedupe via `x-pulse-delivery-id`. Fulfillment requires verified `sale.status` `completed|settled` and `payment.status` `success`, plus currency and amount match (`amount.value` major units converted to minor units).
- **Moneroo**: `POST https://api.moneroo.io/v1/payments/initialize` (`MONEROO_SECRET_KEY`) returning `data.checkout_url`/`data.id`; verify `GET /v1/payments/{paymentId}/verify`. Webhook `X-Moneroo-Signature` bare lowercase hex HMAC-SHA256 (`MONEROO_WEBHOOK_SECRET`), events `payment.success|failed|cancelled`. Amounts are integer smallest currency unit (XAF zero-decimal). Fulfillment requires verified `success`, currency match, and amount `>=` order total (per docs "at least expected amount").

### Payment status distinctions

- `PENDING`/`PROCESSING`: checkout initiated or awaiting final verification.
- `PAID`/`SUCCEEDED`: provider-verified successful payment with amount/currency checks passed; order paid and eligible buyer bonuses granted idempotently.
- `FAILED`/`CANCELLED`: provider-verified unsuccessful/cancelled state; no access/bonus fulfillment.
- `REQUIRES_REVIEW`: verified payment signal but amount/currency mismatch or other condition needing manual review; no automatic fulfillment.
- Redirect return page status is derived from server-side verification; **never trust client redirect status**.

## Environment variables

See `.env.example` for:
- `ACADEMY_INTERNAL_CHECKOUT_ENABLED`
- `CHARIOW_API_KEY`, `CHARIOW_WEBHOOK_SECRET`
- `MONEROO_SECRET_KEY`, `MONEROO_WEBHOOK_SECRET`
- Existing public course/support/bonus variables and `COURSE_BONUS_DELIVERY_SECRET`

## Webhook setup (external)

Configure HTTPS webhook endpoints in provider dashboards:
- Chariow (webhooks are called **Pulses**): Dashboard → **Automation → Pulses → Add Pulse**, endpoint `https://<domain>/api/courses/webhooks/chariow`, events `successful.sale` + `failed.sale` (HTTPS required). The per-Pulse signing secret lives at Pulse → **Overview tab → Signing secret** (Reveal/Copy; starts with `whsec_`) — it is not the API key. Use the Pulse **Deliveries** tab to inspect/replay deliveries, and "Send test pulse" to smoke-test the endpoint.
- Moneroo: `https://<domain>/api/courses/webhooks/moneroo`

Use the exact webhook secrets configured in env. Live end-to-end payment success **cannot be claimed without configured live credentials and dashboard webhook setup**.

## AI course advisor

`src/app/api/ai/techia-agent/route.ts` injects live published catalog context (`src/lib/ai/academy-catalog-context.ts`) so recommendations use DB-published courses/packs only, avoid unpublished items and invented details/prices, and include trading/crypto educational disclaimers.

## Migrations

```bash
npx prisma validate
npx prisma generate
npx prisma migrate deploy   # production
npx prisma migrate dev      # local dev, if needed
pnpm seed                   # idempotent catalog seed
```

Applied locally in this implementation: `20261110120000_add_academy_catalog_and_payments`.
