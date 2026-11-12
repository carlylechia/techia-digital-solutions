/**
 * Shared preview-video validation and URL builders.
 *
 * Administrators paste a normal YouTube link. The server extracts the 11-char
 * video ID and stores it separately from the URL, so the public player can
 * always rebuild an embed URL against a fixed, trusted host. No iframe markup
 * or arbitrary embed domain is ever accepted.
 *
 * This module intentionally has no dependencies so it can be used by the admin
 * form (client) and by server actions / catalog queries alike. It contains no
 * secrets and performs no network requests.
 */

export const PREVIEW_VIDEO_PROVIDER = "YOUTUBE" as const;
export type PreviewVideoProvider = typeof PREVIEW_VIDEO_PROVIDER;

export const YOUTUBE_EMBED_HOST = "https://www.youtube-nocookie.com";
export const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

export type ParsedYouTubeVideo = {
  provider: PreviewVideoProvider;
  videoId: string;
  canonicalUrl: string;
};

export type ParsePreviewVideoUrlResult =
  | { ok: true; video: ParsedYouTubeVideo }
  | { ok: false; error: string };

export type NormalizedOptionalText =
  | { ok: true; value: string | null }
  | { ok: false; error: string };

function withScheme(value: string) {
  // Accept a bare "youtube.com/watch?v=…" pasted from a mobile share sheet.
  // Anything with an explicit scheme is parsed as-is and rejected unless it is
  // an https YouTube URL.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//")) {
    return value;
  }
  return `https://${value}`;
}

function pathSegments(pathname: string) {
  return pathname.split("/").filter(Boolean);
}

/**
 * Extract a YouTube video ID from the supported public link formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 *
 * Query parameters and fragments are allowed and ignored. Hosts, paths, ports,
 * credentials, schemes, and IDs are validated strictly.
 */
export function parsePreviewVideoUrl(input: unknown): ParsePreviewVideoUrlResult {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) {
    return { ok: false, error: "Paste the YouTube link for this course preview." };
  }
  if (raw.length > 2048) {
    return { ok: false, error: "This URL is too long. Paste a normal YouTube link." };
  }
  if (/[<>"']/.test(raw)) {
    return {
      ok: false,
      error: "Only a plain YouTube link is accepted — paste the video URL, not embed code.",
    };
  }

  let url: URL;
  try {
    url = new URL(withScheme(raw));
  } catch {
    return { ok: false, error: "That does not look like a valid URL. Paste a YouTube video link." };
  }

  if (url.protocol !== "https:") {
    return { ok: false, error: "The preview link must start with https://." };
  }
  if (url.username || url.password) {
    return { ok: false, error: "The preview link cannot contain credentials." };
  }
  if (url.port) {
    return { ok: false, error: "The preview link must use the standard YouTube domain." };
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!YOUTUBE_HOSTS.has(hostname)) {
    return {
      ok: false,
      error: "Use a YouTube link (youtube.com, www.youtube.com, m.youtube.com, or youtu.be).",
    };
  }

  let videoId: string | null = null;

  if (hostname === "youtu.be") {
    const segments = pathSegments(url.pathname);
    if (segments.length === 1) videoId = segments[0];
  } else {
    const segments = pathSegments(url.pathname);
    if (segments.length === 1 && segments[0] === "watch") {
      videoId = url.searchParams.get("v");
    } else if (segments.length === 2 && segments[0] === "embed") {
      videoId = segments[1];
    } else if (segments.length === 2 && segments[0] === "shorts") {
      videoId = segments[1];
    }
  }

  if (!videoId) {
    return {
      ok: false,
      error:
        "This YouTube link format is not supported. Use a watch, youtu.be, embed, or shorts link.",
    };
  }

  const normalizedId = videoId.trim();
  if (!YOUTUBE_VIDEO_ID_PATTERN.test(normalizedId)) {
    return {
      ok: false,
      error: "The YouTube video ID in that link is not valid. Check the link and paste it again.",
    };
  }

  return {
    ok: true,
    video: {
      provider: PREVIEW_VIDEO_PROVIDER,
      videoId: normalizedId,
      canonicalUrl: `https://www.youtube.com/watch?v=${normalizedId}`,
    },
  };
}

export function isValidYouTubeVideoId(value: unknown): value is string {
  return typeof value === "string" && YOUTUBE_VIDEO_ID_PATTERN.test(value);
}

/** Privacy-enhanced embed URL. No autoplay and no unsupported quality params. */
export function getYouTubeEmbedUrl(videoId: string): string | null {
  if (!isValidYouTubeVideoId(videoId)) return null;
  return `${YOUTUBE_EMBED_HOST}/embed/${videoId}?rel=0&playsinline=1`;
}

export function getYouTubeWatchUrl(videoId: string): string | null {
  if (!isValidYouTubeVideoId(videoId)) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Small 320×180 thumbnail (16:9) — enough for the click-to-load poster and far
 * lighter than maxres/high-resolution variants. Only one resolution is ever
 * requested.
 */
export function getYouTubeThumbnailUrl(videoId: string): string | null {
  if (!isValidYouTubeVideoId(videoId)) return null;
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

export function normalizePreviewVideoTitle(input: unknown): NormalizedOptionalText {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return { ok: true, value: null };
  if (raw.length > 160) {
    return { ok: false, error: "The preview title must be 160 characters or fewer." };
  }
  if (/[\u0000-\u001f\u007f]/.test(raw)) {
    return { ok: false, error: "The preview title contains unsupported characters." };
  }
  return { ok: true, value: raw };
}

export function normalizePreviewVideoDurationLabel(
  input: unknown,
): NormalizedOptionalText {
  const raw = typeof input === "string" ? input.trim().replace(/\s+/g, " ") : "";
  if (!raw) return { ok: true, value: null };
  if (raw.length > 32) {
    return { ok: false, error: "The duration label must be 32 characters or fewer." };
  }
  if (/[\u0000-\u001f\u007f]/.test(raw)) {
    return { ok: false, error: "The duration label contains unsupported characters." };
  }
  return { ok: true, value: raw };
}

/**
 * Optional custom poster. Accepts an https image URL only (for example the
 * Cloudinary URL returned by the existing academy media uploader). A missing
 * value is valid and falls back to the YouTube thumbnail.
 */
export function normalizePreviewVideoPoster(
  input: unknown,
): NormalizedOptionalText {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return { ok: true, value: null };
  if (raw.length > 2048) {
    return { ok: false, error: "The poster URL is too long." };
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, error: "The poster must be a valid https image URL." };
  }
  if (url.protocol !== "https:") {
    return { ok: false, error: "The poster must use an https:// image URL." };
  }
  if (!url.hostname || url.username || url.password || url.port) {
    return { ok: false, error: "The poster URL must point to a standard https domain." };
  }
  return { ok: true, value: url.toString() };
}

export function getDefaultPreviewTitle(locale: "en" | "fr") {
  return locale === "fr"
    ? "Découvrez cette formation en vidéo"
    : "Watch the free introduction to this course";
}

export function getDefaultPreviewDescription(locale: "en" | "fr") {
  return locale === "fr"
    ? "Profitez d’une introduction gratuite à ce cours et découvrez l’expérience d’apprentissage teChia Digital Academy."
    : "Get a free introduction to this course and see what learning with teChia Digital Academy looks like.";
}
