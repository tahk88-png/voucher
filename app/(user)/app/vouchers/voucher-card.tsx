'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Badge } from '@/components/ui/badge';
import { Store, Clock, QrCode, X } from 'lucide-react';

type PurchaseCardProps = {
  id: string;
  voucherId: string | null;
  amount: number;
  currency: string;
  validTo: Date | null;
  displayStatus: 'active' | 'expired' | 'used';
  merchantName: string;
  title: string;
  description: string | null;
  statusLabel: string;
  statusVariant: 'success' | 'muted' | 'secondary';
  paidLabel: string;
  freeLabel: string;
  formattedAmount: string;
  formattedDate: string | null;
};

export function VoucherCard({
  voucherId,
  displayStatus,
  merchantName,
  title,
  description,
  statusLabel,
  statusVariant,
  formattedAmount,
  formattedDate,
  freeLabel,
  amount,
}: PurchaseCardProps) {
  const [showQr, setShowQr] = useState(false);
  const isActive = displayStatus === 'active';
  const isExpired = displayStatus === 'expired';

  const qrValue = voucherId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/app/voucher/${voucherId}` : '';

  return (
    <>
      <WarmCard
        padding="none"
        className={`overflow-hidden transition-all duration-200 hover:shadow-warm-lg shadow-warm border border-[var(--border)] ${isExpired ? 'opacity-60' : ''}`}
      >
        <Link href={voucherId ? `/app/voucher/${voucherId}` : '#'}>
          <div className="relative px-4 pt-4 pb-3 bg-gradient-to-br from-[var(--bg-2)] to-[#FFE5B4]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="text-sm font-medium text-[var(--text)]">{merchantName}</span>
              </div>
              <Badge variant={statusVariant} className="shrink-0 text-xs font-medium">
                {statusLabel}
              </Badge>
            </div>
          </div>

          <div className="p-4 space-y-2">
            <h3 className="text-base font-semibold text-[var(--text)] leading-tight">{title}</h3>
            {description && (
              <p className="text-sm text-[var(--text-muted)] line-clamp-2">{description}</p>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-faint)]">
                {amount > 0 ? formattedAmount : freeLabel}
              </span>
              {formattedDate && (
                <span className="flex items-center gap-1 text-xs text-[var(--text-faint)]">
                  <Clock className="h-3 w-3" />
                  {formattedDate}
                </span>
              )}
            </div>
          </div>
        </Link>

        {isActive && voucherId && (
          <div className="px-4 pb-4">
            <WarmButton
              size="sm"
              variant="outline"
              className="w-full text-xs gap-1.5"
              onClick={(e) => { e.preventDefault(); setShowQr(true); }}
            >
              <QrCode className="h-3.5 w-3.5" />
              Show QR code
            </WarmButton>
          </div>
        )}
      </WarmCard>

      {/* QR modal */}
      {showQr && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQr(false)}
        >
          <div
            className="bg-white rounded-[var(--r-xl)] p-6 max-w-xs w-full flex flex-col items-center gap-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full">
              <h3 className="font-semibold text-[var(--text)]">{title}</h3>
              <button
                onClick={() => setShowQr(false)}
                aria-label="Close"
                className="p-1 rounded-full hover:bg-[var(--surface-dim)] transition-colors"
              >
                <X className="h-4 w-4 text-[var(--text-muted)]" />
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)] text-center">{merchantName}</p>
            <div className="p-3 bg-white border border-[var(--border)] rounded-xl">
              <QRCodeSVG
                value={voucherId!}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-[var(--text-faint)] text-center break-all font-mono">
              {voucherId}
            </p>
            <p className="text-xs text-[var(--text-muted)] text-center">
              Show this QR code to the merchant to redeem in-store.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
