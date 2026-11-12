import { describe, expect, it } from "vitest";
import {
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  getYouTubeWatchUrl,
  isValidYouTubeVideoId,
  normalizePreviewVideoDurationLabel,
  normalizePreviewVideoPoster,
  normalizePreviewVideoTitle,
  parsePreviewVideoUrl,
} from "@/lib/courses/preview-video";
import { databasePreviewVideo } from "@/lib/courses/catalog-service";

const VIDEO_ID = "abc123DEF45";

function expectValid(input: string, expectedId = VIDEO_ID) {
  const result = parsePreviewVideoUrl(input);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.video.videoId).toBe(expectedId);
    expect(result.video.provider).toBe("YOUTUBE");
    expect(result.video.canonicalUrl).toBe(
      `https://www.youtube.com/watch?v=${expectedId}`,
    );
  }
}

function expectInvalid(input: string) {
  const result = parsePreviewVideoUrl(input);
  expect(result.ok).toBe(false);
}

describe("YouTube preview URL validation", () => {
  it("accepts the supported YouTube link formats", () => {
    expectValid(`https://www.youtube.com/watch?v=${VIDEO_ID}`);
    expectValid(`https://youtube.com/watch?v=${VIDEO_ID}`);
    expectValid(`https://m.youtube.com/watch?v=${VIDEO_ID}`);
    expectValid(`https://youtu.be/${VIDEO_ID}`);
    expectValid(`https://www.youtube.com/embed/${VIDEO_ID}`);
    expectValid(`https://www.youtube.com/shorts/${VIDEO_ID}`);
  });

  it("accepts query parameters and fragments without using them as the ID", () => {
    expectValid(
      `https://www.youtube.com/watch?app=desktop&v=${VIDEO_ID}&t=42s&list=PL123#chapter`,
    );
    expectValid(`https://youtu.be/${VIDEO_ID}?si=share-token&t=10`);
    expectValid(`https://www.youtube.com/embed/${VIDEO_ID}?start=30&rel=0`);
    expectValid(`https://www.youtube.com/shorts/${VIDEO_ID}?feature=share`);
    expectValid(`https://www.youtube.com/watch/?v=${VIDEO_ID}`);
  });

  it("accepts a bare link pasted from a share sheet", () => {
    expectValid(`www.youtube.com/watch?v=${VIDEO_ID}`);
    expectValid(`youtu.be/${VIDEO_ID}`);
  });

  it("rejects non-YouTube domains and deceptive suffixes", () => {
    expectInvalid(`https://vimeo.com/${VIDEO_ID}`);
    expectInvalid(`https://example.com/watch?v=${VIDEO_ID}`);
    expectInvalid(`https://youtube.com.evil.example/watch?v=${VIDEO_ID}`);
    expectInvalid(`https://evil-youtube.com/watch?v=${VIDEO_ID}`);
    expectInvalid(`https://www.youtube-nocookie.com/embed/${VIDEO_ID}`);
  });

  it("rejects malformed, empty, and missing video IDs", () => {
    expectInvalid("");
    expectInvalid("   ");
    expectInvalid("not a url");
    expectInvalid("https://www.youtube.com/watch");
    expectInvalid("https://www.youtube.com/watch?v=");
    expectInvalid("https://www.youtube.com/watch?v=short");
    expectInvalid(`https://www.youtube.com/watch?v=${VIDEO_ID}x`);
    expectInvalid("https://youtu.be/");
    expectInvalid(`https://youtu.be/${VIDEO_ID}/extra`);
    expectInvalid(`https://www.youtube.com/channel/${VIDEO_ID}`);
    expectInvalid(`https://www.youtube.com/embed/${VIDEO_ID}/extra`);
  });

  it("rejects dangerous schemes, credentials, and ports", () => {
    expectInvalid("javascript:alert(1)");
    expectInvalid("data:text/html;base64,PHNjcmlwdD4=");
    expectInvalid("http://www.youtube.com/watch?v=abc123DEF45");
    expectInvalid(`https://user:pass@www.youtube.com/watch?v=${VIDEO_ID}`);
    expectInvalid(`https://www.youtube.com:8443/watch?v=${VIDEO_ID}`);
  });

  it("rejects iframe markup and HTML/script injection attempts", () => {
    expectInvalid(
      `<iframe src="https://www.youtube.com/embed/${VIDEO_ID}"></iframe>`,
    );
    expectInvalid(
      `https://www.youtube.com/watch?v=${VIDEO_ID}"><script>alert(1)</script>`,
    );
    expectInvalid(`https://www.youtube.com/watch?v=${VIDEO_ID}&x=<svg>`);
  });

  it("builds only trusted privacy-enhanced player URLs", () => {
    expect(getYouTubeEmbedUrl(VIDEO_ID)).toBe(
      `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0&playsinline=1`,
    );
    expect(getYouTubeEmbedUrl(VIDEO_ID)).not.toMatch(/autoplay/i);
    expect(getYouTubeWatchUrl(VIDEO_ID)).toBe(
      `https://www.youtube.com/watch?v=${VIDEO_ID}`,
    );
    expect(getYouTubeThumbnailUrl(VIDEO_ID)).toBe(
      `https://i.ytimg.com/vi/${VIDEO_ID}/mqdefault.jpg`,
    );
    expect(getYouTubeEmbedUrl("<script>")).toBeNull();
    expect(getYouTubeWatchUrl("bad")).toBeNull();
    expect(getYouTubeThumbnailUrl("")).toBeNull();
  });

  it("validates IDs independently of URL parsing", () => {
    expect(isValidYouTubeVideoId(VIDEO_ID)).toBe(true);
    expect(isValidYouTubeVideoId("abc123DEF4")).toBe(false);
    expect(isValidYouTubeVideoId("abc123DEF456")).toBe(false);
    expect(isValidYouTubeVideoId("abc123 DEF45")).toBe(false);
    expect(isValidYouTubeVideoId(null)).toBe(false);
  });
});

