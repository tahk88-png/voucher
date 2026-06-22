'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showSuccess } from '@/lib/toast-helpers';

interface GenerateTicketsButtonProps {
  eventId: string;
  merchantSlug: string;
  event: {
    name: string;
    maxCapacity: number;
    currentTickets: number;
  };
}

export default function GenerateTicketsButton({
  eventId,
  merchantSlug,
  event,
}: GenerateTicketsButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [count, setCount] = useState('1');

  const handleGenerate = async () => {
    if (!count || parseInt(count) < 1 || parseInt(count) > 1000) {
      showError('Please enter a number between 1 and 1000');
      return;
    }

    const maxCanGenerate = event.maxCapacity - event.currentTickets;
    if (parseInt(count) > maxCanGenerate) {
      showError(`Cannot generate ${count} tickets. Maximum available: ${maxCanGenerate}`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/generate-tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: parseInt(count),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate tickets');
      }

      const result = await res.json();
      showSuccess(`Generated ${result.count} tickets successfully!`);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to generate tickets');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <WarmButton onClick={() => setIsOpen(true)} size="sm">
        Generate Tickets
      </WarmButton>
    );
  }

  const maxCanGenerate = event.maxCapacity - event.currentTickets;

  return (
    <WarmCard
      padding="lg"
      className="absolute z-10 w-full max-w-sm right-0 top-full mt-2 bg-[var(--surface)] border border-[var(--border)] shadow-warm"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[var(--text)]">Generate tickets</h3>
        <p className="text-xs text-[var(--text-muted)]">Create tickets for this event</p>
      </div>
      <div className="space-y-4 mt-4">
        <div>
          <Label htmlFor="count">Number of tickets (max: {maxCanGenerate})</Label>
          <Input
            id="count"
            type="number"
            min="1"
            max={maxCanGenerate}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            required
            className="mt-1 border-[var(--border)]"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <WarmButton onClick={() => setIsOpen(false)} variant="outline" size="sm">
            Cancel
          </WarmButton>
          <WarmButton onClick={handleGenerate} disabled={isLoading} size="sm">
            {isLoading ? 'Generating...' : 'Generate'}
          </WarmButton>
        </div>
      </div>
    </WarmCard>
  );
}
