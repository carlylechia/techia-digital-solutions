import { NextResponse } from "next/server";
import { publicBonusDownloadsEnabled } from "@/lib/courses/chariowLinks";
import { readBuyerBonusResource } from "@/lib/courses/bonusResources";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ bonusId: string }>;
  },
) {
  if (!publicBonusDownloadsEnabled()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { bonusId } = await params;
  const resource = await readBuyerBonusResource(bonusId);

  if (!resource) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(resource.content, {
    status: 200,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="${resource.filename}"`,
      "cache-control": "public, max-age=3600",
    },
  });
}
