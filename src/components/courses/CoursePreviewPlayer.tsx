"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Clock,
  ExternalLink,
  LoaderCircle,
  Play,
  RotateCcw,
  Video,
} from "lucide-react";
import type { Locale } from "@/content/site";
import { trackCourseEvent } from "@/lib/analytics/courseEvents";
import {
  getDefaultPreviewTitle,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  getYouTubeWatchUrl,
  isValidYouTubeVideoId,
  YOUTUBE_EMBED_HOST,
} from "@/lib/courses/preview-video";
import { cn } from "@/lib/utils";

type PlayerStatus = "idle" | "loading" | "playing" | "error";

const LOAD_TIMEOUT_MS = 25_000;

function primeYouTubeConnection() {
  if (typeof document === "undefined") return;
  if (document.getElementById("techia-youtube-preconnect")) return;
  const link = document.createElement("link");
  link.id = "techia-youtube-preconnect";
  link.rel = "preconnect";
  link.href = YOUTUBE_EMBED_HOST;
  document.head.appendChild(link);
}

/**
 * Click-to-load YouTube preview.
 *
 * The initial render is intentionally tiny: a reserved 16:9 poster, a play
 * button, and a safe external link. No iframe, YouTube script, player
 * initialisation, or video request happens until the visitor presses Play.
 * Playback is then handed to YouTube's native adaptive streaming and controls.
 */
