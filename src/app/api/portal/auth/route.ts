import { NextRequest, NextResponse } from "next/server";
import { validatePortalCredentials, signPortalToken, setPortalSessionCookie, setPortalLocaleCookie } from "@/lib/portal-auth";
import { sanitizeText } from "@/lib/sanitize";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: string; code?: string };
    const email = sanitizeText(body.email || "").toLowerCase();
    const code = sanitizeText(body.code || "").toUpperCase();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and access code are required." }, { status: 400 });
    }

    const result = await validatePortalCredentials(email, code);
    if (!result) {
      return NextResponse.json({ error: "Invalid email or access code." }, { status: 401 });
    }

    const token = await signPortalToken(result.session);
    const cookieOpts = setPortalSessionCookie(token);
    const localeCookieOpts = setPortalLocaleCookie(result.preferredLocale);

    const response = NextResponse.json({ success: true, clientName: result.session.clientName });

    // Clear legacy cookie path from older releases.
    response.cookies.set(cookieOpts.name, "", {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: "/client-portal",
      maxAge: 0,
    });

    response.cookies.set(cookieOpts.name, cookieOpts.value, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    // Set initial locale from client's DB preference
    response.cookies.set(localeCookieOpts.name, localeCookieOpts.value, {
      httpOnly: localeCookieOpts.httpOnly,
      secure: localeCookieOpts.secure,
      sameSite: localeCookieOpts.sameSite,
      path: localeCookieOpts.path,
      maxAge: localeCookieOpts.maxAge,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
