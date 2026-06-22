'use client';

import { useState } from 'react';
import { WarmButton } from '@/components/warm-button';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { showConfirm } from '@/lib/confirm-helpers';
import { ExternalLink, Loader2, Link2, Unlink } from 'lucide-react';

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
  const [busy, setBusy] = useState<null | 'start' | 'dashboard' | 'disconnect'>(null);

  const startOnboarding = async () => {
    setBusy('start');
    try {
      const res = await fetch(`/api/merchant/${slug}/stripe/connect`, { method: 'POST' });
      const body = await res.json();
      if (!res.ok || !body.url) {
        showError(body.message || 'Failed to start Stripe onboarding');
        return;
      }
      // Full navigation — Stripe redirects back to /api/.../connect/return
      // which re-syncs our cache and lands on this page.
      window.location.href = body.url;
    } catch {
      showError('Network error starting onboarding');
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
        showError(body.message || 'Unable to open Stripe dashboard');
        return;
      }
      window.open(body.url, '_blank', 'noopener,noreferrer');
    } catch {
      showError('Network error opening dashboard');
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async () => {
    showConfirm('Disconnect this Stripe account? Payouts will pause until you reconnect.', async () => {
      setBusy('disconnect');
      try {
        const res = await fetch(`/api/merchant/${slug}/stripe/connect`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        showSuccess('Stripe account disconnected');
        window.location.reload();
      } catch {
        showError('Failed to disconnect');
      } finally {
        setBusy(null);
      }
    }, { confirmLabel: 'Disconnect', variant: 'destructive' });
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
        Set up payouts with Stripe
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
          Open Stripe dashboard
        </WarmButton>
      ) : (
        <WarmButton onClick={startOnboarding} disabled={busy !== null}>
          {busy === 'start' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Link2 className="mr-2 h-4 w-4" />
          )}
          Continue onboarding
        </WarmButton>
      )}
      <WarmButton onClick={disconnect} variant="outline" disabled={busy !== null}>
        {busy === 'disconnect' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Unlink className="mr-2 h-4 w-4" />
        )}
        Disconnect
      </WarmButton>
    </>
  );
}
