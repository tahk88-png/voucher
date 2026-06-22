'use client';

import { useState } from 'react';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { formatCurrency } from '@/lib/utils';

interface EventPurchaseClientProps {
  event: {
    id: string;
    name: string;
    price: number;
    currency: string;
  };
  availableTickets: Array<{
    id: string;
    ticketNumber: string;
    status: string;
  }>;
  brandColors: {
    primary?: string;
    secondary?: string;
    background?: string;
  } | null;
}

export default function EventPurchaseClient({
  event,
  availableTickets,
  brandColors,
}: EventPurchaseClientProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    availableTickets.length > 0 ? availableTickets[0].id : null
  );
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const accentColor = brandColors?.primary || '#cc785c';

  const handlePurchase = async () => {
    if (!selectedTicketId) {
      showError('Please select a ticket');
      return;
    }

    setIsPurchasing(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicketId}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeName: attendeeName || undefined,
          attendeeEmail: attendeeEmail || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to purchase ticket');
      }

      const { url } = await res.json();
      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to purchase ticket');
      setIsPurchasing(false);
    }
  };

  return (
    <WarmCard padding="lg" className="bg-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#2D2721]">Purchase ticket</h2>
          <p className="text-sm text-[#6B5744]">Select a ticket and complete your purchase</p>
        </div>
        <div
          className="h-3 w-3 rounded-full mt-2"
          style={{ backgroundColor: accentColor }}
          aria-hidden="true"
        />
      </div>

      <div className="space-y-4 mt-6">
        {availableTickets.length > 0 ? (
          <>
            <div>
              <Label htmlFor="ticket">Select ticket</Label>
              <select
                id="ticket"
                value={selectedTicketId || ''}
                onChange={(e) => setSelectedTicketId(e.target.value)}
                aria-label="Select ticket"
                className="mt-1 w-full rounded-[14px] border border-[rgba(139,115,85,0.15)] bg-white px-3 py-2 text-sm text-[#2D2721] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/60"
              >
                {availableTickets.map((ticket) => (
                  <option key={ticket.id} value={ticket.id}>
                    {ticket.ticketNumber}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="attendeeName">Attendee name (optional)</Label>
              <Input
                id="attendeeName"
                value={attendeeName}
                onChange={(e) => setAttendeeName(e.target.value)}
                placeholder="Name of the person attending"
                className="mt-1 border-[rgba(139,115,85,0.15)]"
              />
            </div>

            <div>
              <Label htmlFor="attendeeEmail">Attendee email (optional)</Label>
              <Input
                id="attendeeEmail"
                type="email"
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
                placeholder="Email for ticket delivery"
                className="mt-1 border-[rgba(139,115,85,0.15)]"
              />
            </div>

            <div className="pt-4 border-t border-[rgba(139,115,85,0.15)]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-[#6B5744]">Total</span>
                <span className="text-2xl font-semibold text-[#2D2721]">
                  {formatCurrency(event.price, event.currency)}
                </span>
              </div>
              <WarmButton
                onClick={handlePurchase}
                disabled={isPurchasing || !selectedTicketId}
                className="w-full"
                size="lg"
              >
                {isPurchasing ? 'Processing...' : 'Purchase ticket'}
              </WarmButton>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-[#6B5744]">No tickets available at the moment.</p>
            <p className="text-sm text-[#8B7355] mt-2">
              Please check back later or contact the event organizer.
            </p>
          </div>
        )}
      </div>
    </WarmCard>
  );
}
