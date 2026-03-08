'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { WarmButton } from '@/components/warm-button';
import { showError, showSuccess } from '@/lib/toast-helpers';

type PushState = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed';

export default function PushSubscribeButton() {
  const [state, setState] = useState<PushState>('loading');

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setState(sub ? 'subscribed' : 'unsubscribed');
      });
    });
  }, []);

  const subscribe = async () => {
    try {
      const keyRes = await fetch('/api/push/vapid-key');
      const { publicKey } = await keyRes.json();

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const json = sub.toJSON();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        }),
      });

      setState('subscribed');
      showSuccess('Push notifications enabled');
    } catch {
      showError('Failed to enable push notifications');
    }
  };

  const unsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState('unsubscribed');
      showSuccess('Push notifications disabled');
    } catch {
      showError('Failed to disable push notifications');
    }
  };

  if (state === 'loading') return null;

  if (state === 'unsupported') {
    return (
      <div className="flex items-center gap-2 text-sm text-[#8B7355]">
        <BellOff className="h-4 w-4" />
        <span>Push notifications not supported in this browser</span>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="flex items-center gap-2 text-sm text-[#8B7355]">
        <BellOff className="h-4 w-4" />
        <span>Notifications blocked. Allow them in browser settings to enable.</span>
      </div>
    );
  }

  if (state === 'subscribed') {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-green-700">
          <BellRing className="h-4 w-4" />
          <span>Push notifications enabled</span>
        </div>
        <WarmButton size="sm" variant="outline" onClick={unsubscribe}>
          Disable
        </WarmButton>
      </div>
    );
  }

  return (
    <WarmButton size="sm" onClick={subscribe}>
      <Bell className="h-4 w-4 mr-1" />
      Enable push notifications
    </WarmButton>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
