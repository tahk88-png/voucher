import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 2000, 4000]; // exponential backoff

async function deliverWithRetry(
  url: string,
  headers: Record<string, string>,
  body: string,
  timeoutMs = 10000
): Promise<{ status: number; text: string }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]));
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
      // Only retry on server errors (5xx)
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      return { status: res.status, text: (await res.text()).slice(0, 500) };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown error');
      if (attempt < MAX_RETRIES) continue;
    }
  }

  throw lastError ?? new Error('Delivery failed');
}

export async function dispatchWebhook(
  merchantId: string,
  event: string,
  payload: Record<string, any>
) {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { merchantId, isActive: true, events: { has: event } },
  });

  for (const endpoint of endpoints) {
    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });
    const signature = crypto
      .createHmac('sha256', endpoint.secret)
      .update(body)
      .digest('hex');

    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': `sha256=${signature}`,
      'X-Webhook-Event': event,
    };

    try {
      const { status, text } = await deliverWithRetry(endpoint.url, headers, body);
      await prisma.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          event,
          payload,
          statusCode: status,
          response: text,
          attempts: MAX_RETRIES + 1,
        },
      });
    } catch (error) {
      await prisma.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          event,
          payload,
          response: error instanceof Error ? error.message : 'Unknown error',
          attempts: MAX_RETRIES + 1,
        },
      });
    }
  }
}

export const WEBHOOK_EVENTS = [
  'voucher.redeemed',
  'voucher.purchased',
  'voucher.expired',
  'campaign.started',
  'campaign.ended',
  'ticket.redeemed',
  'gift_card.redeemed',
  'redemption.created',
  'redemption.confirmed',
  'review.created',
  'subscription.created',
  'booking.created',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/**
 * Sign a webhook payload using HMAC-SHA256
 */
export function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Send a webhook to a single endpoint with retry
 */
export async function sendWebhook(
  url: string,
  event: string,
  payload: Record<string, any>,
  secret: string
): Promise<{ status: number; text: string }> {
  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });
  const signature = signPayload(body, secret);

  const headers = {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': `sha256=${signature}`,
    'X-Webhook-Event': event,
  };

  return deliverWithRetry(url, headers, body);
}

/**
 * Queue a webhook for delivery — fire-and-forget dispatch
 * (wraps dispatchWebhook but doesn't await — logs errors instead of throwing)
 */
export function queueWebhook(
  merchantId: string,
  event: string,
  payload: Record<string, any>
): void {
  dispatchWebhook(merchantId, event, payload).catch((err) => {
    console.error(`[webhook] Failed to dispatch ${event} for merchant ${merchantId}:`, err);
  });
}
