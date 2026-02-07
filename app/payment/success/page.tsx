'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations('payment');
  const tNav = useTranslations('nav');

  const sessionId = searchParams.get('session_id');
  const voucherId = searchParams.get('voucher_id');
  const eventId = searchParams.get('event_id');

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/payment/verify?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          setIsLoading(false);
          if (!data.success) {
            router.push('/payment/error');
          }
        })
        .catch(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [sessionId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <WarmCard padding="lg" className="w-full max-w-md bg-white">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#E17B5C]" />
            <p className="text-sm text-[#6B5744]">{t('verifying')}</p>
          </div>
        </WarmCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <WarmCard padding="lg" className="w-full max-w-md bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#9DB5A5]/20">
            <CheckCircle className="h-8 w-8 text-[#2D2721]" />
          </div>
          <h1 className="text-2xl font-semibold text-[#2D2721]">{t('successTitle')}</h1>
          <p className="text-sm text-[#6B5744] mt-1">{t('successDescription')}</p>
        </div>
        <div className="space-y-4 mt-6">
          <div className="rounded-2xl bg-[#FFF9ED] border border-[#E7DCC7] p-4 text-center">
            <p className="text-sm text-[#6B5744] mb-1">{t('paymentProcessed')}</p>
            <p className="text-sm font-medium text-[#2D2721]">{t('receiptSent')}</p>
          </div>

          <div className="flex flex-col gap-2">
            {voucherId && (
              <WarmButton asChild className="w-full">
                <Link href={`/v/${voucherId}`}>{t('viewVoucher')}</Link>
              </WarmButton>
            )}
            {eventId && (
              <WarmButton asChild className="w-full">
                <Link href={`/app/tickets`}>{t('viewTickets')}</Link>
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

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <WarmCard padding="lg" className="w-full max-w-md bg-white">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#E17B5C]" />
              <p className="text-sm text-[#6B5744]">Loading...</p>
            </div>
          </WarmCard>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
