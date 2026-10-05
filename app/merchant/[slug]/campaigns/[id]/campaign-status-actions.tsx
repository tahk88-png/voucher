'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { WarmButton } from '@/components/warm-button';
import { showConfirm } from '@/lib/confirm-helpers';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { apiErrorMessage } from '@/lib/api-error-message';
import { parsePaywallResponse, type PaywallDetails } from '@/lib/paywall-utils';
import PaywallModal from '@/components/billing/paywall-modal';

type CampaignStatus = 'draft' | 'active' | 'ended';

// Texts live under merchantCampaigns.actions.<key>.{label,title,description,success}.
const ACTIONS: Record<'publish' | 'pause' | 'end', { to: CampaignStatus; variant: 'default' | 'warning' | 'destructive' }> = {
  publish: { to: 'active', variant: 'default' },
  pause: { to: 'draft', variant: 'warning' },
  end: { to: 'ended', variant: 'destructive' },
};

export default function CampaignStatusActions({
  campaignId,
  merchantSlug,
  status,
  isAdmin,
}: {
  campaignId: string;
  merchantSlug: string;
  status: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const t = useTranslations('merchantCampaigns');
  const tCommon = useTranslations('common');
  const [busy, setBusy] = useState(false);
  const [paywall, setPaywall] = useState<PaywallDetails | null>(null);

  if (!isAdmin) {
    return (
      <p className="text-xs text-[var(--text-muted)]">{t('actions.adminOnly')}</p>
    );
  }

  const run = (key: keyof typeof ACTIONS) => {
    const action = ACTIONS[key];
    showConfirm(
      t(`actions.${key}.description`),
      async () => {
        setBusy(true);
        try {
          const res = await fetch(`/api/campaigns/${campaignId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: action.to }),
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) {
            if (res.status === 402) {
              setPaywall(parsePaywallResponse(body));
              return;
            }
            throw new Error(apiErrorMessage(body, t('actions.updateFailedStatus', { status: res.status })));
          }
          showSuccess(t(`actions.${key}.success`), tCommon('success'));
          router.refresh();
        } catch (error) {
          showError(error instanceof Error ? error.message : t('actions.updateFailed'), tCommon('error'));
        } finally {
          setBusy(false);
        }
      },
      {
        title: t(`actions.${key}.title`),
        confirmLabel: t(`actions.${key}.label`),
        cancelLabel: tCommon('cancel'),
        variant: action.variant,
      },
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {status !== 'ended' && (
        <WarmButton asChild variant="outline" size="sm">
          <Link href={`/merchant/${merchantSlug}/campaigns/${campaignId}/edit`}>{t('actions.edit')}</Link>
        </WarmButton>
      )}
      {status === 'draft' && (
        <WarmButton size="sm" onClick={() => run('publish')} disabled={busy}>
          {t('actions.publish.label')}
        </WarmButton>
      )}
      {status === 'active' && (
        <WarmButton size="sm" variant="outline" onClick={() => run('pause')} disabled={busy}>
          {t('actions.pause.label')}
        </WarmButton>
      )}
      {status !== 'ended' && (
        <WarmButton size="sm" variant="outline" onClick={() => run('end')} disabled={busy}>
          {t('actions.end.label')}
        </WarmButton>
      )}
      {paywall && (
        <PaywallModal
          open
          onClose={() => setPaywall(null)}
          slug={merchantSlug}
          message={paywall.message}
          currentTier={paywall.planTier}
          requiredPlan={paywall.requiredPlan}
          capability={paywall.capability}
          limit={paywall.limit}
        />
      )}
    </div>
  );
}
