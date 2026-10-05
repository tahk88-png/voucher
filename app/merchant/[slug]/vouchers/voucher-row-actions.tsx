'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { showSuccess, showError } from '@/lib/toast-helpers';
import { safeParseJson } from '@/lib/utils';
import { Pause, Copy } from 'lucide-react';
import { useConfirmation } from '@/components/ui/confirmation-dialog';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('merchantVouchers.rowActions');
  const tCommon = useTranslations('common');

  const handlePause = async () => {
    const confirmed = await confirm({
      title: t('pauseTitle'),
      description: t('pauseDescription'),
      confirmLabel: t('pauseConfirm'),
      cancelLabel: tCommon('cancel'),
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
      showSuccess(t('paused'));
      router.refresh();
    } catch {
      showError(t('pauseFailed'));
    } finally {
      setPausing(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const getRes = await fetch(`/api/merchant/${slug}/vouchers/${voucherId}`);
      if (!getRes.ok) throw new Error(t('loadFailed'));
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
        throw new Error(d.error || t('duplicateFailed'));
      }
      const created = await postRes.json();
      showSuccess(t('duplicated'));
      router.push(`/merchant/${slug}/vouchers/${created.id}`);
    } catch (e) {
      showError(e instanceof Error ? e.message : t('duplicateFailed'));
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
            aria-label={t('pauseTitle')}
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
          aria-label={t('duplicateLabel')}
        >
          <Copy className="h-4 w-4" />
        </WarmButton>
      </div>
    </>
  );
}
