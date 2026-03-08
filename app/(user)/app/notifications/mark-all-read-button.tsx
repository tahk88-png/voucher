'use client';

import { useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';

export function MarkAllReadButton({ label }: { label: string }) {
  const router = useRouter();

  async function handleClick() {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });
    router.refresh();
  }

  return (
    <WarmButton type="button" variant="outline" size="sm" onClick={handleClick}>
      {label}
    </WarmButton>
  );
}
