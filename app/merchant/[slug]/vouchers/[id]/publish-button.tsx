'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingButton } from '@/components/ui/loading-button';
import { showSuccess, showError } from '@/lib/toast-helpers';

export default function PublishVoucherButton({ voucherId }: { voucherId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePublish = async () => {
    if (!confirm('Publish this voucher? It will be visible to the public.')) {
      return;
    }

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
  };

  return (
    <LoadingButton onClick={handlePublish} loading={isLoading} loadingText="Publishing...">
      Publish Voucher
    </LoadingButton>
  );
}
