'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    showConfirm('Confirm this redemption? This will unlock credit for the referrer.', async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/redemptions/${redemptionId}/confirm`, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Failed to confirm redemption');
        }

        showSuccess('Redemption confirmed. Credit unlocked for the referrer.');
        router.refresh();
      } catch {
        showError('Failed to confirm redemption. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, { confirmLabel: 'Confirm' });
    return;
  };

  return (
    <WarmButton onClick={handleConfirm} disabled={isLoading}>
      {isLoading ? 'Confirming...' : 'Confirm Redemption'}
    </WarmButton>
  );
}
