import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { safeParseJson } from '@/lib/utils';
import { WarmCard } from '@/components/warm-card';
import TicketViewClient from './ticket-view-client';
import QRCode from 'qrcode';

async function generateQRCode(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text);
  } catch (err) {
    console.error('QR code generation error:', err);
    return '';
  }
}

export default async function TicketPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      event: {
        include: { merchant: true },
      },
      purchase: {
        include: { user: true },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  // Check if user owns the ticket or is merchant staff
  const isOwner = ticket.purchase?.userId === session.user.id;
  const isMerchantStaff = await prisma.merchantMember.findFirst({
    where: {
      merchantId: ticket.merchantId,
      userId: session.user.id,
      role: { in: ['merchant_admin', 'merchant_staff'] },
    },
  });

  if (!isOwner && !isMerchantStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4]">
        <WarmCard padding="lg" className="max-w-md text-center bg-white">
          <p className="text-sm text-[#6B5744]">
            You don&apos;t have permission to view this ticket.
          </p>
        </WarmCard>
      </div>
    );
  }

  const qrCodeDataUrl = await generateQRCode(ticket.qrToken);
  const brandColors = safeParseJson(ticket.event.merchant.brandColorsJson) as {
    primary?: string;
    secondary?: string;
    background?: string;
  } | null;

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4]">
      <div className="container mx-auto max-w-4xl space-y-6">
        <WarmCard padding="lg" className="bg-white">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">
              Ticket #{ticket.ticketNumber}
            </p>
            <h1 className="text-2xl font-semibold text-[#2D2721]">{ticket.event.name}</h1>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mt-6 text-sm">
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
                {ticket.event.locationAddress && (
                  <p className="text-sm text-[#6B5744]">{ticket.event.locationAddress}</p>
                )}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">Status</p>
              <p className="text-lg font-semibold capitalize text-[#2D2721]">{ticket.status}</p>
            </div>
            {ticket.purchase?.attendeeName && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">Attendee</p>
                <p className="text-lg font-semibold text-[#2D2721]">{ticket.purchase.attendeeName}</p>
              </div>
            )}
            {ticket.usedAt && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">Used At</p>
                <p className="text-lg font-semibold text-[#2D2721]">
                  {new Date(ticket.usedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </WarmCard>

        <TicketViewClient
          ticket={ticket}
          qrCodeDataUrl={qrCodeDataUrl}
          brandColors={brandColors}
          isMerchantStaff={!!isMerchantStaff}
        />
      </div>
    </div>
  );
}
