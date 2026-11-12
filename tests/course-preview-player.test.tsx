import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

const { trackCourseEvent } = vi.hoisted(() => ({
  trackCourseEvent: vi.fn(),
}));

vi.mock("@/lib/analytics/courseEvents", () => ({ trackCourseEvent }));

const { CoursePreviewPlayer } = await import(
  "@/components/courses/CoursePreviewPlayer"
);

const VIDEO_ID = "abc123DEF45";

function renderPlayer(
  props: Partial<ComponentProps<typeof CoursePreviewPlayer>> = {},
) {
  return render(
    <CoursePreviewPlayer
      videoId={VIDEO_ID}
      courseId="course_1"
      courseSlug="digital-marketing"
      courseTitle="Complete Training in Digital Marketing"
      title="Watch the free introduction"
      durationLabel="4:35"
      locale="en"
      {...props}
    />,
  );
}

describe("CoursePreviewPlayer", () => {
  beforeEach(() => {
    cleanup();
    trackCourseEvent.mockClear();
    document.getElementById("techia-youtube-preconnect")?.remove();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.getElementById("techia-youtube-preconnect")?.remove();
  });

  it("renders no iframe, YouTube script, or resource hint before play", () => {
    renderPlayer();

    expect(document.querySelector("iframe")).toBeNull();
    expect(document.querySelector('script[src*="youtube" i]')).toBeNull();
    expect(document.getElementById("techia-youtube-preconnect")).toBeNull();
    expect(
      screen.getByRole("button", { name: /Play the free preview/i }),
    ).toBeTruthy();
    expect(screen.getByText("Free course preview")).toBeTruthy();
    expect(screen.getByText("4:35")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Open on YouTube/i }).getAttribute("href"),
    ).toBe(`https://www.youtube.com/watch?v=${VIDEO_ID}`);
  });

  it("uses one lightweight YouTube thumbnail and a reserved 16:9 frame", () => {
    renderPlayer();
    const poster = document.querySelector("img");
    expect(poster?.getAttribute("src")).toBe(
      `https://i.ytimg.com/vi/${VIDEO_ID}/mqdefault.jpg`,
    );
    expect(poster?.getAttribute("width")).toBe("320");
    expect(poster?.getAttribute("height")).toBe("180");
    expect(document.querySelector(".aspect-video")).not.toBeNull();
  });

  it("prefers a custom poster when one is configured", () => {
    renderPlayer({ posterUrl: "https://res.cloudinary.com/techia/poster.jpg" });
    expect(document.querySelector("img")?.getAttribute("src")).toBe(
      "https://res.cloudinary.com/techia/poster.jpg",
    );
  });

  it("creates the privacy-enhanced iframe only after clicking Play", () => {
    renderPlayer();
    fireEvent.click(
      screen.getByRole("button", { name: /Play the free preview/i }),
    );

    const iframe = document.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute("src")).toBe(
      `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0&playsinline=1`,
    );
    expect(iframe?.getAttribute("src")).not.toContain("autoplay");
    expect(iframe?.getAttribute("allow")).not.toContain("autoplay");
    expect(iframe?.getAttribute("title")).toContain(
      "Complete Training in Digital Marketing",
    );
    expect(iframe?.hasAttribute("allowfullscreen")).toBe(true);
    expect(document.getElementById("techia-youtube-preconnect")).not.toBeNull();
    expect(document.querySelector('script[src*="youtube" i]')).toBeNull();
    expect(trackCourseEvent).toHaveBeenCalledWith(
      "preview_video_play",
      expect.objectContaining({
        course_id: "course_1",
        course_slug: "digital-marketing",
        video_id: VIDEO_ID,
      }),
    );
  });

  it("shows a loading state and then hands playback to the native player", () => {
    renderPlayer();
    fireEvent.click(
      screen.getByRole("button", { name: /Play the free preview/i }),
    );
    expect(screen.getByRole("status").textContent).toContain(
      "Loading the preview",
    );

    fireEvent.load(document.querySelector("iframe")!);
    expect(screen.queryByRole("status")).toBeNull();
    expect(document.querySelector("iframe")).not.toBeNull();
  });

  it("recovers from a load timeout with retry and a safe external link", () => {
    vi.useFakeTimers();
    renderPlayer();
    fireEvent.click(
      screen.getByRole("button", { name: /Play the free preview/i }),
    );

    act(() => {
      vi.advanceTimersByTime(25_000);
    });

    expect(screen.getByRole("alert").textContent).toContain(
      "We're having trouble loading this preview",
    );
    expect(document.querySelector("iframe")).toBeNull();
    expect(trackCourseEvent).toHaveBeenCalledWith(
      "preview_video_error",
      expect.objectContaining({ reason: "load_timeout" }),
    );

    const links = screen.getAllByRole("link", { name: /Open on YouTube/i });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }

    const playCallsBeforeRetry = trackCourseEvent.mock.calls.filter(
      ([name]) => name === "preview_video_play",
    ).length;
    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));
    expect(document.querySelector("iframe")).not.toBeNull();
    expect(
      trackCourseEvent.mock.calls.filter(
        ([name]) => name === "preview_video_play",
      ).length,
    ).toBe(playCallsBeforeRetry);
  });

  it("tracks external viewing without blocking the link", () => {
    renderPlayer();
    fireEvent.click(screen.getByRole("link", { name: /Open on YouTube/i }));
    expect(trackCourseEvent).toHaveBeenCalledWith(
      "preview_video_external_open",
      expect.objectContaining({ reason: "inline_link" }),
    );
  });

  it("fails safely when the stored video ID is invalid", () => {
    renderPlayer({ videoId: "not-a-video-id" });
    expect(document.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain(
      "This preview is not available right now",
    );
  });

  it("renders French labels for French pages", () => {
    renderPlayer({ locale: "fr", title: null, durationLabel: null });
    expect(
      screen.getByRole("button", { name: /Lire l’aperçu gratuit/i }),
    ).toBeTruthy();
    expect(screen.getByText("Aperçu gratuit")).toBeTruthy();
    expect(screen.queryByText("4:35")).toBeNull();
  });
});
