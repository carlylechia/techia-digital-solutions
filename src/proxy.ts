import { NextRequest, NextResponse } from "next/server";

const locales = ["en", "fr"] as const;
type Locale = (typeof locales)[number];

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

const legacyRouteMap: Record<string, { path: string; hash?: string }> = {
  "/": { path: "" },
  "/about": { path: "/about" },
  "/founder": { path: "/founder" },
  "/services": { path: "/services" },
  "/solutions": { path: "/services", hash: "solution-modules" },
  "/industries": { path: "/services", hash: "industry-focus" },
  "/portfolio": { path: "/about", hash: "portfolio-work" },
  "/demo-lab": { path: "/demo-lab" },
  "/pricing": { path: "/pricing" },
  "/blog": { path: "/blog" },
  "/contact": { path: "/contact" },
  "/start-project": { path: "/start-project" },
  "/privacy": { path: "/privacy" },
  "/terms": { path: "/terms" },
  "/cookies": { path: "/cookies" },
  "/work": { path: "/about", hash: "portfolio-work" },
  "/request-quote": { path: "/start-project" },
  "/resources": { path: "/blog" },
  "/process": { path: "/process" },
};

function getPreferredLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get("techia-locale")?.value;
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;

  const acceptLanguage =
    request.headers.get("accept-language")?.toLowerCase() || "";
  if (acceptLanguage.includes("fr")) return "fr";

  return "en";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/client-portal") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/og") ||
    pathname === "/manifest.webmanifest" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    return NextResponse.next();
  }

  const normalizedPath =
    pathname !== "/" && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  const mappedPath = legacyRouteMap[normalizedPath];

  if (mappedPath === undefined) {
    return NextResponse.next();
  }

  const locale = getPreferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${mappedPath.path}`;
  url.hash = mappedPath.hash ?? "";

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|client-portal|.*\\..*).*)"],
};
