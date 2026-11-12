# teChia Digital Academy — free course preview videos

This document explains how the free introductory video system works and how to
manage it from the existing academy admin dashboard.

No API key, paid video host, or environment variable is required. Videos stay on
the official teChia YouTube channel; the website stores only a validated video ID
and optional presentation metadata.

## 1. How the system works

- Each `AcademyCourse` can have one optional introductory preview.
- The administrator pastes a normal YouTube link into the existing course editor
  (`/admin/academy` → Courses → expand a course → **Free introductory video**).
- The server extracts and validates the 11-character YouTube ID. The raw URL is
  not stored and iframe HTML is never accepted.
- The public course page renders a lightweight poster with a play button. There
  is **no YouTube iframe, player script, thumbnail gallery, or video request**
  until the visitor presses Play.
- On Play, the component creates a single iframe using the privacy-enhanced
  `https://www.youtube-nocookie.com` embed domain. YouTube's native adaptive
  streaming and controls handle playback from there.
- Previews are disabled by default. A course without a preview looks and behaves
  exactly as before.

The system supports all 16 academy courses independently. No video IDs are
shipped in the repository — every preview must be configured manually.

## 2. Why YouTube Unlisted

- The videos are already hosted on YouTube, so the site does not pay for video
  bandwidth or store large MP4 files on Vercel.
- YouTube handles encoding, adaptive bitrate, mobile playback, captions, and
  player compatibility.
- Unlisted videos do not appear in YouTube search or on the channel page, but
  **anyone with the link can view them**. They are not private, password
  protected, or DRM protected.
- These previews are free introductory samples. Do **not** upload full paid
  course content as an Unlisted preview.

## 3. Upload an introductory video

1. Sign in to the official teChia YouTube channel.
2. Click **Create** → **Upload video**.
3. Select the 4–5 minute introduction for the course.
4. Add a clear title such as
   `Free introduction — Complete Training in Digital Marketing`.
5. In **Visibility**, choose **Unlisted**.
6. In **Audience**, mark the video as **not made for kids** unless it genuinely
   is.
7. Open **Show more** → **Advanced settings** and make sure **Allow embedding**
   is enabled. Some channels or individual videos disable embedding; the site
   cannot override that.
8. Publish/save the video.
9. Copy the normal video link:
   `https://www.youtube.com/watch?v=VIDEO_ID`

You can also use a `youtu.be`, `/embed/`, or `/shorts/` link. Extra query
parameters (for example `?si=...` or `&t=30s`) are allowed and ignored.

## 4. Configure a course preview

1. Sign in to the teChia admin workspace with a role that has
   **academy.catalog.manage**.
2. Open **Admin → Academy catalog**.
3. Find the course under **Courses** and expand it.
4. Scroll to **Free introductory video**.
5. Paste the YouTube link into **Preview video URL**.
6. Check the green confirmation:
   `Valid YouTube link · ID …`, and confirm the thumbnail matches the intended
   video.
7. Optionally enter:
   - **Preview title** — shown beside the player, e.g.
     `Watch the free introduction to this course`.
   - **Duration label** — only enter the real duration, e.g. `4:35` or
     `4–5 minutes`. Leave it blank if you have not checked it.
   - **Preview poster** — optional custom image using the existing Cloudinary
     upload field. If omitted, the site uses the 320×180 YouTube thumbnail.
8. Check **Enable free preview**.
9. Click **Save preview**.

The save button updates only the preview fields. It does not change the course
status, price, published timestamp, Chariow product mapping, pack relationships,
SEO fields, or checkout configuration.

### Disable, replace, or remove

- **Disable:** uncheck **Enable free preview**, then **Save preview**. The
  configuration stays stored for later.
- **Replace:** paste a different YouTube link, confirm the new thumbnail, then
  **Save preview**.
- **Remove:** click **Remove preview**. This clears the ID, title, duration,
  poster, and enabled flag. The course itself is not deleted.

### Status at a glance

The course list shows one of:

- **No preview** — no video configured yet.
- **Preview off** — a valid configuration exists but is disabled.
- **Preview live** — the video is enabled and appears on the public course page.

The top overview also shows how many courses currently have a live preview.

Saving a preview revalidates the public course path and the admin catalog, so
changes appear on the next request rather than waiting for a deploy.

## 5. What customers see

On a course page with an enabled preview:

- **Free course preview** label and optional verified duration.
- A reserved 16:9 poster and a large accessible play button.
- A **Watch free preview** action in the hero on mobile, which jumps directly to
  the player.
- **Watch before you buy.** messaging.
- A purchase CTA directly beside/below the player, routed through the existing
  checkout logic.
- An **Explore the Complete Collection** link when the course belongs to the
  full pack.
- An **Open on YouTube** link that opens the same validated video externally.

The player is intentionally not rendered on the Academy catalog page or on
course pages without an enabled preview.

## 6. Low-bandwidth behaviour

Before the visitor presses Play:

- No iframe exists in the DOM.
- No YouTube player JavaScript or IFrame API is loaded.
- No video bytes are requested.
- Only one small 320×180 thumbnail (or the admin poster) is requested.
- The 16:9 box is reserved before the image loads, so there is no layout shift.
- No global YouTube preconnect/DNS-prefetch hints are added to the root layout.

