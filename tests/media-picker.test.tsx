import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const library = [
  { id: "m1", url: "https://res.cloudinary.com/demo/image/upload/a.jpg", publicId: "techia/blog/a", format: "jpg", mimeType: "image/jpeg", width: 800, height: 600, bytes: 1200, altText: "Analytics dashboard", createdAt: "2026-09-20T10:00:00.000Z" },
  { id: "m2", url: "https://res.cloudinary.com/demo/image/upload/b.png", publicId: "techia/blog/b", format: "png", mimeType: "image/png", width: 400, height: 300, bytes: 900, altText: "", createdAt: "2026-09-22T10:00:00.000Z" },
];

let onUploaded = vi.fn();
let onCleared = vi.fn();

async function load() {
  const { BlogMediaUploader } = await import("@/components/blog/blog-media-uploader");
  render(<BlogMediaUploader onUploaded={onUploaded} onCleared={onCleared} />);
}

describe("featured image source", () => {
  beforeEach(() => {
    cleanup();
    onUploaded = vi.fn();
    onCleared = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, media: library }) })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("offers a choice between the media library and uploading a file", async () => {
    await load();
    expect(screen.getByRole("tab", { name: /media library/i }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: /upload file/i }).getAttribute("aria-selected")).toBe("false");

    fireEvent.click(screen.getByRole("tab", { name: /upload file/i }));
    expect(screen.getByRole("tab", { name: /upload file/i }).getAttribute("aria-selected")).toBe("true");
    const file = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(file?.getAttribute("accept")).toBe("image/jpeg,image/png,image/webp,image/avif");
  });

  it("lists the images already in the library", async () => {
    await load();
    await waitFor(() => expect(screen.getByText("Analytics dashboard")).toBeTruthy());
    expect(screen.getByText("No description yet")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/editorial/media", { credentials: "same-origin" });
  });

  it("attaches the chosen library image with its stored description", async () => {
    await load();
    await waitFor(() => expect(screen.getByText("Analytics dashboard")).toBeTruthy());
    fireEvent.click(screen.getByText("Analytics dashboard"));
    expect(onUploaded).toHaveBeenCalledWith({
      url: library[0].url,
      publicId: library[0].publicId,
      altText: "Analytics dashboard",
      format: "jpg",
      width: 800,
      height: 600,
      bytes: 1200,
    });
  });

  it("filters the library by description or file name", async () => {
    await load();
    await waitFor(() => expect(screen.getByText("Analytics dashboard")).toBeTruthy());
    fireEvent.change(screen.getByLabelText("Search the media library"), { target: { value: "analytics" } });
    expect(screen.queryByText("No description yet")).toBeNull();
    fireEvent.change(screen.getByLabelText("Search the media library"), { target: { value: "nothing here" } });
    expect(screen.getByText(/No image in the library matches/)).toBeTruthy();
  });

  it("guides the author when the library is still empty", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, media: [] }) })));
    await load();
    await waitFor(() => expect(screen.getByText(/The media library is empty/)).toBeTruthy());
  });

  it("surfaces a failed library load without hiding the upload option", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({ ok: false, error: "Media storage is unavailable." }) })));
    await load();
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Media storage is unavailable."));
    fireEvent.click(screen.getByRole("tab", { name: /upload file/i }));
    expect(document.querySelector('input[type="file"]')).toBeTruthy();
  });

  it("offers to remove the image already attached to the article", async () => {
    const { BlogMediaUploader } = await import("@/components/blog/blog-media-uploader");
    render(<BlogMediaUploader onUploaded={onUploaded} onCleared={onCleared} selectedUrl={library[0].url} />);
    await waitFor(() => expect(screen.getByText("Analytics dashboard")).toBeTruthy());
    expect(screen.getByText("Attached:")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /remove image/i }));
    expect(onCleared).toHaveBeenCalledTimes(1);
  });
});
