'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { showSuccess, showError } from '@/lib/toast-helpers';

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

  const handlePublish = async () => {
    if (!confirm('Publish this event? It will be visible to the public and tickets can be purchased.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/publish`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish event');
      }

      router.refresh();
      showSuccess('Event published successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish event';
      showError(message);
      if (process.env.NODE_ENV === 'development') {
        console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (currentStatus === 'published') {
    return (
      <WarmButton variant="outline" disabled>
        Published
      </WarmButton>
    );
  }

  if (currentStatus === 'cancelled' || currentStatus === 'ended') {
    return (
      <WarmButton variant="outline" disabled>
        Cannot Publish
      </WarmButton>
    );
  }

  return (
    <WarmButton onClick={handlePublish} disabled={isLoading}>
      {isLoading ? 'Publishing...' : 'Publish Event'}
    </WarmButton>
  );
}
