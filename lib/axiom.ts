/**
 * Axiom structured logging integration.
 *
 * Sends logs to Axiom for centralized observability alongside Sentry.
 * Sentry: errors + performance. Axiom: structured event logs + queries.
 *
 * Env vars:
 *   AXIOM_TOKEN — API token
 *   AXIOM_DATASET — dataset name (default: "voucher-logs")
 *   AXIOM_ORG_ID — organization ID
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface AxiomEvent {
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

const AXIOM_TOKEN = process.env.AXIOM_TOKEN;
const AXIOM_DATASET = process.env.AXIOM_DATASET || 'voucher-logs';
const AXIOM_INGEST_URL = `https://api.axiom.co/v1/datasets/${AXIOM_DATASET}/ingest`;

let buffer: AxiomEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 5_000;
const MAX_BUFFER = 50;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL);
}

async function flush() {
  if (!AXIOM_TOKEN || buffer.length === 0) return;

  const events = [...buffer];
  buffer = [];

  try {
    await fetch(AXIOM_INGEST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AXIOM_TOKEN}`,
      },
      body: JSON.stringify(events.map((e) => ({
        _time: new Date().toISOString(),
        ...e,
      }))),
    });
  } catch {
    // Re-buffer on failure (drop if > MAX_BUFFER to avoid memory leak)
    if (buffer.length < MAX_BUFFER) {
      buffer.unshift(...events);
    }
  }
}

function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
  const event: AxiomEvent = {
    level,
    message,
    ...data,
    env: process.env.NODE_ENV,
    service: 'voucher-platform',
  };

  if (!AXIOM_TOKEN) {
    // No Axiom configured — skip silently
    return;
  }

  buffer.push(event);
  if (buffer.length >= MAX_BUFFER) {
    flush();
  } else {
    scheduleFlush();
  }
}

export const axiom = {
  info: (msg: string, data?: Record<string, unknown>) => log('info', msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => log('warn', msg, data),
  error: (msg: string, data?: Record<string, unknown>) => log('error', msg, data),
  debug: (msg: string, data?: Record<string, unknown>) => log('debug', msg, data),
  flush,
};
