import type { Metadata } from 'next';
import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { getTranslations } from 'next-intl/server';
import HubShell from '@/components/layout/hub-shell';

// Rendered under the root title template: "Page not found | GiftHub".
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('site.notFound');
  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function NotFound() {
  const t = await getTranslations('errors');
  const tNav = await getTranslations('nav');

  return (
    <HubShell>
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <WarmCard padding="lg" className="max-w-md w-full text-center bg-[var(--surface)]">
          <h1 className="text-3xl font-semibold text-[var(--text)]">404</h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">{t('notFound')}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <WarmButton asChild>
              <Link href="/">{tNav('home')}</Link>
            </WarmButton>
            <WarmButton asChild variant="secondary">
              <Link href="/campaigns">{tNav('campaigns')}</Link>
            </WarmButton>
          </div>
        </WarmCard>
      </div>
    </HubShell>
  );
}
