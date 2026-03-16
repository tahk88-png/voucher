'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ── Types (mirrored from lib/realtime.ts for client) ─────────────────────────

type RealtimeChannel = 'metrics' | 'activity' | 'alerts' | 'system_health';

interface MetricUpdateEvent {
  channel: 'metrics';
  type: string;
  value: number;
  previousValue?: number;
  timestamp: string;
  dimensions?: Record<string, string>;
}

interface ActivityEvent {
  channel: 'activity';
  id: string;
  action: string;
  description: string;
  userId?: string;
  merchantId?: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

interface AlertEvent {
  channel: 'alerts';
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  resolved?: boolean;
}

type RealtimeEvent = MetricUpdateEvent | ActivityEvent | AlertEvent | { channel: 'system_health'; [key: string]: unknown };

interface MetricEntry {
  value: number;
  timestamp: string;
}

interface UseRealtimeReturn {
  connected: boolean;
  lastEvent: RealtimeEvent | null;
  metrics: Map<string, MetricEntry>;
  activities: ActivityEvent[];
  alerts: AlertEvent[];
}

const MAX_ACTIVITIES = 50;
const MAX_BACKOFF_MS = 30_000;
const INITIAL_BACKOFF_MS = 1_000;

/**
 * useRealtime — connects to the platform SSE stream and returns live data.
 *
 * @param channels  Which channels to subscribe to (e.g. ['metrics', 'activity'])
 */
export function useRealtime(channels: RealtimeChannel[]): UseRealtimeReturn {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [metrics, setMetrics] = useState<Map<string, MetricEntry>>(new Map());
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);

  const retryDelay = useRef(INITIAL_BACKOFF_MS);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const es = useRef<EventSource | null>(null);
  const channelsKey = channels.sort().join(',');

  const handleEvent = useCallback((event: RealtimeEvent) => {
    setLastEvent(event);

    switch (event.channel) {
      case 'metrics': {
        const m = event as MetricUpdateEvent;
        setMetrics((prev) => {
          const next = new Map(prev);
          next.set(m.type, { value: m.value, timestamp: m.timestamp });
          return next;
        });
        break;
      }
      case 'activity': {
        const a = event as ActivityEvent;
        setActivities((prev) => {
          const next = [a, ...prev];
          return next.length > MAX_ACTIVITIES ? next.slice(0, MAX_ACTIVITIES) : next;
        });
        break;
      }
      case 'alerts': {
        const al = event as AlertEvent;
        setAlerts((prev) => {
          if (al.resolved) {
            return prev.filter((a) => a.id !== al.id);
          }
          // Replace existing or append
          const idx = prev.findIndex((a) => a.id === al.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = al;
            return next;
          }
          return [...prev, al];
        });
        break;
      }
    }
  }, []);

  useEffect(() => {
    if (!channelsKey) return;

    let destroyed = false;

    function connect() {
      if (destroyed) return;

      const url = `/api/realtime/stream?channels=${encodeURIComponent(channelsKey)}`;
      const source = new EventSource(url);
      es.current = source;

      source.onopen = () => {
        if (destroyed) {
          source.close();
          return;
        }
        setConnected(true);
        retryDelay.current = INITIAL_BACKOFF_MS;
      };

      source.onmessage = (evt) => {
        if (destroyed) return;
        try {
          const data = JSON.parse(evt.data) as RealtimeEvent;
          handleEvent(data);
        } catch {
          /* ignore malformed data */
        }
      };

      source.onerror = () => {
        source.close();
        es.current = null;
        setConnected(false);
        if (destroyed) return;

        const delay = retryDelay.current;
        retryDelay.current = Math.min(delay * 2, MAX_BACKOFF_MS);
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
  }, [channelsKey, handleEvent]);

  return { connected, lastEvent, metrics, activities, alerts };
}
