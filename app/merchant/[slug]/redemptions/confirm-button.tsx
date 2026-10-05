'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { WarmButton } from '@/components/warm-button';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { showConfirm } from '@/lib/confirm-helpers';

export default function ConfirmRedemptionButton({
  redemptionId,
  merchantSlug,
}: {
  redemptionId: string;
  merchantSlug: string;
}) {
  const router = useRouter();
  const t = useTranslations('merchantStore.redemptions.confirm');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    showConfirm(t('prompt'), async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/redemptions/${redemptionId}/confirm`, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Failed to confirm redemption');
        }

        showSuccess(t('success'));
        router.refresh();
      } catch {
        showError(t('error'));
      } finally {
        setIsLoading(false);
      }
    }, { confirmLabel: t('confirmLabel') });
    return;
  };

  return (
    <WarmButton onClick={handleConfirm} disabled={isLoading}>
      {isLoading ? t('confirming') : t('button')}
    </WarmButton>
  );
}
