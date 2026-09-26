'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { showError } from '@/lib/toast-helpers';

export function MarkAllReadButton({
  label,
  errorLabel,
  disabled = false,
}: {
  label: string;
  errorLabel: string;
  /** True when there is nothing unread. */
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.refresh();
    } catch (error) {
      console.error('Mark all read failed', error);
      showError(errorLabel);
    } finally {
      setPending(false);
    }
  }

  return (
    <WarmButton type="button" variant="outline" size="sm" onClick={handleClick} disabled={disabled} isLoading={pending}>
      {label}
    </WarmButton>
  );
}
