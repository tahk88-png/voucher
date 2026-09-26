'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { apiErrorMessage } from '@/lib/api-error-message';
import { formatPrice } from '@/lib/currency-constants';
import { normalizeCurrency } from '@/lib/money-input';
import { formatDisplayDate } from '@/lib/voucher-display';

interface GenerateVouchersButtonProps {
  campaignId: string;
  merchantSlug: string;
  campaign: {
    name: string;
    startDate: string;
    endDate: string;
    price: number | null;
    merchant?: { defaultCurrency: string };
  };
}

export default function GenerateVouchersButton({
  campaignId,
  merchantSlug,
  campaign,
}: GenerateVouchersButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [count, setCount] = useState('1');
  const currency = normalizeCurrency(campaign.merchant?.defaultCurrency);
  const hasPrice = campaign.price !== null && campaign.price > 0;
  const valueLabel = hasPrice ? formatPrice(campaign.price as number, currency, 'en-GB') : null;

  const handleGenerate = async () => {
    if (!/^\d+$/.test(count) || parseInt(count, 10) < 1 || parseInt(count, 10) > 100) {
      showError('Please enter a whole number between 1 and 100');
      return;
    }
    if (!hasPrice) {
      showError('Set a price on this campaign first. Generated vouchers are worth the campaign price.');
      return;
    }

    setIsLoading(true);
    try {
      // Generate vouchers with campaign defaults
      const res = await fetch(`/api/campaigns/${campaignId}/generate-vouchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: parseInt(count, 10),
          voucherData: {
            type: 'fixed_amount',
            value: campaign.price,
            currency,
            validFrom: campaign.startDate,
            validTo: campaign.endDate,
            codePrefix: campaign.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || undefined,
            designJson: { headline: campaign.name },
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(apiErrorMessage(error, 'Failed to generate vouchers'));
      }

      const result = await res.json();
      const n = Number(result.count) || 0;
      showSuccess(
        `Generated ${n} draft ${n === 1 ? 'voucher' : 'vouchers'}. Publish ${n === 1 ? 'it' : 'them'} from the voucher page when you're ready.`,
      );
      setIsOpen(false);
      router.refresh(); // Refresh to show new vouchers
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to generate vouchers');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <WarmButton onClick={() => setIsOpen(true)} size="sm">
        Generate Vouchers
      </WarmButton>
    );
  }

  return (
    <WarmCard
      padding="lg"
      className="absolute z-10 w-[min(24rem,calc(100vw-2rem))] right-0 top-full mt-2 bg-[var(--surface)] border border-[var(--border)] shadow-warm"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[var(--text)]">Generate vouchers</h3>
        <p className="text-xs text-[var(--text-muted)]">
          {hasPrice
            ? `Creates draft vouchers worth ${valueLabel} off, valid ${formatDisplayDate(campaign.startDate)} – ${formatDisplayDate(campaign.endDate)}. Each voucher gets its own code. They stay hidden until you publish them.`
            : 'This campaign is free, so there is no amount to put on the vouchers. Set a price on the campaign first.'}
        </p>
      </div>
      <div className="space-y-4 mt-4">
        <div>
          <Label htmlFor="count">Number of vouchers (1-100)</Label>
          <Input
            id="count"
            type="number"
            min="1"
            max="100"
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
          <WarmButton onClick={handleGenerate} disabled={isLoading || !hasPrice} size="sm">
            {isLoading ? 'Generating...' : 'Generate'}
          </WarmButton>
        </div>
      </div>
    </WarmCard>
  );
}
