# Social Share Kit

The Social Share Kit extends the Editorial AI Assistant. It is available to SuperAdmins at `/{locale}/admin/blog/social-share`.

## What it does

- Select an existing blog article.
- Generate platform-specific captions for Facebook, Instagram, and WhatsApp.
- Edit and refine captions independently per platform.
- Generate branded square (1080x1080) and vertical (1080x1920) graphics.
- Copy captions and article links.
- Download generated graphics.
- Use native device sharing where supported.
- Track manual publishing status per platform.

## Usage

1. Open the Social Share Kit from the blog admin dashboard.
2. Search and select an article.
3. Generate captions for each platform tab.
4. Edit or refine captions as needed.
5. Generate square and/or vertical graphics.
6. Copy captions, copy the article link, download or share graphics.
7. Publish manually on each platform.
8. Mark the platform as published only after confirming publication.

## Environment

Reuses existing editorial AI and Cloudinary configuration:

- `EDITORIAL_AI_ENABLED=true`
- `OPENAI_EDITORIAL_TEXT_MODEL` (or `OPENAI_MODEL`)
- Cloudinary credentials

No new environment variables are required.

## Operational limitations

- Publishing is manual only. No automatic posting, OAuth, or scheduling is implemented.
- Graphic generation uploads SVG assets to Cloudinary and delivers PNG via format transformation.
- Native sharing depends on browser/device support; fallbacks are provided.
