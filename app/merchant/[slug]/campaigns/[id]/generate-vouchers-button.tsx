'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showSuccess } from '@/lib/toast-helpers';

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

  const handleGenerate = async () => {
    if (!count || parseInt(count) < 1 || parseInt(count) > 100) {
      showError('Please enter a number between 1 and 100');
      return;
    }

    setIsLoading(true);
    try {
      // Generate vouchers with campaign defaults
      const res = await fetch(`/api/campaigns/${campaignId}/generate-vouchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: parseInt(count),
          voucherData: {
            type: 'fixed_amount', // Default, can be customized
            value: campaign.price || 0, // Use campaign price as default
            currency: campaign.merchant?.defaultCurrency || 'USD',
            validFrom: campaign.startDate,
            validTo: campaign.endDate,
            codePrefix: campaign.name.slice(0, 3).toUpperCase(),
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate vouchers');
      }

      const result = await res.json();
      showSuccess(`Generated ${result.count} vouchers successfully!`);
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
      className="absolute z-10 w-full max-w-sm right-0 top-full mt-2 bg-white border border-[rgba(139,115,85,0.15)] shadow-warm"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[#2D2721]">Generate vouchers</h3>
        <p className="text-xs text-[#6B5744]">Create vouchers from this campaign</p>
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
            className="mt-1 border-[rgba(139,115,85,0.15)]"
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
