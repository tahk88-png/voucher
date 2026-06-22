'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingButton } from '@/components/ui/loading-button';
import { showSuccess, showError } from '@/lib/toast-helpers';
import { showConfirm } from '@/lib/confirm-helpers';

export default function PublishVoucherButton({ voucherId }: { voucherId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePublish = async () => {
    showConfirm('Publish this voucher? It will be visible to the public.', async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/vouchers/${voucherId}/publish`, {
          method: 'POST',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to publish voucher');
        }

        router.refresh();
        showSuccess('Voucher published successfully!');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to publish voucher';
        showError(message);
        if (process.env.NODE_ENV === 'development') {
          console.error(error);
        }
      } finally {
        setIsLoading(false);
      }
    }, { confirmLabel: 'Publish' });
    return;
  };

  return (
    <LoadingButton onClick={handlePublish} loading={isLoading} loadingText="Publishing...">
      Publish Voucher
    </LoadingButton>
  );
}
