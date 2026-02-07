import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('errors');
  const tNav = await getTranslations('nav');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <WarmCard padding="lg" className="max-w-md w-full text-center bg-white">
        <h1 className="text-3xl font-semibold text-[#2D2721]">404</h1>
        <p className="text-sm text-[#6B5744] mt-2">{t('notFound')}</p>
        <div className="mt-4">
          <WarmButton asChild>
            <Link href="/">{tNav('home')}</Link>
          </WarmButton>
        </div>
      </WarmCard>
    </div>
  );
}
