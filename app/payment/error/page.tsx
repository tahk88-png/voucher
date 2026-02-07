'use client';

import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function PaymentErrorPage() {
  const t = useTranslations('payment');
  const tNav = useTranslations('nav');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <WarmCard padding="lg" className="w-full max-w-md bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFE5B4]">
            <AlertCircle className="h-8 w-8 text-[#2D2721]" />
          </div>
          <h1 className="text-2xl font-semibold text-[#2D2721]">{t('errorTitle')}</h1>
          <p className="text-sm text-[#6B5744] mt-1">{t('errorDescription')}</p>
        </div>
        <div className="space-y-4 mt-6">
          <div className="rounded-2xl bg-[#FFF9ED] border border-[#E7DCC7] p-4 text-center">
            <p className="text-sm text-[#6B5744]">{t('errorMessage')}</p>
          </div>

          <div className="flex flex-col gap-2">
            <WarmButton variant="outline" asChild className="w-full">
              <Link href="/app">{tNav('dashboard')}</Link>
            </WarmButton>
            <WarmButton variant="outline" asChild className="w-full">
              <Link href="/">{tNav('home')}</Link>
            </WarmButton>
          </div>
        </div>
      </WarmCard>
    </div>
  );
}
