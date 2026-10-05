'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingButton } from '@/components/ui/loading-button';
import { showSuccess, showError } from '@/lib/toast-helpers';
import { showConfirm } from '@/lib/confirm-helpers';
import { useTranslations } from 'next-intl';

export default function PublishVoucherButton({ voucherId }: { voucherId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('merchantVouchers.publish');
  const tCommon = useTranslations('common');

  const handlePublish = async () => {
    showConfirm(t('confirmMessage'), async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/vouchers/${voucherId}/publish`, {
          method: 'POST',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || t('failed'));
        }

        router.refresh();
        showSuccess(t('success'));
      } catch (error) {
        const message = error instanceof Error ? error.message : t('failed');
        showError(message);
        if (process.env.NODE_ENV === 'development') {
          console.error(error);
        }
      } finally {
        setIsLoading(false);
      }
    }, { title: tCommon('confirm'), confirmLabel: t('confirmLabel'), cancelLabel: tCommon('cancel') });
    return;
  };

  return (
    <LoadingButton onClick={handlePublish} loading={isLoading} loadingText={t('publishing')}>
      {t('button')}
    </LoadingButton>
  );
}
