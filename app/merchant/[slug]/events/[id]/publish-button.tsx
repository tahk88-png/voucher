'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { showSuccess, showError } from '@/lib/toast-helpers';
import { showConfirm } from '@/lib/confirm-helpers';
import { useTranslations } from 'next-intl';

interface PublishEventButtonProps {
  eventId: string;
  currentStatus: string;
}

export default function PublishEventButton({
  eventId,
  currentStatus,
}: PublishEventButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('merchantEvents.publish');

  const handlePublish = async () => {
    showConfirm(t('confirm'), async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/events/${eventId}/publish`, {
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
    }, { confirmLabel: t('confirmLabel') });
    return;
  };

  if (currentStatus === 'published') {
    return (
      <WarmButton variant="outline" disabled>
        {t('published')}
      </WarmButton>
    );
  }

  if (currentStatus === 'cancelled' || currentStatus === 'ended') {
    return (
      <WarmButton variant="outline" disabled>
        {t('cannotPublish')}
      </WarmButton>
    );
  }

  return (
    <WarmButton onClick={handlePublish} disabled={isLoading}>
      {isLoading ? t('publishing') : t('button')}
    </WarmButton>
  );
}
