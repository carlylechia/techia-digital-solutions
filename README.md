# teChia Digital Solutions

A premium bilingual digital transformation website and lead-generation web application for **teChia Digital Solutions**.

Built from the supplied product/brand specification: digital homes for modern businesses, premium websites, business management systems, dashboards, automation tools, AI-powered tools, and complete digital operating systems.

## 1. Project overview

This project is a Vercel-ready Next.js application designed to position teChia as a serious technology and digital transformation studio for:

- Local businesses in Cameroon and Africa
- International SMEs, especially European businesses
- Google Ads traffic looking for premium websites and business systems

Core positioning:

> Digital Homes for Modern Businesses.

## 2. Brand overview

**Company:** teChia Digital Solutions  
**Short name:** teChia  
**Meaning:** A combination of “tech” and “Chia.”  
**Promise:** Simple problems. Smart tech solutions.

The website presents teChia as more than a website agency. It frames the company as a studio that builds the digital layer a business needs: website, dashboard, CRM-like workflows, portals, quote systems, booking systems, analytics, automations, and AI tools.

## 3. Features

- Bilingual localized routing: `/en` and `/fr`
- First-visit language selection modal
- Browser language and cookie/localStorage language preference support
- Premium dark and light themes using CSS variables
- Responsive mobile-first navbar and drawer menu
- World-class hero section with animated digital business ecosystem visual
- Business Digitalization Simulator
- Demo Lab with interactive mini-demo previews
- Service pages
- Industry SEO landing pages
- European Google Ads landing pages
- Portfolio/case study pages
- Founder profile page
- Bilingual blog content system
- Pricing page
- Contact form
- Start Project inquiry flow
- Newsletter form
- Zod validation
- Honeypot spam protection
- In-memory route-level rate limiting
- Optional Prisma/PostgreSQL persistence
- Optional Resend email notifications
- GA4 component and conversion event architecture
- Dynamic sitemap and robots
- JSON-LD structured data
- Security headers in `next.config.ts`
- Error and not-found pages
- Protected admin dashboard for leads, project inquiries, contact messages, demo requests, newsletter subscribers, statuses, and internal notes
- Basic Vitest validation tests

## 4. Tech stack and exact versions

Main versions used in `package.json`:

- Next.js `16.2.6`
- React `19.2.6`
- TypeScript `5.9.3`
- Tailwind CSS `4.3.0`
- Prisma `7.8.0`
- `@prisma/client` `7.8.0`
- NextAuth `4.24.14`
- Zod `4.4.3`
- Framer Motion `12.39.0`
- Lucide React `1.16.0`
- Resend `6.12.3`
- Recharts `2.15.4`
- Vitest `3.2.4`

Package manager: `pnpm`.

## 5. Folder structure

```txt
src/
  app/
    [locale]/
      page.tsx
      about/
      founder/
      services/
      solutions/
      industries/
      portfolio/
      demo-lab/
      pricing/
      blog/
      contact/
      start-project/
      privacy/
      terms/
      cookies/
      admin/
    api/
      auth/
      contact/
      project-inquiry/
      newsletter/
      demo-request/
    globals.css
    layout.tsx
    sitemap.ts
    robots.ts
  components/
    analytics/
    demos/
    forms/
    i18n/
    layout/
    sections/
    theme/
    ui/
  content/
    founder.ts
    site.ts
  lib/
    email.ts
    prisma.ts
    rate-limit.ts
    sanitize.ts
    seo.ts
    utils.ts
    validation.ts
prisma/
  schema.prisma
  seed.ts
public/
  brand/
  og/
tests/
```

## 6. Setup instructions

```bash
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm dev
```

Open:

```txt
http://localhost:3000
```

The root route redirects to `/en` or `/fr` depending on cookie or browser language.

## 7. Environment variables

See `.env.example`:

```bash
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GA_ID=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
CONTACT_TO_EMAIL=
ADMIN_EMAIL=
ADMIN_PASSWORD_SEED=
```

