"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Video } from "lucide-react";
import {
  getYouTubeThumbnailUrl,
  parsePreviewVideoUrl,
} from "@/lib/courses/preview-video";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition placeholder:text-muted/70 focus:border-accent/60 focus:ring-2 focus:ring-accent/25";
const labelClass =
  "grid gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted";
const hintClass = "text-xs font-medium normal-case tracking-normal text-muted";

/**
 * Admin-only preview configuration fields. Parses the pasted YouTube URL
 * locally for immediate feedback and a thumbnail, while the server action
 * re-validates everything before writing to PostgreSQL.
 */
export function AcademyPreviewVideoFields({
  defaultUrl = "",
  defaultTitle = "",
  defaultDurationLabel = "",
  defaultEnabled = false,
  hasExistingPreview = false,
}: {
  defaultUrl?: string;
  defaultTitle?: string;
  defaultDurationLabel?: string;
  defaultEnabled?: boolean;
  hasExistingPreview?: boolean;
}) {
  const [url, setUrl] = useState(defaultUrl);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  const parsed = url.trim() ? parsePreviewVideoUrl(url) : null;
  const thumbnailUrl = parsed?.ok ? getYouTubeThumbnailUrl(parsed.video.videoId) : null;

  return (
    <div className="grid gap-5">
      <div className="rounded-2xl border border-border bg-surface-strong/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            <Video className="size-4 text-accent" />
            Course preview video
          </p>
          <span className="text-xs font-medium text-muted">
            {hasExistingPreview
              ? defaultEnabled
                ? "Configured · enabled"
                : "Configured · disabled"
              : "Not configured"}
          </span>
        </div>

        <div className="mt-4 grid gap-4">
          <label className={labelClass}>
            Preview video URL
            <input
              name="previewVideoUrl"
              type="text"
              inputMode="url"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setThumbnailFailed(false);
              }}
              className={inputClass}
              placeholder="https://www.youtube.com/watch?v=..."
              autoComplete="off"
              spellCheck={false}
              aria-describedby="preview-video-url-help"
            />
            <span id="preview-video-url-help" className={hintClass}>
              Paste a normal YouTube watch, youtu.be, embed, or shorts link. The video ID is
              extracted and validated automatically.
            </span>
          </label>

          <div aria-live="polite" className="min-h-5">
            {parsed && !parsed.ok ? (
              <p className="flex items-start gap-1.5 text-xs font-semibold text-rose-400">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                {parsed.error}
              </p>
            ) : null}
            {parsed?.ok ? (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                <CheckCircle2 className="size-3.5 shrink-0" />
                Valid YouTube link · ID {parsed.video.videoId}
              </p>
            ) : null}
          </div>

          {thumbnailUrl ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
              <div className="relative h-[54px] w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                {thumbnailFailed ? (
                  <div className="grid h-full place-items-center text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                    No thumbnail
                  </div>
                ) : (
                  // Admin-only sanity check. Uses the same single 320×180
                  // thumbnail as the public poster; never the full gallery.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbnailUrl}
                    alt="YouTube preview thumbnail"
                    width={320}
                    height={180}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                    onError={() => setThumbnailFailed(true)}
                  />
                )}
              </div>
              <div className="min-w-0 text-xs text-muted">
                <p className="font-semibold text-primary">Selected video</p>
                <p className="mt-0.5 break-all font-mono text-[11px]">
                  {parsed?.ok ? parsed.video.videoId : ""}
                </p>
                <p className="mt-1">
                  Customers still see a lightweight poster until they click Play.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Preview title
            <input
              name="previewVideoTitle"
              defaultValue={defaultTitle}
              maxLength={160}
              className={inputClass}
              placeholder="Watch the free introduction to this course"
            />
            <span className={hintClass}>Optional. Shown beside the player.</span>
          </label>
          <label className={labelClass}>
            Duration label
            <input
              name="previewVideoDurationLabel"
              defaultValue={defaultDurationLabel}
              maxLength={32}
              className={inputClass}
              placeholder="e.g. 4:35"
            />
            <span className={hintClass}>
              Optional. Only shown when you record the real duration.
            </span>
          </label>
        </div>

        <label className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-background p-4">
          <input
            type="checkbox"
            name="previewVideoEnabled"
            defaultChecked={defaultEnabled}
            className="mt-0.5 size-4 accent-cyan-400"
          />
          <span>
            <span className="block text-sm font-semibold text-primary">
              Enable free preview
            </span>
            <span className="mt-1 block text-xs leading-5 text-muted">
              The video appears on the public course page only after it is saved and this
              box is checked.
            </span>
          </span>
        </label>
      </div>

    </div>
  );
}
