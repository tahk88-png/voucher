import { routing } from '@/routing';

export const SITE_NAME = 'Vouchr';
export const SITE_TAGLINE = 'Pay for results, not reach.';
export const SITE_DESCRIPTION =
  'Pay for results, not reach. Merchant-owned referral infrastructure: branded vouchers and store credit.';
export const DEFAULT_OG_IMAGE = '/opengraph-image';

export function getBaseUrl(): URL {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (envUrl) {
    const normalized = envUrl.startsWith('http') ? envUrl : `https://${envUrl}`;
    return new URL(normalized);
  }
  return new URL('http://localhost:3000');
}

export function getLocalePath(locale: string, pathname: string): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  if (normalized === '/') {
    return prefix || '/';
  }
  return `${prefix}${normalized}`;
}

export function buildLocaleAlternates(pathname: string): Record<string, string> {
  return Object.fromEntries(
    routing.locales.map((locale) => [locale, getLocalePath(locale, pathname)])
  );
}

export function toAbsoluteUrl(pathname: string): string {
  return new URL(pathname, getBaseUrl()).toString();
}
