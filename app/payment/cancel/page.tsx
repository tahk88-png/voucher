'use client';

import { Suspense } from 'react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { XCircle } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const t = useTranslations('payment');
  const tNav = useTranslations('nav');

  const voucherId = searchParams.get('voucher_id');
  const eventId = searchParams.get('event_id');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <WarmCard padding="lg" className="w-full max-w-md bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F7C6B0]/40">
            <XCircle className="h-8 w-8 text-[#2D2721]" />
          </div>
          <h1 className="text-2xl font-semibold text-[#2D2721]">{t('cancelTitle')}</h1>
          <p className="text-sm text-[#6B5744] mt-1">{t('cancelDescription')}</p>
        </div>
        <div className="space-y-4 mt-6">
          <div className="rounded-2xl bg-[#FFF9ED] border border-[#E7DCC7] p-4 text-center">
            <p className="text-sm text-[#6B5744]">{t('noCharge')}</p>
          </div>

          <div className="flex flex-col gap-2">
            {voucherId && (
              <WarmButton asChild className="w-full">
                <Link href={`/v/${voucherId}`}>{t('tryAgain')}</Link>
              </WarmButton>
            )}
            {eventId && (
              <WarmButton asChild className="w-full">
                <Link href={`/e/${eventId}`}>{t('tryAgain')}</Link>
              </WarmButton>
            )}
            <WarmButton variant="outline" asChild className="w-full">
              <Link href="/app">{tNav('dashboard')}</Link>
            </WarmButton>
          </div>
        </div>
      </WarmCard>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <WarmCard padding="lg" className="w-full max-w-md bg-white">
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-[#6B5744]">Loading...</p>
            </div>
          </WarmCard>
        </div>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
}
