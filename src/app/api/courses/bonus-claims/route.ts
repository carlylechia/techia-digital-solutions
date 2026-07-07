import { NextResponse, type NextRequest } from "next/server";
import { sendCourseBonusClaimNotification } from "@/lib/email";
import { getPrisma } from "@/lib/prisma";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { courseBonusClaimSchema } from "@/lib/validation";
import {
  getCoursePackBonusClaimSummary,
  normalizeRequestedBonusIds,
  resolveClaimLocale,
} from "@/lib/courses/bonusClaims";

export async function POST(request: NextRequest) {
  try {
    const ip = requestIp(request.headers);
    const limit = checkRateLimit(`course-bonus-claim:${ip}`);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later.", code: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json(
        { error: "Database unavailable." },
        { status: 503 },
      );
    }

    const courseBonusClaimDelegate = (prisma as {
      courseBonusClaim?: { create: (typeof prisma.courseBonusClaim)["create"] };
    }).courseBonusClaim;

    if (!courseBonusClaimDelegate) {
      return NextResponse.json(
        {
          error:
            "Course bonus claims are not ready in the current server process. Restart the dev server and try again.",
          code: "stale_prisma_client",
        },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const raw = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      whatsapp: String(formData.get("whatsapp") || ""),
      coursePackId: String(formData.get("coursePackId") || ""),
      orderReference: String(formData.get("orderReference") || ""),
      purchaseDate: String(formData.get("purchaseDate") || ""),
      proofNotes: String(formData.get("proofNotes") || ""),
      preferredDelivery: String(formData.get("preferredDelivery") || "EMAIL"),
      requestedBonusIds: formData
        .getAll("requestedBonusIds")
        .map((value) => String(value)),
      sourcePage: String(formData.get("sourcePage") || ""),
      locale: String(formData.get("locale") || "en"),
      honeypot: String(formData.get("honeypot") || ""),
    };
    const proofFile = formData.get("proofFile");

    const parsed = courseBonusClaimSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            raw.locale === "fr"
              ? "Donnees invalides"
              : "Invalid payload",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    if (parsed.data.honeypot) {
      return NextResponse.json({ ok: true });
    }

    const locale = resolveClaimLocale(parsed.data.locale);
    const requestedBonusIds = normalizeRequestedBonusIds(
      parsed.data.coursePackId,
      parsed.data.requestedBonusIds,
    );
    const packSummary = getCoursePackBonusClaimSummary(
      locale,
      parsed.data.coursePackId,
    );

    if (!packSummary.deliverableBonusItems.length) {
      return NextResponse.json(
        { error: "This course pack does not have deliverable bonus files configured." },
        { status: 400 },
      );
    }

    let proofUpload:
      | {
          secure_url: string;
          public_id: string;
        }
      | undefined;
    let proofFileName: string | undefined;
    let proofFileType: string | undefined;
    let proofFileSize: number | undefined;

    if (proofFile instanceof File && proofFile.size > 0) {
      if (proofFile.size > 15 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Proof file is too large. Maximum size is 15MB." },
          { status: 400 },
        );
      }

      if (!isCloudinaryConfigured()) {
        return NextResponse.json(
          { error: "Proof uploads are not configured on this deployment yet." },
          { status: 503 },
        );
      }

      try {
        const uploaded = await uploadToCloudinary(
          proofFile,
          `courses/bonus-claims/${parsed.data.coursePackId}`,
          { forcePublic: true },
        );
        proofUpload = {
          secure_url: uploaded.secure_url,
          public_id: uploaded.public_id,
        };
        proofFileName = proofFile.name;
        proofFileType = proofFile.type || "application/octet-stream";
        proofFileSize = proofFile.size;
      } catch (error) {
        console.error("[course-bonus-claim] proof_upload_failed", error);
        return NextResponse.json(
          { error: "Could not upload your proof file. Please try again." },
          { status: 500 },
        );
      }
    }

    if (!proofUpload && !(parsed.data.proofNotes || "").trim()) {
      return NextResponse.json(
        {
          error:
            locale === "fr"
              ? "Ajoutez un fichier de preuve ou des notes de verification."
              : "Please add a proof file or verification notes.",
        },
        { status: 400 },
      );
    }

    const purchaseDate = parsed.data.purchaseDate
      ? new Date(parsed.data.purchaseDate)
      : null;

    const claim = await courseBonusClaimDelegate.create({
      data: {
        locale,
        name: sanitizeText(parsed.data.name) || parsed.data.name,
        email: parsed.data.email,
        whatsapp: sanitizeText(parsed.data.whatsapp) || null,
        coursePackId: parsed.data.coursePackId,
        coursePackTitle: packSummary.title,
        orderReference: sanitizeText(parsed.data.orderReference) || parsed.data.orderReference,
        purchaseDate:
          purchaseDate && !Number.isNaN(purchaseDate.getTime())
            ? purchaseDate
            : null,
        requestedBonusIds,
        proofNotes: sanitizeText(parsed.data.proofNotes) || null,
        proofUrl: proofUpload?.secure_url || null,
        proofPublicId: proofUpload?.public_id || null,
        proofFileName: proofFileName || null,
        proofFileType: proofFileType || null,
        proofFileSize: proofFileSize || null,
        preferredDelivery: parsed.data.preferredDelivery,
        sourcePage: sanitizeText(parsed.data.sourcePage) || null,
      },
    });

    sendCourseBonusClaimNotification({
      buyerName: claim.name,
      buyerEmail: claim.email,
      buyerWhatsapp: claim.whatsapp,
      coursePackTitle: claim.coursePackTitle,
      orderReference: claim.orderReference,
      requestedBonusTitles: packSummary.deliverableBonusItems
        .filter((item) => requestedBonusIds.includes(item.id))
        .map((item) => item.title),
      preferredDelivery: claim.preferredDelivery,
      proofNotes: claim.proofNotes,
      proofUrl: claim.proofUrl,
    }).catch((error) => {
      console.error("[course-bonus-claim] notification_email_failed", error);
    });

    return NextResponse.json({ ok: true, claimId: claim.id });
  } catch (error) {
    console.error("[course-bonus-claim] unexpected_error", error);
    return NextResponse.json(
      {
        error:
          "Unexpected error while submitting the claim. Please retry after restarting the dev server.",
        code: "course_bonus_claim_unexpected_error",
      },
      { status: 500 },
    );
  }
}
