import { NextResponse } from "next/server";
import { clearPortalSessionCookie } from "@/lib/portal-auth";

export async function POST() {
  const cookieOpts = clearPortalSessionCookie();
  const response = NextResponse.json({ success: true });

  response.cookies.set(cookieOpts.name, cookieOpts.value, {
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: "/client-portal",
    maxAge: cookieOpts.maxAge,
  });

  response.cookies.set(cookieOpts.name, cookieOpts.value, {
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: cookieOpts.path,
    maxAge: cookieOpts.maxAge,
  });
  return response;
}
