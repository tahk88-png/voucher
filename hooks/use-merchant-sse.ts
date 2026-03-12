'use client';

import { useEffect, useRef, useState } from 'react';

type MerchantSSEStats = {
  today: number;
  pending: number;
};

/**
 * useMerchantSSE
 *
 * Connects to /api/merchant/[slug]/sse and returns live redemption stats.
 * Auto-reconnects with exponential backoff (max 60s).
 */
export function useMerchantSSE(slug: string) {
  const [stats, setStats] = useState<MerchantSSEStats | null>(null);
  const [connected, setConnected] = useState(false);
  const retryDelay = useRef(2000);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const es = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!slug) return;

    let destroyed = false;

    function connect() {
      if (destroyed) return;

      const source = new EventSource(`/api/merchant/${slug}/sse`);
      es.current = source;

      source.onopen = () => {
        if (destroyed) { source.close(); return; }
        setConnected(true);
        retryDelay.current = 2000;
      };

      source.onmessage = (event) => {
        if (destroyed) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'stats') {
            setStats({ today: msg.today, pending: msg.pending });
          }
        } catch { /* ignore */ }
      };

      source.onerror = () => {
        source.close();
        es.current = null;
        setConnected(false);
        if (destroyed) return;

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
      if (es.current) { es.current.close(); es.current = null; }
    };
  }, [slug]);

  return { stats, connected };
}
