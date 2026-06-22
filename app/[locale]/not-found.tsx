import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { getTranslations } from 'next-intl/server';

/**
 * Locale-scoped 404. Lives inside the [locale] segment so it renders within
 * the locale layout (NextIntlClientProvider, request locale set) and the
 * copy + "home" link are translated for the active locale, rather than
 * falling through to the root app/not-found.tsx with default-locale context.
 */
export default async function LocaleNotFound() {
  const t = await getTranslations('errors');
  const tNav = await getTranslations('nav');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <WarmCard padding="lg" className="max-w-md w-full text-center bg-[var(--surface)]">
        <h1 className="text-3xl font-semibold text-[var(--text)]">404</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">{t('notFound')}</p>
        <div className="mt-4">
          <WarmButton asChild>
            <Link href="/">{tNav('home')}</Link>
          </WarmButton>
        </div>
      </WarmCard>
    </div>
  );
}
