'use client';

import { useState } from 'react';
import { WarmButton } from '@/components/warm-button';

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
  initial: PromotionState;
}) {
  const [state, setState] = useState<PromotionState>(initial);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const promotedUntil = state.promotedUntil
        ? new Date(state.promotedUntil).toISOString()
        : null;
      await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotedWeeklyEmail: state.promotedWeeklyEmail,
          promotedNotification: state.promotedNotification,
          promotedUntil,
        }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-[#6B5744]">
        <input
          type="checkbox"
          checked={state.promotedWeeklyEmail}
          onChange={() =>
            setState((prev) => ({ ...prev, promotedWeeklyEmail: !prev.promotedWeeklyEmail }))
          }
          className="h-4 w-4 accent-[#FFC857]"
        />
        Include in weekly newsletter (paid)
      </label>
      <label className="flex items-center gap-2 text-sm text-[#6B5744]">
        <input
          type="checkbox"
          checked={state.promotedNotification}
          onChange={() =>
            setState((prev) => ({ ...prev, promotedNotification: !prev.promotedNotification }))
          }
          className="h-4 w-4 accent-[#FFC857]"
        />
        Boost in notifications (paid)
      </label>
      <label className="flex flex-col gap-1 text-sm text-[#6B5744]">
        Promotion end date
        <input
          type="datetime-local"
          value={state.promotedUntil || ''}
          onChange={(e) => setState((prev) => ({ ...prev, promotedUntil: e.target.value || null }))}
          className="rounded-md border border-[#E7DCC7] bg-white px-3 py-2 text-sm"
        />
      </label>
      <WarmButton onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save promotion settings'}
      </WarmButton>
    </div>
  );
}
