'use client';

import { useEffect, useRef, useState } from 'react';

type SSEMessage =
  | { type: 'count'; unread: number }
  | { type: 'ping' }
  | { type: 'notification'; id: string; title: string; body: string };

/**
 * useNotificationsSSE
 *
 * Connects to /api/sse and returns the current unread notification count.
 * Auto-reconnects with exponential backoff on error (max 60s).
 * Stops retrying when the component unmounts.
 *
 * @param enabled – set to false when user is not logged in
 */
export function useNotificationsSSE(enabled = true) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const retryDelay = useRef(2000);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const es = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let destroyed = false;

    function connect() {
      if (destroyed) return;

      const source = new EventSource('/api/sse');
      es.current = source;

      source.onopen = () => {
        if (destroyed) { source.close(); return; }
        setConnected(true);
        retryDelay.current = 2000; // reset backoff on success
      };

      source.onmessage = (event) => {
        if (destroyed) return;
        try {
          const msg = JSON.parse(event.data) as SSEMessage;
          if (msg.type === 'count') {
            setUnreadCount(msg.unread);
          }
        } catch {
          // malformed message — ignore
        }
      };

      source.onerror = () => {
        source.close();
        es.current = null;
        setConnected(false);

        if (destroyed) return;

        // Exponential backoff: 2s → 4s → 8s → … → 60s
        const delay = retryDelay.current;
        retryDelay.current = Math.min(delay * 2, 60_000);

        timeout.current = setTimeout(() => {
          if (!destroyed) connect();
        }, delay);
      };
    }

    connect();

    return () => {
      destroyed = true;
      if (timeout.current) clearTimeout(timeout.current);
      if (es.current) {
        es.current.close();
        es.current = null;
      }
    };
  }, [enabled]);

  return { unreadCount, connected };
}
