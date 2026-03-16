'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseLiveMetricReturn {
  value: number;
  previousValue: number;
  change: number;         // absolute difference
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date | null;
  connected: boolean;
}

const DEFAULT_POLL_INTERVAL = 30_000; // 30s fallback poll

/**
 * useLiveMetric — tracks a single metric in real time via SSE,
 * with automatic polling fallback if SSE is unavailable.
 *
 * @param metricName    The metric key to track (e.g. "active_users")
 * @param initialValue  Starting value before any data arrives
 * @param pollInterval  Polling fallback interval in ms (default 30s)
 */
export function useLiveMetric(
  metricName: string,
  initialValue = 0,
  pollInterval = DEFAULT_POLL_INTERVAL,
): UseLiveMetricReturn {
  const [value, setValue] = useState(initialValue);
  const [previousValue, setPreviousValue] = useState(initialValue);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connected, setConnected] = useState(false);
  const [sseAvailable, setSseAvailable] = useState(true);

  const retryDelay = useRef(1_000);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const es = useRef<EventSource | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Smooth value transition
  const animationFrame = useRef<number | null>(null);
  const displayValue = useRef(initialValue);

  const updateValue = useCallback(
    (newValue: number) => {
      setPreviousValue((prev) => {
        // Only update previous if the new value is actually different
        return prev;
      });
      setValue((current) => {
        if (current !== newValue) {
          setPreviousValue(current);
        }
        return newValue;
      });
      setLastUpdated(new Date());
    },
    [],
  );

  // SSE connection
  useEffect(() => {
    if (!metricName || !sseAvailable) return;

    let destroyed = false;

    function connect() {
      if (destroyed) return;

      const url = `/api/realtime/stream?channels=metrics`;
      const source = new EventSource(url);
      es.current = source;

      source.onopen = () => {
        if (destroyed) {
          source.close();
          return;
        }
        setConnected(true);
        retryDelay.current = 1_000;
      };

      source.onmessage = (evt) => {
        if (destroyed) return;
        try {
          const data = JSON.parse(evt.data);
          if (data.channel === 'metrics' && data.type === metricName) {
            updateValue(data.value);
          }
        } catch {
          /* ignore */
        }
      };

      source.onerror = () => {
        source.close();
        es.current = null;
        setConnected(false);
        if (destroyed) return;

        // After several retries, fall back to polling
        if (retryDelay.current >= 30_000) {
          setSseAvailable(false);
          return;
        }

        const delay = retryDelay.current;
        retryDelay.current = Math.min(delay * 2, 30_000);
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
  }, [metricName, sseAvailable, updateValue]);

  // Polling fallback when SSE is unavailable
  useEffect(() => {
    if (sseAvailable || !metricName) return;

    async function poll() {
      try {
        const res = await fetch(
          `/api/metrics/live?names=${encodeURIComponent(metricName)}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data[metricName] !== undefined) {
            updateValue(
              typeof data[metricName] === 'object'
                ? data[metricName].value
                : data[metricName],
            );
          }
        }
      } catch {
        /* ignore poll errors */
      }
    }

    poll(); // immediate first poll
    pollTimer.current = setInterval(poll, pollInterval);

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [sseAvailable, metricName, pollInterval, updateValue]);

  // Cleanup animation frame
  useEffect(() => {
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, []);

  const change = Math.abs(value - previousValue);
  const trend: 'up' | 'down' | 'stable' =
    value > previousValue ? 'up' : value < previousValue ? 'down' : 'stable';

  return {
    value,
    previousValue,
    change,
    trend,
    lastUpdated,
    connected: connected || !sseAvailable, // polling counts as "connected"
  };
}
