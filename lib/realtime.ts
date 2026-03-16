import { EventEmitter } from 'events';

// ── Event types ──────────────────────────────────────────────────────────────

export type RealtimeChannel = 'metrics' | 'activity' | 'alerts' | 'system_health';

export interface MetricUpdateEvent {
  channel: 'metrics';
  type: string;       // e.g. "active_users", "revenue_per_minute"
  value: number;
  previousValue?: number;
  timestamp: string;   // ISO
  dimensions?: Record<string, string>;
}

export interface ActivityEvent {
  channel: 'activity';
  id: string;
  action: string;      // e.g. "purchase", "redemption", "signup"
  description: string;
  userId?: string;
  merchantId?: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export interface AlertEvent {
  channel: 'alerts';
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  resolved?: boolean;
}

export interface SystemHealthEvent {
  channel: 'system_health';
  memoryUsageMB: number;
  uptimeSeconds: number;
  timestamp: string;
}

export type RealtimeEvent =
  | MetricUpdateEvent
  | ActivityEvent
  | AlertEvent
  | SystemHealthEvent;

// ── Singleton emitter ────────────────────────────────────────────────────────

const GLOBAL_KEY = Symbol.for('voucher_realtime_emitter');

function getEmitter(): EventEmitter {
  const g = globalThis as unknown as Record<symbol, EventEmitter | undefined>;
  if (!g[GLOBAL_KEY]) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(200); // many concurrent SSE clients
    g[GLOBAL_KEY] = emitter;
  }
  return g[GLOBAL_KEY]!;
}

const emitter = getEmitter();

// ── Broadcast helpers ────────────────────────────────────────────────────────

export function broadcastMetric(
  type: string,
  value: number,
  opts?: { previousValue?: number; dimensions?: Record<string, string> },
) {
  const event: MetricUpdateEvent = {
    channel: 'metrics',
    type,
    value,
    previousValue: opts?.previousValue,
    timestamp: new Date().toISOString(),
    dimensions: opts?.dimensions,
  };
  emitter.emit('metrics', event);
}

export function broadcastActivity(event: Omit<ActivityEvent, 'channel' | 'timestamp'>) {
  const full: ActivityEvent = {
    ...event,
    channel: 'activity',
    timestamp: new Date().toISOString(),
  };
  emitter.emit('activity', full);
}

export function broadcastAlert(event: Omit<AlertEvent, 'channel' | 'timestamp'>) {
  const full: AlertEvent = {
    ...event,
    channel: 'alerts',
    timestamp: new Date().toISOString(),
  };
  emitter.emit('alerts', full);
}

export function broadcastSystemHealth(
  memoryUsageMB: number,
  uptimeSeconds: number,
) {
  const event: SystemHealthEvent = {
    channel: 'system_health',
    memoryUsageMB,
    uptimeSeconds,
    timestamp: new Date().toISOString(),
  };
  emitter.emit('system_health', event);
}

// ── SSE stream factory ──────────────────────────────────────────────────────

/**
 * Creates a ReadableStream that forwards realtime events as SSE.
 * @param channels  Which event channels to subscribe to.
 * @param signal    AbortSignal from the incoming request.
 */
export function getRealtimeStream(
  channels: RealtimeChannel[],
  signal: AbortSignal,
): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      let closed = false;

      function send(event: RealtimeEvent) {
        if (closed) return;
        try {
          controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
        } catch {
          closed = true;
        }
      }

      // Subscribe to requested channels
      const listeners: Array<[string, (e: RealtimeEvent) => void]> = [];
      for (const ch of channels) {
        const handler = (e: RealtimeEvent) => send(e);
        emitter.on(ch, handler);
        listeners.push([ch, handler]);
      }

      // Heartbeat every 15 seconds
      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(`: heartbeat\n\n`);
        } catch {
          closed = true;
        }
      }, 15_000);

      // Cleanup on client disconnect
      const cleanup = () => {
        closed = true;
        clearInterval(heartbeat);
        for (const [ch, handler] of listeners) {
          emitter.off(ch, handler);
        }
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      signal.addEventListener('abort', cleanup);
    },
  });
}
