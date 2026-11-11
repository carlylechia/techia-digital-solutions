import { NextRequest, NextResponse } from "next/server";
import { processChariowWebhook } from "@/lib/payments/fulfillment";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const result = await processChariowWebhook({
    rawBody,
    headers: request.headers,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message },
      { status: result.status || 400 },
    );
  }
  return NextResponse.json({ ok: true, message: result.message });
}