The app does not break if `DATABASE_URL`, `NEXT_PUBLIC_GA_ID`, or Resend variables are missing. Database persistence and email sending are skipped when their environment variables are not configured.

## 7.1 Founder page profile links

Founder page content and CTA link configuration live in [src/content/founder.ts](/Users/macbookpro/Documents/BusinessProjects/techia-digital-solutions/src/content/founder.ts:1).

- `founderLinks.linkedin`: Chia Carlyle's personal LinkedIn profile URL
- `founderLinks.resumeDownload`: direct Google Docs PDF export URL for the downloadable founder profile
- `GITHUB_URL`: replace with Chia Carlyle's personal GitHub profile URL when available

## 8. Database setup

Use PostgreSQL locally or a managed provider such as Neon, Supabase, Railway, Prisma Postgres, or Vercel-managed Postgres.

Local PostgreSQL example:

```bash
createdb techia_digital_solutions
```

Set:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/techia_digital_solutions?schema=public"
```

Then run:

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm seed
```

For a quick prototype without migrations:

```bash
pnpm prisma:push
pnpm seed
```

## 9. Prisma commands

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:push
pnpm prisma:studio
pnpm seed
```

Models included:

- Lead
- ProjectInquiry
- ContactMessage
- NewsletterSubscriber
- CaseStudy
- BlogPost
- Service
- Testimonial
- DemoRequest
- AdminUser

Lead statuses included:

- NEW
- CONTACTED
- DISCOVERY_BOOKED
- PROPOSAL_SENT
- NEGOTIATING
- WON
- LOST
- FOLLOW_UP_LATER

## 10. Google Analytics setup

1. Go to Google Analytics.
2. Create a GA4 property.
3. Create a Web data stream.
4. Copy the Measurement ID, for example `G-XXXXXXXXXX`.
5. Add it to `.env` and to Vercel:

```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

Tracked architecture/events:

- Page views on route changes
- `start_project_click`
- `contact_form_submit`
- `project_estimator_submit`
- `demo_request_submit`
- `pricing_cta_click`
- `language_selected`
- `theme_changed`
- `portfolio_case_study_view`

The implemented public flows emit the listed events from the relevant client interactions.

## 11. Resend setup

1. Create a Resend account.
2. Verify your sending domain.
3. Create an API key.
4. Add these variables:

```bash
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL="teChia <hello@yourdomain.com>"
CONTACT_TO_EMAIL=you@example.com
```

The API routes call Resend only when these variables are present.

## 12. Local development

```bash
pnpm dev
```

Useful routes:

- `/en`
- `/fr`
- `/en/services`
- `/en/industries`
- `/en/demo-lab`
- `/en/start-project`
- `/en/admin`
- `/en/europe-business-websites`

## 13. Build command

```bash
pnpm build
```

Recommended checks before deployment:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 14. Deployment to Vercel

1. Push this folder to GitHub.
2. Import the repository into Vercel.
3. Set environment variables from `.env.example`.
4. Add a production database URL if form persistence is needed.
5. Add `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`.
6. Add `NEXT_PUBLIC_GA_ID` if analytics is ready.
7. Deploy.
8. After deployment, update DNS at your domain provider.
9. Re-run Prisma migration/push against production DB if needed.

## 15. How to add logo assets

The code references these paths:

```txt
public/brand/logo-mark.svg
public/brand/logo-full.svg
public/brand/favicon.svg
public/brand/apple-touch-icon.svg
```

The repository includes SVG brand assets at these paths. Replace the files only when a newer approved teChia brand pack is supplied, keeping the same code paths.

## 16. How to edit content

Most public website content lives in:

```txt
src/content/site.ts
```

Edit:

- Navigation labels
- English and French copy
- Services
- Industries
- Case studies
- Blog starters
- Pricing packages
- Testimonials
- FAQ
- Simulator options

## 17. How to add translations

