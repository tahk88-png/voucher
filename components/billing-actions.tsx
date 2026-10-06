'use client';

import { WarmButton } from '@/components/warm-button';
import { showError } from '@/lib/toast-helpers';
import { useTranslations } from 'next-intl';

async function redirectTo(url: string) {
  window.location.href = url;
}

export function StartSubscriptionButton({
  slug,
  planTier = 'pro',
  label,
}: {
  slug: string;
  planTier?: 'starter' | 'pro' | 'scale';
  label?: string;
}) {
  const t = useTranslations('merchantDashboard.billing');
  return (
    <WarmButton
      onClick={async () => {
        try {
          const res = await fetch(`/api/merchant/${slug}/billing/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planTier }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || t('startFailed'));
          }
          await redirectTo(data.url);
        } catch (error) {
          showError(error instanceof Error ? error.message : t('startFailed'), t('errorTitle'));
        }
      }}
    >
      {label || t('subscribeTo', { plan: planTier.charAt(0).toUpperCase() + planTier.slice(1) })}
    </WarmButton>
  );
}

export function ManageBillingButton({ slug }: { slug: string }) {
  const t = useTranslations('merchantDashboard.billing');
  return (
    <WarmButton
      variant="outline"
      onClick={async () => {
        try {
          const res = await fetch(`/api/merchant/${slug}/billing/portal`, {
            method: 'POST',
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || t('portalFailed'));
          }
          await redirectTo(data.url);
        } catch (error) {
          showError(error instanceof Error ? error.message : t('portalFailed'), t('errorTitle'));
        }
      }}
    >
      {t('manageBilling')}
    </WarmButton>
  );
}
