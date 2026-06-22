'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { useTranslations } from 'next-intl';

export default function TicketRedeemPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const merchantSlug = params.slug as string;
  const eventId = params.id as string;
  const [qrToken, setQrToken] = useState('');
  const [ticketId, setTicketId] = useState(searchParams.get('ticket') || '');
  const [location, setLocation] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [ticketInfo, setTicketInfo] = useState<any>(null);
  const t = useTranslations();

  useEffect(() => {
    if (ticketId && !ticketInfo) {
      fetch(`/api/tickets/${ticketId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.id) {
            setTicketInfo(data);
            setQrToken(data.qrToken || '');
          }
        })
        .catch(console.error);
    }
  }, [ticketId, ticketInfo]);

  const handleQRScan = async () => {
    if (!qrToken) {
      showError(t('success.pleaseEnterQrToken'));
      return;
    }

    setIsRedeeming(true);
    try {
      const res = await fetch(`/api/tickets/qr/${qrToken}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ticket not found');
      }

      const ticket = await res.json();
      setTicketInfo(ticket);
      setTicketId(ticket.id);
    } catch (error) {
      showError(error instanceof Error ? error.message : t('success.failedToLookupTicket'));
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleRedeem = async () => {
    if (!ticketId) {
      showError(t('success.pleaseScanTicket'));
      return;
    }

    setIsRedeeming(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrToken: qrToken || undefined,
          location: location || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to redeem ticket');
      }

      const result = await res.json();
      showSuccess(t('success.ticketRedeemed', { ticketNumber: result.ticket.ticketNumber }));
      setTicketInfo(null);
      setQrToken('');
      setTicketId('');
      setLocation('');
    } catch (error) {
      showError(error instanceof Error ? error.message : t('success.failedToRedeemTicket'));
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4]">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Redeem ticket</h1>
          <p className="text-sm text-[var(--text-muted)]">Scan QR code or enter ticket number</p>
        </div>

        <WarmButton asChild variant="ghost" size="sm" className="w-fit">
          <Link href={`/merchant/${merchantSlug}/events/${eventId}`}>Back to event</Link>
        </WarmButton>

        <WarmCard padding="lg" className="bg-[var(--surface)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">Scan ticket</h2>
            <p className="text-sm text-[var(--text-muted)]">Enter QR token or ticket number</p>
          </div>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="qrToken">QR Token / Ticket Number</Label>
              <div className="flex gap-2">
                <Input
                  id="qrToken"
                  value={qrToken}
                  onChange={(e) => setQrToken(e.target.value)}
                  placeholder="Enter QR token or ticket number"
                  className="border-[var(--border)]"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleQRScan();
                    }
                  }}
                />
                <WarmButton onClick={handleQRScan} disabled={isRedeeming || !qrToken} size="sm">
                  Scan
                </WarmButton>
              </div>
            </div>

            {ticketInfo && (
              <div className="p-4 bg-[var(--bg)] rounded-2xl border border-[var(--border)] space-y-2">
                <p className="font-semibold text-[var(--text)]">Ticket found</p>
                <p className="text-sm text-[var(--text-muted)]">
                  <span className="text-[var(--text-faint)]">Number:</span> {ticketInfo.ticketNumber}
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  <span className="text-[var(--text-faint)]">Event:</span> {ticketInfo.event.name}
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  <span className="text-[var(--text-faint)]">Status:</span>{' '}
                  <span className="capitalize text-[var(--text)]">{ticketInfo.status}</span>
                </p>
                {ticketInfo.purchase?.attendeeName && (
                  <p className="text-sm text-[var(--text-muted)]">
                    <span className="text-[var(--text-faint)]">Attendee:</span>{' '}
                    {ticketInfo.purchase.attendeeName}
                  </p>
                )}
              </div>
            )}
          </div>
        </WarmCard>

        {ticketInfo && ticketInfo.status === 'sold' && (
          <WarmCard padding="lg" className="bg-[var(--surface)]">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text)]">Redeem ticket</h2>
              <p className="text-sm text-[var(--text-muted)]">Complete the redemption process</p>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="location">Location (optional)</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Main Entrance, Gate A"
                  className="border-[var(--border)]"
                />
              </div>
              <WarmButton onClick={handleRedeem} disabled={isRedeeming} className="w-full" size="lg">
                {isRedeeming ? 'Redeeming...' : 'Redeem ticket'}
              </WarmButton>
            </div>
          </WarmCard>
        )}

        {ticketInfo && ticketInfo.status !== 'sold' && (
          <WarmCard padding="lg" className="bg-[var(--surface)] text-center">
            <p className="text-sm text-[var(--text-muted)]">
              This ticket cannot be redeemed. Status: {ticketInfo.status}
            </p>
          </WarmCard>
        )}
      </div>
    </div>
  );
}