Add or update the `en` and `fr` dictionary objects in:

```txt
src/content/site.ts
```

Keep slugs stable across languages to preserve SEO and internal links.

## 18. How to change theme colors

Edit CSS variables in:

```txt
src/app/globals.css
```

Variables include:

- `--background`
- `--surface`
- `--border`
- `--primary`
- `--muted`
- `--accent`
- `--violet`
- `--mint`
- `--shadow`
- `--glow`

## 19. SEO notes

Implemented:

- App Router metadata
- Open Graph metadata
- Twitter card metadata
- Canonical URLs
- Localized alternates/hreflang structure
- Dynamic sitemap
- Robots file
- JSON-LD Organization/ProfessionalService
- BreadcrumbList on key pages
- Semantic headings
- Internal linking
- SEO-friendly dynamic routes

Enhancement options:

- Refresh Open Graph artwork when the brand campaign changes
- Add richer article schema for real blog posts
- Add FAQPage schema per page where final FAQs are confirmed
- Add real case study screenshots

## 20. Security notes

Implemented:

- Zod validation on form routes
- Honeypot field
- In-memory rate limiting
- Server-side sanitization
- Security headers
- No hardcoded secrets
- Safe production error responses
- Optional DB/email behavior based on environment variables

Enhancement options:

- Replace in-memory rate limiting with Redis/Upstash for distributed production enforcement
- Add audit logs for admin actions
- Add stronger bot/spam protection if traffic increases

## 21. Performance notes

Implemented:

- Mostly server-rendered marketing pages
- Client components only where interactivity is needed
- CSS/SVG/Framer Motion visual instead of heavy Three.js
- Reduced motion support
- Responsive layout
- No intentional horizontal overflow
- Tailwind CSS v4
- Lazy route-level loading through App Router defaults

Enhancement options:

- Run Lighthouse after deployment
- Add real image optimization once final visuals are selected
- Add route-level analytics review after ad campaigns begin

## 22. Maintenance checklist

Weekly:

- Check form submissions
- Check analytics events
- Review broken links
- Publish or update one article
- Review search terms from Google Search Console

Monthly:

- Run dependency updates safely
- Check Core Web Vitals
- Review security advisories
- Refresh case studies
- Improve landing pages based on conversion data

## 23. Roadmap

- Case study CMS
- Blog CMS
- Testimonial CRUD
- Better Auth or full Auth.js v5 migration when selected
- Redis-backed rate limiting
- Proposal generator
- Client portal
- AI estimator for project scope
- WhatsApp click-to-send inquiry flows
- CRM integration

## 24. teChia AI Growth Agent

A production-ready AI-powered business growth assistant embedded across the teChia public website.

### What the AI agent does

- **AI consultant** — Helps visitors understand teChia's services and choose the right solution.
- **Service recommender** — Recommends the best service based on business type, goals, and budget.
- **Lead qualification assistant** — Scores leads as HOT, WARM, or COLD based on conversation signals.
- **Demo request assistant** — Collects demo preferences and saves them to the database.
- **Project brief generator** — Summarises the visitor's project for internal follow-up.
- **Admin monitoring** — Admin pages for leads, conversations, and usage at `/admin/ai-leads`, `/admin/ai-conversations`, `/admin/ai-usage`.

### UI entry points

| Path | Description |
|---|---|
| `/ai-consultant` | Full-page AI consultant landing page |
| Floating widget | Appears on all marketing pages (bottom-right) |

### Required environment variables

```env
OPENAI_API_KEY=                         # Server-side only — never expose via NEXT_PUBLIC
```

### Optional AI agent environment variables

