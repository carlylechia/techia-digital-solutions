import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { publishDueScheduledPosts } from "@/lib/blog/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") || "";
  if (!secret || !header.startsWith("Bearer ")) return false;
  const provided = header.slice("Bearer ".length);
  const expected = Buffer.from(secret);
  const actual = Buffer.from(provided);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: "Scheduled publishing is not configured." }, { status: 503 });
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await publishDueScheduledPosts();
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("blog_scheduled_publish_cron_failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Scheduled publishing failed." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