describe("preview metadata validation", () => {
  it("normalizes titles and duration labels", () => {
    expect(normalizePreviewVideoTitle("  Watch the intro  ")).toEqual({
      ok: true,
      value: "Watch the intro",
    });
    expect(normalizePreviewVideoTitle("")).toEqual({ ok: true, value: null });
    expect(normalizePreviewVideoTitle("x".repeat(161)).ok).toBe(false);
    expect(normalizePreviewVideoDurationLabel(" 4:35 ")).toEqual({
      ok: true,
      value: "4:35",
    });
    expect(normalizePreviewVideoDurationLabel("4–5 minutes")).toEqual({
      ok: true,
      value: "4–5 minutes",
    });
    expect(normalizePreviewVideoDurationLabel("x".repeat(33)).ok).toBe(false);
  });

  it("accepts only safe https poster URLs", () => {
    expect(
      normalizePreviewVideoPoster(
        "https://res.cloudinary.com/techia/image/upload/v1/academy/poster.jpg",
      ),
    ).toMatchObject({ ok: true });
    expect(normalizePreviewVideoPoster("")).toEqual({ ok: true, value: null });
    expect(normalizePreviewVideoPoster("http://example.com/poster.jpg").ok).toBe(false);
    expect(normalizePreviewVideoPoster("javascript:alert(1)").ok).toBe(false);
    expect(normalizePreviewVideoPoster("data:image/png;base64,abc").ok).toBe(false);
    expect(normalizePreviewVideoPoster("not a url").ok).toBe(false);
  });
});

describe("storefront preview exposure", () => {
  type CourseRow = Parameters<typeof databasePreviewVideo>[0];

  function row(overrides: Record<string, unknown> = {}) {
    return {
      previewVideoEnabled: true,
      previewVideoProvider: "YOUTUBE",
      previewVideoId: VIDEO_ID,
      previewVideoTitle: "Free introduction",
      previewVideoDurationLabel: "4:35",
      previewVideoPoster: null,
      ...overrides,
    } as CourseRow;
  }

  it("exposes an enabled, valid YouTube preview", () => {
    expect(databasePreviewVideo(row())).toEqual({
      provider: "YOUTUBE",
      videoId: VIDEO_ID,
      title: "Free introduction",
      durationLabel: "4:35",
      posterUrl: null,
    });
  });

  it("keeps previews disabled by default and optional", () => {
    expect(databasePreviewVideo(row({ previewVideoEnabled: false }))).toBeNull();
  });

  it("never exposes malformed, unsupported, or untrusted configurations", () => {
    expect(databasePreviewVideo(row({ previewVideoId: null }))).toBeNull();
    expect(databasePreviewVideo(row({ previewVideoId: "bad" }))).toBeNull();
    expect(databasePreviewVideo(row({ previewVideoProvider: "VIMEO" }))).toBeNull();
    expect(databasePreviewVideo(row({ previewVideoId: "<script>" }))).toBeNull();
  });

  it("drops invalid optional metadata without breaking the preview", () => {
    const preview = databasePreviewVideo(
      row({
        previewVideoTitle: "x".repeat(161),
        previewVideoDurationLabel: "x".repeat(33),
        previewVideoPoster: "javascript:alert(1)",
      }),
    );
    expect(preview).not.toBeNull();
    expect(preview?.title).toBeNull();
    expect(preview?.durationLabel).toBeNull();
    expect(preview?.posterUrl).toBeNull();
  });
});