```env
AI_AGENT_ENABLED=true                   # Kill switch — set to false to disable the agent
AI_PUBLIC_MODEL=gpt-4o-mini             # Model used for public agent (server-controlled)
AI_PUBLIC_MAX_MESSAGES_PER_DAY=10       # Max messages per session per day
AI_PUBLIC_MAX_MESSAGES_PER_IP_PER_DAY=40  # Max messages per IP per day
AI_PUBLIC_MAX_MESSAGES_PER_CONVERSATION=12 # Max messages per conversation
AI_PUBLIC_MAX_USER_MESSAGE_CHARS=1500   # Max input characters per message
AI_PUBLIC_MAX_OUTPUT_TOKENS=500         # Max output tokens per response
AI_DAILY_TOKEN_BUDGET=100000            # Total daily public token budget
AI_IP_HASH_SALT=                        # Salt for SHA-256 IP hashing (recommended)
ALERT_WEBHOOK_URL=                      # Discord-compatible webhook for HOT lead alerts
RESEND_API_KEY=                         # Resend API key for email notifications
ADMIN_NOTIFICATION_EMAIL=               # Email address for admin notifications
NEXT_PUBLIC_SITE_URL=                   # Full public URL e.g. https://techia.com
```

### How to run locally

1. Add `OPENAI_API_KEY` to `.env.local`.
2. Run `pnpm prisma migrate dev` to create the AI database tables.
3. Run `pnpm dev` and open the site — the floating AI widget appears on all marketing pages.
4. Visit `/ai-consultant` for the full-page experience.

### How to configure usage limits

All limits are read from environment variables at runtime. Update them in `.env.local` or your hosting environment without code changes. Defaults are defined in `src/lib/ai/config.ts`.

### How to disable the AI agent

Set `AI_AGENT_ENABLED=false` in your environment. The widget will display a friendly offline message.

### How to monitor usage

Admins can visit:

- `/admin/ai-leads` — All AI-qualified leads with score badges and status updates.
- `/admin/ai-conversations` — Conversation list with token counts and message counts.
- `/admin/ai-usage` — Daily usage stats, token totals, cost estimates, and abuse events.

### How to test the chat widget

Open any public marketing page and click the floating button at the bottom-right. Use quick action buttons to start a conversation. The widget is fully functional locally when `OPENAI_API_KEY` is set.

### How to deploy on Vercel

1. Add all required and optional env vars to your Vercel project settings.
2. Ensure `DATABASE_URL` points to a production PostgreSQL database.
3. Run `prisma migrate deploy` on first deploy or via a Vercel post-build hook.
4. Deploy — no additional configuration needed.

### How admin notifications work

When a HOT lead is created or a demo request is submitted:

1. If `ALERT_WEBHOOK_URL` is set, a Discord-compatible webhook notification is sent.
2. If `RESEND_API_KEY` and `ADMIN_NOTIFICATION_EMAIL` are set, an email is sent via Resend.
3. If neither is configured, a server-side log entry is written.

Notification failures never interrupt the user experience.

### How anti-abuse protection works

The public agent enforces these limits before every OpenAI call:

- Message character limit (default 1,500)
- Session daily message limit (default 10)
- IP daily message limit (default 40)
- Conversation message limit (default 12)
- Daily public token budget (default 100,000)

IP addresses are never stored raw — they are SHA-256 hashed with `AI_IP_HASH_SALT` before persistence. All blocked requests are recorded in the `AIAbuseEvent` table with a reason code for monitoring.

### Security notes

- `OPENAI_API_KEY` is server-side only and never exposed to the browser.
- Public users cannot select the AI model or override token limits.
- All user inputs are validated with Zod before processing.
- Raw stack traces are never returned in API responses.

---

## Production notes

This build includes the public marketing website, SEO, bilingual structure, request forms, analytics architecture, Prisma schema, Demo Lab request workflow, a protected admin command center, and the teChia AI Growth Agent. For production, configure `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_SEED`, `OPENAI_API_KEY`, and the Resend/notification variables before launch.

---

## 24. teChia AI Growth Agent

A production-ready AI-powered business growth assistant embedded across the teChia public website.

### What the AI agent does

