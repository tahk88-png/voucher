'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { WarmButton } from '@/components/warm-button';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { apiErrorMessage } from '@/lib/api-error-message';
import { parsePaywallResponse } from '@/lib/paywall-utils';
import { toDatetimeLocalValue } from '@/lib/money-input';

type PromotionState = {
  promotedWeeklyEmail: boolean;
  promotedNotification: boolean;
  promotedUntil: string | null;
};

export default function CampaignPromotionForm({
  campaignId,
  initial,
}: {
  campaignId: string;
  /** promotedUntil as an ISO string (or null). */
  initial: PromotionState;
}) {
  const router = useRouter();
  const t = useTranslations('merchantCampaigns');
  const tCommon = useTranslations('common');
  // The input holds local wall-clock time; convert the stored ISO instant.
  const [state, setState] = useState<PromotionState>({
    ...initial,
    promotedUntil: initial.promotedUntil ? toDatetimeLocalValue(new Date(initial.promotedUntil)) : null,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const promotedUntil = state.promotedUntil
        ? new Date(state.promotedUntil).toISOString()
        : null;
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotedWeeklyEmail: state.promotedWeeklyEmail,
          promotedNotification: state.promotedNotification,
          promotedUntil,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 402) {
          const paywall = parsePaywallResponse(body);
          showError(paywall?.message || t('promotion.upgradeNeeded'), t('promotion.upgradeNeededTitle'));
          return;
        }
        showError(
          apiErrorMessage(body, t('promotion.saveFailedStatus', { status: res.status })),
          tCommon('error'),
        );
        return;
      }
      showSuccess(t('promotion.saved'), tCommon('success'));
      router.refresh();
    } catch {
      showError(t('promotion.saveFailedNetwork'), tCommon('error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <input
          type="checkbox"
          checked={state.promotedWeeklyEmail}
          onChange={() =>
            setState((prev) => ({ ...prev, promotedWeeklyEmail: !prev.promotedWeeklyEmail }))
          }
          className="h-4 w-4 accent-[#cc785c]"
        />
        {t('promotion.weeklyEmail')}
      </label>
      <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <input
          type="checkbox"
          checked={state.promotedNotification}
          onChange={() =>
            setState((prev) => ({ ...prev, promotedNotification: !prev.promotedNotification }))
          }
          className="h-4 w-4 accent-[#cc785c]"
        />
        {t('promotion.notification')}
      </label>
      <label className="flex flex-col gap-1 text-sm text-[var(--text-muted)]">
        {t('promotion.endDate')}
        <input
          type="datetime-local"
          value={state.promotedUntil || ''}
          onChange={(e) => setState((prev) => ({ ...prev, promotedUntil: e.target.value || null }))}
          className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
      </label>
      <WarmButton onClick={handleSave} disabled={isSaving}>
        {isSaving ? t('promotion.saving') : t('promotion.save')}
      </WarmButton>
    </div>
  );
}
