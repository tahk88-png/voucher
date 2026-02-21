'use client';

import { WarmButton } from '@/components/warm-button';
import { showError } from '@/lib/toast-helpers';

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
            throw new Error(data.error || 'Failed to start subscription');
          }
          await redirectTo(data.url);
        } catch (error) {
          showError(error instanceof Error ? error.message : 'Failed to start subscription');
        }
      }}
    >
      {label || `Subscribe to ${planTier.charAt(0).toUpperCase() + planTier.slice(1)}`}
    </WarmButton>
  );
}

export function ManageBillingButton({ slug }: { slug: string }) {
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
            throw new Error(data.error || 'Failed to open billing portal');
          }
          await redirectTo(data.url);
        } catch (error) {
          showError(error instanceof Error ? error.message : 'Failed to open billing portal');
        }
      }}
    >
      Manage billing
    </WarmButton>
  );
}
