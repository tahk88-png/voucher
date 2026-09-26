// Service worker for web push notifications (registered in app/layout.tsx).
//
// Deliberately no fetch handler and no caching: a caching worker serves stale
// JavaScript after each deploy. This file only receives pushes sent by
// lib/web-push.ts, whose payload is JSON { title, body, url? }.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { body: event.data.text() };
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Notification', {
      body: payload.body || '',
      icon: '/icon-192.png',
      data: { url: payload.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Only same-origin targets: the URL comes from the push payload.
  const target = new URL(event.notification.data?.url || '/', self.location.origin);
  const url = target.origin === self.location.origin ? target.href : self.location.origin + '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