- **AI consultant** — Helps visitors understand teChia's services and choose the right solution.
- **Service recommender** — Recommends the best service based on business type, goals, and budget.
- **Lead qualification assistant** — Scores leads as HOT, WARM, or COLD based on conversation signals.
- **Demo request assistant** — Collects demo preferences and saves them to the database.
- **Project brief generator** — Summarises the visitor's project for internal follow-up.
- **Admin monitoring** — Admin pages at `/admin/ai-leads`, `/admin/ai-conversations`, `/admin/ai-usage`.

### UI entry points

| Path | Description |
|---|---|
| `/ai-consultant` | Full-page AI consultant landing page |
| Floating widget | Appears on all marketing pages (bottom-right) |

### Required environment variables

```env
OPENAI_API_KEY=                         # Server-side only — never expose via NEXT_PUBLIC
```

### Optional AI agent environment variables

```env
AI_AGENT_ENABLED=true
AI_PUBLIC_MODEL=gpt-4o-mini
AI_PUBLIC_MAX_MESSAGES_PER_DAY=10
AI_PUBLIC_MAX_MESSAGES_PER_IP_PER_DAY=40
AI_PUBLIC_MAX_MESSAGES_PER_CONVERSATION=12
AI_PUBLIC_MAX_USER_MESSAGE_CHARS=1500
AI_PUBLIC_MAX_OUTPUT_TOKENS=500
AI_DAILY_TOKEN_BUDGET=100000
AI_IP_HASH_SALT=
ALERT_WEBHOOK_URL=
RESEND_API_KEY=
ADMIN_NOTIFICATION_EMAIL=
NEXT_PUBLIC_SITE_URL=
```

### How to run locally

1. Add `OPENAI_API_KEY` to `.env.local`.
2. Run `pnpm prisma migrate dev` to create the AI database tables.
3. Run `pnpm dev` — the floating AI widget appears on all marketing pages.
4. Visit `/ai-consultant` for the full-page experience.

### How to configure usage limits

All limits are read from environment variables at runtime. Update them in `.env.local` or your hosting environment without code changes. Defaults are defined in `src/lib/ai/config.ts`.

### How to disable the AI agent

Set `AI_AGENT_ENABLED=false` in your environment. The widget will display a friendly offline message.

### How to monitor usage

- `/admin/ai-leads` — AI-qualified leads with score badges and status management.
- `/admin/ai-conversations` — Conversation list with token counts and message counts.
- `/admin/ai-usage` — Daily usage stats, token totals, cost estimates, and abuse events.

### How to test the chat widget

Open any public marketing page and click the floating button at the bottom-right. Use the quick action buttons to start a conversation. Requires `OPENAI_API_KEY` to be set.

### How to deploy on Vercel

1. Add all env vars to your Vercel project settings.
2. Ensure `DATABASE_URL` points to a production PostgreSQL database.
3. Run `prisma migrate deploy` on first deploy.
4. Deploy — no additional configuration needed.

### How admin notifications work

When a HOT lead is created or a demo request is submitted:

1. If `ALERT_WEBHOOK_URL` is set, a Discord-compatible webhook notification is sent.
2. If `RESEND_API_KEY` and `ADMIN_NOTIFICATION_EMAIL` are set, an email is sent via Resend.
3. If neither is configured, a server-side log entry is written.

Notification failures never interrupt the user experience.

### How anti-abuse protection works

The public agent enforces these limits before every OpenAI call:

- Message character limit (default 1,500 chars)
- Session daily message limit (default 10)
- IP daily message limit (default 40)
- Conversation message limit (default 12)
- Daily public token budget (default 100,000)

IP addresses are SHA-256 hashed with `AI_IP_HASH_SALT` before storage — raw IPs are never persisted. All blocked requests are recorded in the `AIAbuseEvent` table with a reason code.

### Security notes

- `OPENAI_API_KEY` is server-side only — never exposed to the browser.
- Public users cannot select the AI model or override token limits.
- All user inputs are validated with Zod before processing.
- Raw stack traces are never returned in API responses.
