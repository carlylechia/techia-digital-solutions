import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/session";
import { getPrisma } from "@/lib/prisma";
import { parseCloudinaryUrl, getCloudinaryPrivateDownloadUrl } from "@/lib/cloudinary";

/**
 * GET /api/admin/portal-proof?invoiceId={id}
 *
 * Secure proxy for proof-of-payment files.
 *
 * Flow:
 * 1. Verify the caller is an authenticated admin.
 * 2. Fetch the stored Cloudinary URL from the DB.
 * 3. Generate a short-lived Cloudinary signed download URL (bypasses any
 *    account/folder-level access restrictions — works for all Cloudinary plans).
 * 4. 302-redirect the admin's browser to that signed URL.
 *
 * The signed URL expires in 10 minutes — enough for the download to complete.
 * Cloudinary never serves the raw asset back through our server, keeping
 * bandwidth costs low while maintaining security.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin("clients.manage");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoiceId = request.nextUrl.searchParams.get("invoiceId");
  if (!invoiceId) {
    return NextResponse.json({ error: "Missing invoiceId parameter" }, { status: 400 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const invoice = await prisma.portalInvoice.findUnique({
    where: { id: invoiceId },
    select: {
      proofOfPaymentUrl: true,
      proofOfPaymentName: true,
    },
  });

  if (!invoice?.proofOfPaymentUrl) {
    return NextResponse.json({ error: "Proof of payment not found" }, { status: 404 });
  }

  // Parse the stored Cloudinary URL to extract publicId, format, resourceType.
  const parsed = parseCloudinaryUrl(invoice.proofOfPaymentUrl);

  if (!parsed) {
    return NextResponse.json({ error: "Proof storage is not configured securely" }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }

  // Generate a signed, time-limited download URL that bypasses Cloudinary
  // access restrictions regardless of the account/folder security settings.
  const signedUrl = await getCloudinaryPrivateDownloadUrl(
    parsed.publicId,
    parsed.format,
    parsed.resourceType,
  );

  if (!signedUrl) {
    return NextResponse.json({ error: "Proof storage is not configured securely" }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }

  const response = NextResponse.redirect(signedUrl, { status: 302 });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
