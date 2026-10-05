'use client';

import { useState } from 'react';
import { WarmButton } from '@/components/warm-button';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { showConfirm } from '@/lib/confirm-helpers';
import { ExternalLink, Loader2, Link2, Unlink } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Client shim for the Stripe Connect buttons on the payouts settings
 * page. Handles the three actions the page exposes:
 *   - "Set up payouts"    → POST /connect, redirect to onboarding URL
 *   - "Open Stripe dashboard" → POST /connect/dashboard, open in new tab
 *   - "Disconnect"         → DELETE /connect, reload
 *
 * Kept intentionally dumb — no state, no cache. Authentication and
 * tenant role checks happen server-side on each route.
 */
export default function PayoutActions({
  slug,
  hasAccount,
  payoutsEnabled,
}: {
  slug: string;
  hasAccount: boolean;
  payoutsEnabled: boolean;
}) {
  const t = useTranslations('merchantSettings.payouts.actions');
  const [busy, setBusy] = useState<null | 'start' | 'dashboard' | 'disconnect'>(null);

  const startOnboarding = async () => {
    setBusy('start');
    try {
      const res = await fetch(`/api/merchant/${slug}/stripe/connect`, { method: 'POST' });
      const body = await res.json();
      if (!res.ok || !body.url) {
        showError(body.message || t('startFailed'));
        return;
      }
      // Full navigation — Stripe redirects back to /api/.../connect/return
      // which re-syncs our cache and lands on this page.
      window.location.href = body.url;
    } catch {
      showError(t('startNetworkError'));
    } finally {
      setBusy(null);
    }
  };

  const openDashboard = async () => {
    setBusy('dashboard');
    try {
      const res = await fetch(`/api/merchant/${slug}/stripe/connect/dashboard`, { method: 'POST' });
      const body = await res.json();
      if (!res.ok || !body.url) {
        showError(body.message || t('dashboardFailed'));
        return;
      }
      window.open(body.url, '_blank', 'noopener,noreferrer');
    } catch {
      showError(t('dashboardNetworkError'));
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async () => {
    showConfirm(t('disconnectConfirm'), async () => {
      setBusy('disconnect');
      try {
        const res = await fetch(`/api/merchant/${slug}/stripe/connect`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        showSuccess(t('disconnected'));
        window.location.reload();
      } catch {
        showError(t('disconnectFailed'));
      } finally {
        setBusy(null);
      }
    }, { confirmLabel: t('disconnect'), variant: 'destructive' });
    return;
  };

  // Action matrix. "Not connected" and "restricted / pending" both funnel
  // through `startOnboarding` (it generates a refresh link either way).
  if (!hasAccount) {
    return (
      <WarmButton onClick={startOnboarding} disabled={busy !== null}>
        {busy === 'start' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Link2 className="mr-2 h-4 w-4" />
        )}
        {t('setUp')}
      </WarmButton>
    );
  }

  return (
    <>
      {payoutsEnabled ? (
        <WarmButton onClick={openDashboard} disabled={busy !== null}>
          {busy === 'dashboard' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="mr-2 h-4 w-4" />
          )}
          {t('openDashboard')}
        </WarmButton>
      ) : (
        <WarmButton onClick={startOnboarding} disabled={busy !== null}>
          {busy === 'start' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Link2 className="mr-2 h-4 w-4" />
          )}
          {t('continueOnboarding')}
        </WarmButton>
      )}
      <WarmButton onClick={disconnect} variant="outline" disabled={busy !== null}>
        {busy === 'disconnect' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Unlink className="mr-2 h-4 w-4" />
        )}
        {t('disconnect')}
      </WarmButton>
    </>
  );
}
