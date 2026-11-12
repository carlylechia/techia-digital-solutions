import "server-only";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { getPrisma } from "@/lib/prisma";
import {
  normalizePreviewVideoDurationLabel,
  normalizePreviewVideoPoster,
  normalizePreviewVideoTitle,
  parsePreviewVideoUrl,
} from "@/lib/courses/preview-video";

export type AcademyPreviewActionResult = {
  ok: boolean;
  message: string;
  ts: number;
};

export type SaveAcademyPreviewInput = {
  courseId: string;
  url: string;
  title: string;
  durationLabel: string;
  posterUrl: string;
  enabled: boolean;
  remove: boolean;
};

function revalidatePreview(slug: string) {
  revalidatePath("/[locale]/admin/academy", "page");
  revalidatePath("/[locale]/courses/[slug]", "page");
  // Revalidate the concrete localized paths too, so a save is immediately
  // visible even when the dynamic route pattern has already been cached.
  revalidatePath(`/en/courses/${slug}`, "page");
  revalidatePath(`/fr/courses/${slug}`, "page");
}

/**
 * Server-side save/remove for an academy course preview. Authorization is
 * enforced here (never only by hiding admin controls), the URL is parsed on the
 * server, and only normalised scalar fields reach PostgreSQL.
 */
export async function saveAcademyCoursePreview(
  input: SaveAcademyPreviewInput,
): Promise<AcademyPreviewActionResult> {
  const timestamp = () => Date.now();

  const session = await getServerSession(authOptions);
  if (
    !session?.user?.email ||
    !hasPermission(session.user.permissions, "academy.catalog.manage")
  ) {
    return {
      ok: false,
      message: "You do not have permission to manage the academy catalog.",
      ts: timestamp(),
    };
  }

  const courseId = input.courseId.trim();
  if (!courseId) {
    return {
      ok: false,
      message: "This form is missing its course id. Refresh the page and try again.",
      ts: timestamp(),
    };
  }

  const prisma = getPrisma();
  if (!prisma) {
    return {
      ok: false,
      message: "The database is unavailable right now. Try again shortly.",
      ts: timestamp(),
    };
  }

  try {
    if (input.remove) {
      const removed = await prisma.academyCourse.update({
        where: { id: courseId },
        data: {
          previewVideoProvider: null,
          previewVideoId: null,
          previewVideoEnabled: false,
          previewVideoTitle: null,
          previewVideoPoster: null,
          previewVideoDurationLabel: null,
          previewVideoUpdatedAt: new Date(),
        },
        select: { slug: true },
      });
      revalidatePreview(removed.slug);
      return {
        ok: true,
        message: "Preview removed. Customers will no longer see a video on this course page.",
        ts: timestamp(),
      };
    }

    const parsed = parsePreviewVideoUrl(input.url);
    if (!parsed.ok) {
      return { ok: false, message: parsed.error, ts: timestamp() };
    }

    const title = normalizePreviewVideoTitle(input.title);
    if (!title.ok) {
      return { ok: false, message: title.error, ts: timestamp() };
    }

    const duration = normalizePreviewVideoDurationLabel(input.durationLabel);
    if (!duration.ok) {
      return { ok: false, message: duration.error, ts: timestamp() };
    }

    const poster = normalizePreviewVideoPoster(input.posterUrl);
    if (!poster.ok) {
      return { ok: false, message: poster.error, ts: timestamp() };
    }

    const saved = await prisma.academyCourse.update({
      where: { id: courseId },
      data: {
        previewVideoProvider: parsed.video.provider,
        previewVideoId: parsed.video.videoId,
        previewVideoEnabled: input.enabled,
        previewVideoTitle: title.value,
        previewVideoPoster: poster.value,
        previewVideoDurationLabel: duration.value,
        previewVideoUpdatedAt: new Date(),
      },
      select: { slug: true, previewVideoEnabled: true },
    });

    revalidatePreview(saved.slug);

    return {
      ok: true,
      message: saved.previewVideoEnabled
        ? "Preview saved and enabled. The video is now live on this course page."
        : "Preview saved but disabled. Customers will not see it until you enable it.",
      ts: timestamp(),
    };
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    console.error("[academy-preview] preview_update_failed", { courseId, code });
    if (code === "P2025") {
      return {
        ok: false,
        message: "This course was changed or removed elsewhere. Refresh the page and try again.",
        ts: timestamp(),
      };
    }
    return {
      ok: false,
      message: "Could not save the preview. Refresh the page and try again.",
      ts: timestamp(),
    };
  }
}
