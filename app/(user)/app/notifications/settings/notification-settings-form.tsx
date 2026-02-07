'use client';

import { useState } from 'react';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';

type MerchantSubscription = {
  merchantId: string;
  merchantSlug: string;
  merchantName: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
};

export default function NotificationSettingsForm({
  initialSubscriptions,
}: {
  initialSubscriptions: MerchantSubscription[];
}) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (merchantId: string, key: keyof MerchantSubscription) => {
    setSubscriptions((prev) =>
      prev.map((sub) =>
        sub.merchantId === merchantId ? { ...sub, [key]: !sub[key] } : sub
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all(
        subscriptions.map((sub) =>
          fetch(`/api/merchant/${sub.merchantSlug}/subscriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emailEnabled: sub.emailEnabled,
              inAppEnabled: sub.inAppEnabled,
              pushEnabled: sub.pushEnabled,
            }),
          })
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {subscriptions.map((sub) => (
        <WarmCard key={sub.merchantId} padding="lg" className="bg-white border border-[#E7DCC7]">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#2D2721]">{sub.merchantName}</p>
              <p className="text-sm text-[#8B7355]">@{sub.merchantSlug}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm text-[#6B5744]">
              <input
                type="checkbox"
                checked={sub.emailEnabled}
                onChange={() => toggle(sub.merchantId, 'emailEnabled')}
                className="h-4 w-4 accent-[#FFC857]"
              />
              Email
            </label>
            <label className="flex items-center gap-2 text-sm text-[#6B5744]">
              <input
                type="checkbox"
                checked={sub.inAppEnabled}
                onChange={() => toggle(sub.merchantId, 'inAppEnabled')}
                className="h-4 w-4 accent-[#FFC857]"
              />
              In-app
            </label>
            <label className="flex items-center gap-2 text-sm text-[#6B5744]">
              <input
                type="checkbox"
                checked={sub.pushEnabled}
                onChange={() => toggle(sub.merchantId, 'pushEnabled')}
                className="h-4 w-4 accent-[#FFC857]"
              />
              Push (beta)
            </label>
          </div>
        </WarmCard>
      ))}

      <WarmButton onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save preferences'}
      </WarmButton>
    </div>
  );
}
