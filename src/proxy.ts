import { NextRequest, NextResponse } from "next/server";
import {
  delocalizePublicPath,
} from "@/lib/site-routes";

const locales = ["en", "fr"] as const;
type Locale = (typeof locales)[number];

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

const legacyRouteMap: Record<string, { path: string; hash?: string }> = {
  "/about": { path: "/about" },
  "/founder": { path: "/founder" },
  "/services": { path: "/services" },
  "/solutions": { path: "/services", hash: "solution-modules" },
  "/industries": { path: "/services", hash: "industry-focus" },
  "/portfolio": { path: "/about", hash: "portfolio-work" },
  "/demo-lab": { path: "/demo-lab" },
  "/courses": { path: "/courses" },
  "/courses/bonuses": { path: "/courses/bonuses" },
  "/courses/claim-bonus": { path: "/courses/claim-bonus" },
  "/courses/complete-digital-skills-pack": {
    path: "/courses/complete-digital-skills-pack",
  },
  "/courses/digital-marketing-online-business": {
    path: "/courses/digital-marketing-online-business",
  },
  "/courses/creative-design-content-creation": {
    path: "/courses/creative-design-content-creation",
  },
  "/courses/ai-tech-programming": {
    path: "/courses/ai-tech-programming",
  },
  "/courses/office-business-professional-skills": {
    path: "/courses/office-business-professional-skills",
  },
  "/courses/finance-market-education": {
    path: "/courses/finance-market-education",
  },
  "/courses/digital-skills-pack": {
    path: "/courses/complete-digital-skills-pack",
  },
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
  const preferred = acceptLanguage
    .split(",")
    .map((part) => {
      const [rawLanguage, ...parameters] = part.trim().split(";");
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const quality = qualityParameter ? Number.parseFloat(qualityParameter.trim().slice(2)) : 1;
      return { language: rawLanguage.trim().split("-")[0], quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((item) => item.language)
    .sort((left, right) => right.quality - left.quality)[0];
  if (preferred?.language === "fr") return "fr";

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
  // Editorial pages need independently crawlable English and French URLs for
  // reciprocal hreflang. Admin and writer workspaces are also real App Router
  // paths and must not be stripped to a neutral path that does not exist.
  if (
    segments.length >= 2 &&
    isLocale(segments[0]) &&
    ["blog", "admin", "writer"].includes(segments[1])
  ) {
    const response = NextResponse.next();
    response.cookies.set("techia-locale", segments[0], {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  if (segments.length > 0 && isLocale(segments[0])) {
    const locale = segments[0];
    const localizedRemainder = pathname.slice(`/${locale}`.length) || "/";
    // Migrate every indexed locale-prefixed URL to the language-neutral
    // canonical URL. French course aliases are converted to their stable
    // internal path before the redirect.
    const canonicalPath = delocalizePublicPath(locale, localizedRemainder);
    const url = request.nextUrl.clone();
    url.pathname = canonicalPath;
    const response = NextResponse.redirect(url, 308);
    response.cookies.set("techia-locale", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  const normalizedPath =
    pathname !== "/" && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  if (pathname !== normalizedPath) {
    const url = request.nextUrl.clone();
    url.pathname = normalizedPath;
    return NextResponse.redirect(url, 308);
  }

  const locale = getPreferredLocale(request);
  if (normalizedPath === "/blog" || normalizedPath.startsWith("/blog/")) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${normalizedPath}`;
    const response = NextResponse.redirect(url, 308);
    response.cookies.set("techia-locale", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  const mappedPath = legacyRouteMap[normalizedPath];
  if (
    mappedPath &&
    (mappedPath.path !== normalizedPath || Boolean(mappedPath.hash))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = mappedPath.path;
    url.hash = mappedPath.hash ?? "";
    return NextResponse.redirect(url, 308);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${normalizedPath === "/" ? "" : normalizedPath}`;
  const response = NextResponse.rewrite(url);
  // The rendered document varies by the saved language preference. Declaring
  // this prevents shared caches from treating both language versions as one.
  response.headers.set("Vary", "Cookie, Accept-Language");
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|client-portal|.*\\..*).*)"],
};
