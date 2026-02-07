import type { Metadata } from 'next';
import NextLink from 'next/link';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { routing } from '@/routing';
import LanguageSelector from '@/components/language-selector';
import { Link } from '@/routing';
import { WarmButton } from '@/components/warm-button';
import { getTranslations } from 'next-intl/server';
import { Gift } from 'lucide-react';
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
  params: { locale: string } | Promise<{ locale: string }>;
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
    title: SITE_NAME,
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
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  const p = await Promise.resolve(params);
  const locale = p?.locale;
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    redirect(`/${routing.defaultLocale}`);
  }
  setRequestLocale(locale);

  let messages;
  try {
    messages = await getMessages();
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('[LocaleLayout] getMessages failed:', err);
    }
    throw err;
  }

  const t = await getTranslations('nav');

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-[rgba(139,115,85,0.1)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <NextLink href="/" className="flex items-center gap-2">
                <span className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
                  <Gift className="h-6 w-6 text-white" />
                </span>
                <span className="text-xl font-bold text-[#2D2721]">GiftHub</span>
              </NextLink>

              <div className="flex items-center gap-3">
                <div className="hidden md:block">
                  <LanguageSelector />
                </div>
                <WarmButton asChild variant="ghost">
                  <Link href="/campaigns">{t('campaigns')}</Link>
                </WarmButton>
                <WarmButton asChild>
                  <Link href="/login">{t('login')}</Link>
                </WarmButton>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </NextIntlClientProvider>
  );
}
