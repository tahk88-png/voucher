'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { showConfirm } from '@/lib/confirm-helpers';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { apiErrorMessage } from '@/lib/api-error-message';
import { parsePaywallResponse, type PaywallDetails } from '@/lib/paywall-utils';
import PaywallModal from '@/components/billing/paywall-modal';

type CampaignStatus = 'draft' | 'active' | 'ended';

const ACTIONS: Record<
  'publish' | 'pause' | 'end',
  { to: CampaignStatus; label: string; title: string; description: string; success: string; variant: 'default' | 'warning' | 'destructive' }
> = {
  publish: {
    to: 'active',
    label: 'Publish',
    title: 'Publish this campaign?',
    description: 'Customers will be able to see and buy vouchers from this campaign straight away.',
    success: 'Campaign published. It is now live for customers.',
    variant: 'default',
  },
  pause: {
    to: 'draft',
    label: 'Pause',
    title: 'Pause this campaign?',
    description: 'The campaign goes back to draft and is hidden from customers until you publish it again. Vouchers already sold stay valid.',
    success: 'Campaign paused. It is hidden from customers.',
    variant: 'warning',
  },
  end: {
    to: 'ended',
    label: 'End campaign',
    title: 'End this campaign now?',
    description: 'The campaign stops immediately and cannot be published again. Vouchers already sold stay valid.',
    success: 'Campaign ended.',
    variant: 'destructive',
  },
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
  const [busy, setBusy] = useState(false);
  const [paywall, setPaywall] = useState<PaywallDetails | null>(null);

  if (!isAdmin) {
    return (
      <p className="text-xs text-[var(--text-muted)]">Only merchant admins can publish, pause or edit campaigns.</p>
    );
  }

  const run = (key: keyof typeof ACTIONS) => {
    const action = ACTIONS[key];
    showConfirm(
      action.description,
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
            throw new Error(apiErrorMessage(body, `Couldn't update the campaign (error ${res.status}).`));
          }
          showSuccess(action.success);
          router.refresh();
        } catch (error) {
          showError(error instanceof Error ? error.message : "Couldn't update the campaign.");
        } finally {
          setBusy(false);
        }
      },
      { title: action.title, confirmLabel: action.label, variant: action.variant },
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {status !== 'ended' && (
        <WarmButton asChild variant="outline" size="sm">
          <Link href={`/merchant/${merchantSlug}/campaigns/${campaignId}/edit`}>Edit</Link>
        </WarmButton>
      )}
      {status === 'draft' && (
        <WarmButton size="sm" onClick={() => run('publish')} disabled={busy}>
          Publish
        </WarmButton>
      )}
      {status === 'active' && (
        <WarmButton size="sm" variant="outline" onClick={() => run('pause')} disabled={busy}>
          Pause
        </WarmButton>
      )}
      {status !== 'ended' && (
        <WarmButton size="sm" variant="outline" onClick={() => run('end')} disabled={busy}>
          End campaign
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