After Play:

- One preconnect hint for `youtube-nocookie.com` is added.
- One iframe is created with `rel=0` and `playsinline=1`.
- Playback uses YouTube's native adaptive bitrate. The site does not force a
  quality level and does not claim to control YouTube's delivery decisions.
- The loading overlay is removed as soon as the iframe loads, leaving YouTube's
  native controls uncovered.
- If the iframe does not load within 25 seconds, a friendly error with
  **Try again** and **Open on YouTube** appears. Retry is user-initiated only.

## 7. Known YouTube limitations

- Unlisted is link-visible, not private or DRM protected.
- A channel/video can disable embedding; the embed will then show YouTube's
  error page. The site always provides an **Open on YouTube** link, but a
  cross-origin iframe cannot reliably report every internal YouTube error.
- `rel=0` reduces related videos but does not guarantee that YouTube hides every
  recommendation or branding element.
- The site cannot force a specific resolution. YouTube chooses quality from the
  visitor's network and device.
- The site cannot measure playback completion from a plain iframe. No completion
  event is sent.
- Age-restricted, private, removed, or region-blocked videos may not play.

## 8. Analytics

The existing GA4 analytics helper is reused; no duplicate analytics stack was
added. Events are:

| Event | When |
| --- | --- |
| `preview_video_impression` | The player becomes at least 35% visible (one-shot `IntersectionObserver`). |
| `preview_video_play` | The visitor first presses the poster play button. |
| `preview_video_error` | The iframe load times out or the browser reports an iframe error. |
| `preview_video_external_open` | The visitor chooses **Open on YouTube**, with a `reason` such as `inline_link` or `error_fallback`. |

Parameters are limited to `course_id`, `course_slug`, `video_id`, `provider`,
`source_page`, and an error `reason` where relevant. No names, emails, or other
personal information are sent.

Purchase intent uses the existing checkout tracking. The preview-side CTA sends
`source_page: "course_detail_preview"`; the collection link sends
`source_page: "course_detail_preview_collection"`. A separate
`purchase_intent_after_preview` event was intentionally not invented because the
relationship cannot be measured reliably without loading the YouTube IFrame API.

## 9. Troubleshooting

**"Valid YouTube link" does not appear**

- Use a full watch, youtu.be, embed, or shorts link.
- Confirm the ID is 11 characters and the domain is YouTube.
- Paste the URL, not iframe/embed HTML.

**"The preview link must start with https://"**

Use the normal share link from YouTube. Do not use an `http://` link.

**Customers see "We're having trouble loading this preview"**

- Check that the video is still Unlisted and available.
- Confirm **Allow embedding** is enabled in YouTube Studio.
- Try the **Open on YouTube** link from the same network/device.
- On a very slow connection, wait and press **Try again**. The iframe cannot
  report every loading failure, so the site uses a 25-second timeout.

**The thumbnail does not show in admin**

The video ID may be valid but the thumbnail may not be generated yet, or the
network may block `i.ytimg.com`. The public player falls back to a branded
gradient and remains usable.

**The preview does not update on the public page**

Refresh once; the server revalidates the public course path when you save. If
you removed the preview, confirm the course summary now says **No preview**.

**Embedding works on YouTube but not in the site**

Check the production CSP allows `frame-src` for
`https://www.youtube-nocookie.com` (configured in `next.config.ts`). Do not add
global YouTube scripts to the root layout.

## 10. Initial rollout checklist

All 16 courses support an independent preview. They start as **No preview** until
an administrator uploads and configures a video.

- [ ] Complete Training in Digital Marketing and Community Management
- [ ] Complete Training in Infographics and Graphic Design
- [ ] Complete Training in Video Editing
- [ ] Complete Training in Artificial Intelligence
- [ ] Complete Training in Office Secretarial (Word, Excel...)
- [ ] Complete Training in Trading
- [ ] Complete Training in Cryptocurrency
- [ ] Complete Training in E-commerce & Dropshipping
- [ ] Complete Training in Graphic Design and Video Editing with Canva
- [ ] Complete Training in YouTube Channel and Monetization
- [ ] Complete Training in Accounting and Management
- [ ] Complete Training in Computer Science and Programming
- [ ] Complete Training in Professional and Personal Development
- [ ] Complete Training in Human Resources
- [ ] Complete Training in Project Management
- [ ] Complete Training in Designing Internet Sites with WordPress

## 11. Database and maintenance notes

Migration:
`20261112140000_add_academy_course_preview_videos`

New nullable/defaulted columns on `AcademyCourse`:

- `previewVideoProvider`
- `previewVideoId`
- `previewVideoEnabled` (default `false`)
- `previewVideoTitle`
- `previewVideoPoster`
- `previewVideoDurationLabel`
- `previewVideoUpdatedAt`

The migration is additive and non-destructive. Existing courses keep working
without a preview. The provider field leaves room for another supported host in
the future without redesigning the course model.

Validation and URL construction live in
`src/lib/courses/preview-video.ts`. Admin mutations are authorised on the server
in `src/lib/admin/academy-preview.ts`; hiding the form is never the only control.
