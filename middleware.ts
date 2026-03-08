import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./routing";

const intlMiddleware = createMiddleware(routing);

// Routes that require authentication (cookie check only — full auth in pages/APIs)
const PROTECTED_PREFIXES = ["/app", "/merchant", "/admin", "/dashboard", "/settings"];
const AUTH_PAGES = ["/login", "/register", "/reset-password"];

function getSessionCookie(req: NextRequest): string | undefined {
  // NextAuth v5 cookie names
  return (
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value
  );
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API routes, static files, and Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const hasSession = !!getSessionCookie(req);

  // Redirect unauthenticated users away from protected routes
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages (already logged in)
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/app/entry", req.url));
  }

  // i18n middleware for locale-prefixed routes
  const isI18nRoute = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  if (isI18nRoute) {
    return intlMiddleware(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and api
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
