import { type NextRequest } from "next/server"
import createMiddleware from "next-intl/middleware"
import { routing } from "./routing"

const intlMiddleware = createMiddleware(routing)

// Auth is enforced in layouts/pages; auth() from lib/auth pulls nodemailer
// into Edge and causes a "stream module" error, so we skip auth checks here.
export default function middleware(req: NextRequest) {
  return intlMiddleware(req)
}

export const config = {
  // Match only i18n pathnames. /app stays unprefixed and uses cookie locale.
  matcher: ["/(en|et|es|fr|de|fi|sv|no|da|lv|lt|pl|uk|it|ru)/:path*", "/merchant/:path*", "/admin/:path*"],
}
