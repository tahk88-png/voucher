'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';

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
    if (!confirm('Confirm this redemption? This will unlock credit for the referrer.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/redemptions/${redemptionId}/confirm`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to confirm redemption');
      }

      router.refresh();
    } catch (error) {
      alert('Failed to confirm redemption');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WarmButton onClick={handleConfirm} disabled={isLoading}>
      {isLoading ? 'Confirming...' : 'Confirm Redemption'}
    </WarmButton>
  );
}
