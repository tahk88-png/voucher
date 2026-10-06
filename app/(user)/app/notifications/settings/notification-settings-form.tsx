'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { showError, showSuccess } from '@/lib/toast-helpers';

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
  pushAvailable,
}: {
  initialSubscriptions: MerchantSubscription[];
  /** Hide the push toggle when web push isn't configured on this deployment. */
  pushAvailable: boolean;
}) {
  const t = useTranslations('notifications');
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
      const results = await Promise.all(
        subscriptions.map((sub) =>
          fetch(`/api/merchant/${sub.merchantSlug}/subscriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emailEnabled: sub.emailEnabled,
              inAppEnabled: sub.inAppEnabled,
              ...(pushAvailable ? { pushEnabled: sub.pushEnabled } : {}),
            }),
          })
        )
      );
      if (results.some((res) => !res.ok)) {
        showError(t('saveFailed'));
      } else {
        showSuccess(t('saved'));
      }
    } catch (error) {
      console.error('Saving notification preferences failed', error);
      showError(t('saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {subscriptions.map((sub) => (
        <WarmCard key={sub.merchantId} padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#2D2721]">{sub.merchantName}</p>
              <p className="text-sm text-[#8B7355]">@{sub.merchantSlug}</p>
            </div>
          </div>
          <div className={`mt-4 grid gap-3 ${pushAvailable ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            <label className="flex items-center gap-2 text-sm text-[#6B5744]">
              <input
                type="checkbox"
                checked={sub.emailEnabled}
                onChange={() => toggle(sub.merchantId, 'emailEnabled')}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              {t('email')}
            </label>
            <label className="flex items-center gap-2 text-sm text-[#6B5744]">
              <input
                type="checkbox"
                checked={sub.inAppEnabled}
                onChange={() => toggle(sub.merchantId, 'inAppEnabled')}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              {t('inApp')}
            </label>
            {pushAvailable && (
              <label className="flex items-center gap-2 text-sm text-[#6B5744]">
                <input
                  type="checkbox"
                  checked={sub.pushEnabled}
                  onChange={() => toggle(sub.merchantId, 'pushEnabled')}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                {t('pushBeta')}
              </label>
            )}
          </div>
        </WarmCard>
      ))}

      <WarmButton onClick={handleSave} disabled={isSaving}>
        {isSaving ? t('saving') : t('savePreferences')}
      </WarmButton>
    </div>
  );
}
