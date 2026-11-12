import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSessionMock, getPrismaMock, revalidatePathMock, updateMock } =
  vi.hoisted(() => ({
    getServerSessionMock: vi.fn(),
    getPrismaMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    updateMock: vi.fn(),
  }));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/prisma", () => ({ getPrisma: getPrismaMock }));

const { saveAcademyCoursePreview } = await import(
  "@/lib/admin/academy-preview"
);

const VIDEO_ID = "abc123DEF45";

function authorizedSession() {
  getServerSessionMock.mockResolvedValue({
    user: {
      email: "admin@techia.test",
      permissions: ["academy.catalog.manage"],
    },
  });
}

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    courseId: "course_1",
    url: `https://www.youtube.com/watch?v=${VIDEO_ID}`,
    title: "Watch the free introduction",
    durationLabel: "4:35",
    posterUrl: "",
    enabled: true,
    remove: false,
    ...overrides,
  };
}

describe("academy preview server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPrismaMock.mockReturnValue({
      academyCourse: { update: updateMock },
    });
    updateMock.mockResolvedValue({
      slug: "digital-marketing",
      previewVideoEnabled: true,
    });
  });

  it("rejects unauthenticated or unauthorised callers before touching the database", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const result = await saveAcademyCoursePreview(baseInput());
    expect(result.ok).toBe(false);
    expect(result.message).toContain("permission");
    expect(updateMock).not.toHaveBeenCalled();

    getServerSessionMock.mockResolvedValue({
      user: { email: "viewer@techia.test", permissions: ["academy.orders.view"] },
    });
    const forbidden = await saveAcademyCoursePreview(baseInput());
    expect(forbidden.ok).toBe(false);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("extracts and stores the video ID instead of the raw URL", async () => {
    authorizedSession();
    const result = await saveAcademyCoursePreview(
      baseInput({
        url: `https://youtu.be/${VIDEO_ID}?si=share-token`,
      }),
    );

    expect(result.ok).toBe(true);
    expect(updateMock).toHaveBeenCalledTimes(1);
    const call = updateMock.mock.calls[0][0];
    expect(call.where).toEqual({ id: "course_1" });
    expect(call.data).toMatchObject({
      previewVideoProvider: "YOUTUBE",
      previewVideoId: VIDEO_ID,
      previewVideoEnabled: true,
      previewVideoTitle: "Watch the free introduction",
      previewVideoDurationLabel: "4:35",
      previewVideoPoster: null,
    });
    expect(call.data).not.toHaveProperty("status");
    expect(call.data).not.toHaveProperty("publishedAt");
    expect(call.data).not.toHaveProperty("titleEn");
    expect(call.data.previewVideoUpdatedAt).toBeInstanceOf(Date);
  });

  it("can save a configured preview while keeping it disabled", async () => {
    authorizedSession();
    updateMock.mockResolvedValue({
      slug: "digital-marketing",
      previewVideoEnabled: false,
    });
    const result = await saveAcademyCoursePreview(
      baseInput({ enabled: false }),
    );
    expect(result.ok).toBe(true);
    expect(result.message).toContain("disabled");
    expect(updateMock.mock.calls[0][0].data.previewVideoEnabled).toBe(false);
  });

  it("replaces an existing preview with a different validated ID", async () => {
    authorizedSession();
    const nextId = "zyx987WVU65";
    await saveAcademyCoursePreview(
      baseInput({ url: `https://www.youtube.com/shorts/${nextId}` }),
    );
    expect(updateMock.mock.calls[0][0].data.previewVideoId).toBe(nextId);
  });

  it("removes every preview field without validating a URL", async () => {
    authorizedSession();
    updateMock.mockResolvedValue({ slug: "digital-marketing" });
    const result = await saveAcademyCoursePreview(
      baseInput({ remove: true, url: "" }),
    );

    expect(result.ok).toBe(true);
    expect(result.message).toContain("removed");
    expect(updateMock.mock.calls[0][0].data).toMatchObject({
      previewVideoProvider: null,
      previewVideoId: null,
      previewVideoEnabled: false,
      previewVideoTitle: null,
      previewVideoPoster: null,
      previewVideoDurationLabel: null,
    });
  });

  it("rejects invalid or missing URLs without writing", async () => {
    authorizedSession();
    for (const url of [
      "",
      "https://vimeo.com/123",
      "javascript:alert(1)",
      "https://www.youtube.com/watch?v=bad",
    ]) {
      const result = await saveAcademyCoursePreview(baseInput({ url }));
      expect(result.ok).toBe(false);
    }
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects invalid poster URLs without writing", async () => {
    authorizedSession();
    const result = await saveAcademyCoursePreview(
      baseInput({ posterUrl: "javascript:alert(1)" }),
    );
    expect(result.ok).toBe(false);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("revalidates the public course and admin paths after a save", async () => {
    authorizedSession();
    await saveAcademyCoursePreview(baseInput());
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/en/courses/digital-marketing",
      "page",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/fr/courses/digital-marketing",
      "page",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/[locale]/courses/[slug]",
      "page",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/[locale]/admin/academy",
      "page",
    );
  });

  it("turns a missing course into a calm retry message", async () => {
    authorizedSession();
    updateMock.mockRejectedValue({ code: "P2025" });
    const result = await saveAcademyCoursePreview(baseInput());
    expect(result.ok).toBe(false);
    expect(result.message).toContain("changed or removed");
    expect(result.message).not.toContain("P2025");
  });
});
