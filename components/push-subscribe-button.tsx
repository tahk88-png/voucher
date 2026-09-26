'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { WarmButton } from '@/components/warm-button';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { isVapidKeyConfigured } from '@/app/(user)/app/_components/push-config';

type PushState = 'loading' | 'unavailable' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed';

/**
 * Renders nothing when this deployment has no real VAPID key: offering a
 * button that can only fail is worse than not offering push at all.
 */
export default function PushSubscribeButton() {
  const t = useTranslations('push');
  const [state, setState] = useState<PushState>('loading');
  const [busy, setBusy] = useState(false);
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (!isVapidKeyConfigured(publicKey)) {
      setState('unavailable');
      return;
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    let cancelled = false;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (!cancelled) setState(sub ? 'subscribed' : 'unsubscribed');
      })
      .catch((error) => {
        console.error('Reading push subscription failed', error);
        if (!cancelled) setState('unsupported');
      });
    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  const subscribe = async () => {
    if (!publicKey) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const json = sub.toJSON();
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        }),
      });
      if (!res.ok) {
        await sub.unsubscribe();
        throw new Error(`Saving the subscription failed (HTTP ${res.status})`);
      }

      setState('subscribed');
      showSuccess(t('enabledToast'));
    } catch (error) {
      console.error('Enabling push failed', error);
      if (Notification.permission === 'denied') setState('denied');
      showError(t('enableFailed'));
    } finally {
      setBusy(false);
    }
  };

  const unsubscribe = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const res = await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        if (!res.ok) throw new Error(`Removing the subscription failed (HTTP ${res.status})`);
        await sub.unsubscribe();
      }
      setState('unsubscribed');
      showSuccess(t('disabledToast'));
    } catch (error) {
      console.error('Disabling push failed', error);
      showError(t('disableFailed'));
    } finally {
      setBusy(false);
    }
  };

  if (state === 'loading' || state === 'unavailable') return null;

  if (state === 'unsupported') {
    return (
      <div className="flex items-center gap-2 text-sm text-[#8B7355]">
        <BellOff className="h-4 w-4" aria-hidden="true" />
        <span>{t('unsupported')}</span>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="flex items-center gap-2 text-sm text-[#8B7355]">
        <BellOff className="h-4 w-4" aria-hidden="true" />
        <span>{t('blocked')}</span>
      </div>
    );
  }

  if (state === 'subscribed') {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-green-700">
          <BellRing className="h-4 w-4" aria-hidden="true" />
          <span>{t('enabled')}</span>
        </div>
        <WarmButton size="sm" variant="outline" onClick={unsubscribe} isLoading={busy}>
          {t('disable')}
        </WarmButton>
      </div>
    );
  }

  return (
    <WarmButton size="sm" onClick={subscribe} isLoading={busy}>
      <Bell className="h-4 w-4 mr-1" aria-hidden="true" />
      {t('enable')}
    </WarmButton>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
