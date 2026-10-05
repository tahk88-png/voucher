'use client';

import Image from 'next/image';
import { WarmCard } from '@/components/warm-card';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('purchase');
  const canRedeem = ticket.status === 'sold' && !ticket.usedAt && isMerchantStaff;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <WarmCard padding="lg" className="bg-white">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#2D2721]">{t('ticket.qrTitle')}</h2>
            <p className="text-sm text-[#6B5744]">{t('ticket.qrDescription')}</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            {qrCodeDataUrl ? (
              <div className="p-4 bg-white rounded-2xl border border-[rgba(139,115,85,0.15)] shadow-warm-sm">
                <Image
                  src={qrCodeDataUrl}
                  alt={t('ticket.qrAlt')}
                  width={200}
                  height={200}
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <p className="text-sm text-[#8B7355]">{t('ticket.qrUnavailable')}</p>
            )}
            <p className="text-sm text-[#6B5744] text-center">
              {t.rich('ticket.ticketNumber', {
                number: ticket.ticketNumber,
                strong: (chunks) => <strong className="text-[#2D2721]">{chunks}</strong>,
              })}
            </p>
            {ticket.status === 'used' && (
              <p className="text-sm font-semibold text-[#2D2721]">{t('ticket.used')}</p>
            )}
          </div>
        </div>
      </WarmCard>

      <WarmCard padding="lg" className="bg-white">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#2D2721]">{t('ticket.detailsTitle')}</h2>
            <p className="text-sm text-[#6B5744]">{t('ticket.detailsDescription')}</p>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">{t('fields.event')}</p>
              <p className="text-lg font-semibold text-[#2D2721]">{ticket.event.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">{t('fields.dateTime')}</p>
              <p className="text-lg font-semibold text-[#2D2721]">
                {new Date(ticket.event.eventDate).toLocaleString()}
              </p>
            </div>
            {ticket.event.location && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">{t('fields.location')}</p>
                <p className="text-lg font-semibold text-[#2D2721]">{ticket.event.location}</p>
              </div>
            )}
            {ticket.purchase?.attendeeName && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">{t('fields.attendee')}</p>
                <p className="text-lg font-semibold text-[#2D2721]">{ticket.purchase.attendeeName}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">{t('fields.status')}</p>
              <p className="text-lg font-semibold capitalize text-[#2D2721]">{t.has(`ticketStatus.${ticket.status}`) ? t(`ticketStatus.${ticket.status}`) : ticket.status}</p>
            </div>
            {ticket.usedAt && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">{t('fields.usedAt')}</p>
                <p className="text-lg font-semibold text-[#2D2721]">
                  {new Date(ticket.usedAt).toLocaleString()}
                </p>
              </div>
            )}
            {canRedeem && (
              <div className="pt-4 border-t border-[rgba(139,115,85,0.15)]">
                <p className="text-sm text-[#6B5744]">
                  {t('ticket.staffCanRedeem')}
                </p>
              </div>
            )}
          </div>
        </div>
      </WarmCard>
    </div>
  );
}