export function CoursePreviewPlayer({
  videoId,
  courseId,
  courseSlug,
  courseTitle,
  title,
  durationLabel,
  posterUrl,
  locale,
  sourcePage = "course_detail_preview",
}: {
  videoId: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  title?: string | null;
  durationLabel?: string | null;
  posterUrl?: string | null;
  locale: Locale;
  sourcePage?: string;
}) {
  const embedUrl = getYouTubeEmbedUrl(videoId);
  const watchUrl = getYouTubeWatchUrl(videoId);
  const thumbnailUrl = getYouTubeThumbnailUrl(videoId);
  const displayTitle = title?.trim() || getDefaultPreviewTitle(locale);

  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [attempt, setAttempt] = useState(0);
  const [posterFailed, setPosterFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const impressionTracked = useRef(false);

  const analyticsParams = {
    course_id: courseId,
    course_slug: courseSlug,
    video_id: videoId,
    provider: "youtube",
    source_page: sourcePage,
  };

  // Cheap, one-shot visibility impression. No polling and no library.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        if (impressionTracked.current) return;
        impressionTracked.current = true;
        trackCourseEvent("preview_video_impression", analyticsParams);
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
    // analyticsParams is rebuilt from stable primitive props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, courseSlug, videoId, sourcePage]);

  // A cross-origin iframe cannot reliably report every embed failure. A bounded
  // timeout catches the common "never loaded" case without retrying in a loop.
  useEffect(() => {
    if (status !== "loading") return;
    const timeout = window.setTimeout(() => {
      setStatus("error");
      trackCourseEvent("preview_video_error", {
        ...analyticsParams,
        reason: "load_timeout",
      });
    }, LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, attempt, courseId, courseSlug, videoId, sourcePage]);

  if (!isValidYouTubeVideoId(videoId) || !embedUrl || !watchUrl || !thumbnailUrl) {
    return (
      <div className="grid aspect-video place-items-center rounded-2xl border border-border bg-slate-950 p-6 text-center text-white">
        <div>
          <Video className="mx-auto size-7 text-cyan-300" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold" role="alert">
            {locale === "fr"
              ? "Cet aperçu n’est pas disponible pour le moment."
              : "This preview is not available right now."}
          </p>
        </div>
      </div>
    );
  }

  const poster = posterUrl || thumbnailUrl;

  function startPlayback(isRetry: boolean) {
    if (!embedUrl) return;
    if (!isRetry) {
      trackCourseEvent("preview_video_play", analyticsParams);
    }
    primeYouTubeConnection();
    setStatus("loading");
    setAttempt((value) => value + 1);
  }

  function showError(reason: string) {
    setStatus("error");
    trackCourseEvent("preview_video_error", {
      ...analyticsParams,
      reason,
    });
  }

  const playing = status === "loading" || status === "playing";

  return (
    <div ref={containerRef} className="w-full">
      <div
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-slate-950 shadow-[0_20px_60px_rgba(4,8,18,0.22)]",
          "sm:rounded-[1.25rem]",
        )}
      >
        {playing ? (
          <>
            <iframe
              key={attempt}
              src={embedUrl}
              title={`${displayTitle} — ${courseTitle}`}
              className="absolute inset-0 h-full w-full border-0"
              allow="encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setStatus("playing")}
              onError={() => showError("iframe_error")}
            />
            {status === "loading" ? (
              <div
                className="absolute inset-0 z-10 grid place-items-center bg-slate-950/85 px-5 text-center text-white"
                role="status"
                aria-live="polite"
              >
                <div>
                  <LoaderCircle
                    className="mx-auto size-6 motion-safe:animate-spin"
                    aria-hidden="true"
                  />
                  <p className="mt-3 text-sm font-medium">
                    {locale === "fr"
                      ? "Chargement de l’aperçu…"
                      : "Loading the preview…"}
                  </p>
                  <p className="mt-1 text-xs text-white/65">
                    {locale === "fr"
                      ? "La connexion s’adapte à votre réseau."
                      : "Playback adapts to your connection."}
                  </p>
                </div>
              </div>
            ) : null}
          </>
        ) : status === "error" ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-950 px-5 py-6 text-center text-white">
            <div className="max-w-md">
              <AlertCircle className="mx-auto size-7 text-rose-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold" role="alert" aria-live="assertive">
                {locale === "fr"
                  ? "Nous avons du mal à charger cet aperçu. Vérifiez votre connexion et réessayez."
                  : "We're having trouble loading this preview. Check your connection and try again."}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => startPlayback(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 motion-reduce:transition-none"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  {locale === "fr" ? "Réessayer" : "Try again"}
                </button>
                <a
                  href={watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackCourseEvent("preview_video_external_open", {
                      ...analyticsParams,
                      reason: "error_fallback",
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 motion-reduce:transition-none"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  {locale === "fr" ? "Ouvrir sur YouTube" : "Open on YouTube"}
                </a>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => startPlayback(false)}
            aria-label={
              locale === "fr"
                ? `Lire l’aperçu gratuit : ${displayTitle}`
                : `Play the free preview: ${displayTitle}`
            }
            className="group absolute inset-0 block h-full w-full overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-cyan-300"
          >
            {posterFailed ? (
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.32),transparent_42%),radial-gradient(circle_at_75%_80%,rgba(251,113,133,0.28),transparent_38%),linear-gradient(135deg,#081424,#02050c)]"
              />
            ) : (
              // One 320×180 thumbnail only; no gallery and no high-res variant.
              // The container reserves 16:9 before the image arrives.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poster}
                alt=""
                width={320}
                height={180}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.015] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                onError={() => setPosterFailed(true)}
              />
            )}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-slate-950/35"
            />

            <span className="absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/65 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                <Video className="size-3 text-cyan-300" aria-hidden="true" />
                {locale === "fr" ? "Aperçu gratuit" : "Free course preview"}
              </span>
              {durationLabel ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-slate-950/65 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                  <Clock className="size-3" aria-hidden="true" />
                  {durationLabel}
                </span>
              ) : null}
            </span>

            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-16 place-items-center rounded-full bg-white text-slate-950 shadow-[0_16px_50px_rgba(0,0,0,0.4)] transition group-hover:scale-105 group-focus-visible:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:size-[4.5rem]">
                <Play className="ml-0.5 size-6 fill-current sm:size-7" aria-hidden="true" />
              </span>
            </span>

            <span className="absolute inset-x-4 bottom-4 block">
              <span className="line-clamp-2 block text-sm font-semibold leading-6 text-white sm:text-base">
                {displayTitle}
              </span>
              <span className="mt-1 hidden text-xs text-white/70 sm:block">
                {locale === "fr"
                  ? "Cliquez pour charger la vidéo. Aucune lecture automatique."
                  : "Click to load the video. No autoplay."}
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          {locale === "fr"
            ? "La lecture utilise le lecteur YouTube natif et s’adapte à votre connexion."
            : "Playback uses YouTube's native player and adapts to your connection."}
        </p>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackCourseEvent("preview_video_external_open", {
              ...analyticsParams,
              reason: "inline_link",
            })
          }
          className="inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-accent underline-offset-4 transition hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
        >
          <ExternalLink className="size-3.5" aria-hidden="true" />
          {locale === "fr" ? "Ouvrir sur YouTube" : "Open on YouTube"}
        </a>
      </div>
    </div>
  );
}
