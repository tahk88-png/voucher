'use client';

import Image from 'next/image';
import { WarmCard } from '@/components/warm-card';

interface TicketViewClientProps {
  ticket: {
    id: string;
    ticketNumber: string;
    qrToken: string;
    status: string;
    usedAt: Date | null;
    event: {
      name: string;
      eventDate: Date;
      location?: string | null;
    };
    purchase?: {
      attendeeName?: string | null;
      attendeeEmail?: string | null;
    } | null;
  };
  qrCodeDataUrl: string;
  brandColors: {
    primary?: string;
    secondary?: string;
    background?: string;
  } | null;
  isMerchantStaff: boolean;
}

export default function TicketViewClient({
  ticket,
  qrCodeDataUrl,
  brandColors,
  isMerchantStaff,
}: TicketViewClientProps) {
  const canRedeem = ticket.status === 'sold' && !ticket.usedAt && isMerchantStaff;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <WarmCard padding="lg" className="bg-white">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#2D2721]">QR code</h2>
            <p className="text-sm text-[#6B5744]">Show this QR code at the event entrance</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            {qrCodeDataUrl ? (
              <div className="p-4 bg-white rounded-2xl border border-[rgba(139,115,85,0.15)] shadow-warm-sm">
                <Image
                  src={qrCodeDataUrl}
                  alt="Ticket QR code"
                  width={200}
                  height={200}
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <p className="text-sm text-[#8B7355]">QR code not available</p>
            )}
            <p className="text-sm text-[#6B5744] text-center">
              Ticket number: <strong className="text-[#2D2721]">{ticket.ticketNumber}</strong>
            </p>
            {ticket.status === 'used' && (
              <p className="text-sm font-semibold text-[#2D2721]">Ticket has been used</p>
            )}
          </div>
        </div>
      </WarmCard>

      <WarmCard padding="lg" className="bg-white">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#2D2721]">Ticket details</h2>
            <p className="text-sm text-[#6B5744]">Important information about your ticket</p>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">Event</p>
              <p className="text-lg font-semibold text-[#2D2721]">{ticket.event.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">Date & Time</p>
              <p className="text-lg font-semibold text-[#2D2721]">
                {new Date(ticket.event.eventDate).toLocaleString()}
              </p>
            </div>
            {ticket.event.location && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">Location</p>
                <p className="text-lg font-semibold text-[#2D2721]">{ticket.event.location}</p>
              </div>
            )}
            {ticket.purchase?.attendeeName && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">Attendee</p>
                <p className="text-lg font-semibold text-[#2D2721]">{ticket.purchase.attendeeName}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">Status</p>
              <p className="text-lg font-semibold capitalize text-[#2D2721]">{ticket.status}</p>
            </div>
            {ticket.usedAt && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">Used At</p>
                <p className="text-lg font-semibold text-[#2D2721]">
                  {new Date(ticket.usedAt).toLocaleString()}
                </p>
              </div>
            )}
            {canRedeem && (
              <div className="pt-4 border-t border-[rgba(139,115,85,0.15)]">
                <p className="text-sm text-[#6B5744]">
                  As merchant staff, you can redeem this ticket at the event.
                </p>
              </div>
            )}
          </div>
        </div>
      </WarmCard>
    </div>
  );
}
