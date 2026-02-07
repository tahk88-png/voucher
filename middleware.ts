import createMiddleware from 'next-intl/middleware';
import { routing } from './routing';
import { type NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

// Auth is enforced in layouts/pages; auth() from lib/auth pulls nodemailer
// into Edge and causes "stream module" error, so we skip it here.
export default function middleware(req: NextRequest) {
  return intlMiddleware(req);
}

export const config = {
  // Match only internationalized pathnames. Exclude /app (post-login hub) — it lives at app/app/, not [locale]/app.
  matcher: ['/(et|en|es|fr|de|fi|sv|no|da|lv|lt|pl|uk)/:path*', '/merchant/:path*', '/admin/:path*'],
};
