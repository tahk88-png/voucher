'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { showSuccess, showError } from '@/lib/toast-helpers';
import { safeParseJson } from '@/lib/utils';
import { Pause, Copy } from 'lucide-react';
import { useConfirmation } from '@/components/ui/confirmation-dialog';

type VoucherStatus = 'draft' | 'published' | 'paused' | 'ended';

interface VoucherRowActionsProps {
  slug: string;
  voucherId: string;
  status: VoucherStatus;
}

export function VoucherRowActions({ slug, voucherId, status }: VoucherRowActionsProps) {
  const router = useRouter();
  const [pausing, setPausing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const { confirm, dialog } = useConfirmation();

  const handlePause = async () => {
    const confirmed = await confirm({
      title: 'Pause voucher',
      description: 'Are you sure you want to pause this voucher? Users will not be able to purchase or redeem it while paused.',
      confirmLabel: 'Pause',
      variant: 'warning',
    });

    if (!confirmed) return;

    setPausing(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/vouchers/${voucherId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paused' }),
      });
      if (!res.ok) throw new Error('Failed to pause');
      showSuccess('Voucher paused');
      router.refresh();
    } catch {
      showError('Failed to pause voucher');
    } finally {
      setPausing(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const getRes = await fetch(`/api/merchant/${slug}/vouchers/${voucherId}`);
      if (!getRes.ok) throw new Error('Failed to load voucher');
      const v = await getRes.json();

      const designJson = v.designJson != null ? safeParseJson(v.designJson) : undefined;
      const weeklyDropJson = v.weeklyDropJson != null ? safeParseJson(v.weeklyDropJson) : undefined;
      const conditionsJson = v.conditionsJson != null ? safeParseJson(v.conditionsJson) : undefined;

      const body = {
        type: v.type,
        value: v.value,
        currency: v.currency,
        validFrom: new Date(v.validFrom).toISOString(),
        validTo: new Date(v.validTo).toISOString(),
        usageLimitTotal: v.usageLimitTotal ?? undefined,
        usageLimitPerUser: v.usageLimitPerUser ?? undefined,
        weeklyDropEnabled: v.weeklyDropEnabled ?? false,
        weeklyDropJson: weeklyDropJson ?? undefined,
        conditionsJson: conditionsJson ?? undefined,
        designJson,
        codePrefix: v.codePrefix ?? undefined,
      };

      const postRes = await fetch(`/api/merchant/${slug}/vouchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!postRes.ok) {
        const d = await postRes.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to duplicate');
      }
      const created = await postRes.json();
      showSuccess('Voucher duplicated');
      router.push(`/merchant/${slug}/vouchers/${created.id}`);
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to duplicate');
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <>
      {dialog}
      <div className="flex items-center gap-1">
        {status === 'published' && (
          <WarmButton
            variant="ghost"
            size="sm"
            onClick={handlePause}
            disabled={pausing}
            className="h-8 px-2"
            aria-label="Pause voucher"
          >
            <Pause className="h-4 w-4" />
          </WarmButton>
        )}
        <WarmButton
          variant="ghost"
          size="sm"
          onClick={handleDuplicate}
          disabled={duplicating}
          className="h-8 px-2"
          aria-label="Duplicate voucher"
        >
          <Copy className="h-4 w-4" />
        </WarmButton>
      </div>
    </>
  );
}
