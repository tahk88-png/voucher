import type { Metadata } from 'next';
import { logger } from '@/lib/logger';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/routing';
import HubShell from '@/components/layout/hub-shell';
import {
  buildLocaleAlternates,
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  getLocalePath,
} from '@/lib/seo';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const p = await Promise.resolve(params);
  const locale = routing.locales.includes(p?.locale as (typeof routing.locales)[number])
    ? p.locale
    : routing.defaultLocale;

  let description = SITE_DESCRIPTION;
  try {
    const t = await getTranslations({ locale, namespace: 'landing' });
    description = t('description') || SITE_DESCRIPTION;
  } catch {
    description = SITE_DESCRIPTION;
  }

  const canonicalPath = getLocalePath(locale, '/');

  return {
    // absolute: the root layout's "%s | GiftHub" template would otherwise
    // render "GiftHub | GiftHub".
    title: { absolute: SITE_NAME },
    description,
    alternates: {
      canonical: canonicalPath,
      languages: buildLocaleAlternates('/'),
    },
    openGraph: {
      type: 'website',
      title: SITE_NAME,
      description,
      url: canonicalPath,
      locale,
      siteName: SITE_NAME,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_NAME,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const p = await Promise.resolve(params);
  const locale = p?.locale;
  // Any unknown top-level path (/foo, a missing /sw.js) lands in this segment.
  // It is a 404, not a redirect to the home page.
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);

  let messages;
  try {
    messages = await getMessages();
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('[LocaleLayout] getMessages failed', { error: err instanceof Error ? err.message : String(err) });
    }
    throw err;
  }

  return (
    <NextIntlClientProvider messages={messages}>
      {/* Same header (with the mobile menu) as every other public page. */}
      <HubShell>{children}</HubShell>
    </NextIntlClientProvider>
  );
}
