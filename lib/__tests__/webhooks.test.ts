import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { signPayload, WEBHOOK_EVENTS, type WebhookEvent } from '@/lib/webhooks';

// Unit tests for the webhook primitives. This file is pure: it does
// not touch Prisma or the network, so it runs in the default suite
// (not gated by VITEST_INCLUDE_INTEGRATION).

describe('signPayload', () => {
  it('produces a 64-char hex HMAC-SHA256', () => {
    const sig = signPayload('{"event":"voucher.redeemed"}', 'a'.repeat(64));
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for the same input', () => {
    const body = JSON.stringify({ event: 'review.created', data: { rating: 5 } });
    const secret = 'b'.repeat(64);
    expect(signPayload(body, secret)).toBe(signPayload(body, secret));
  });

  it('changes when the payload changes (even by one byte)', () => {
    const secret = 'c'.repeat(64);
    const a = signPayload('{"x":1}', secret);
    const b = signPayload('{"x":2}', secret);
    expect(a).not.toBe(b);
  });

  it('changes when the secret changes', () => {
    const body = '{"event":"voucher.purchased"}';
    expect(signPayload(body, 'secret-one')).not.toBe(signPayload(body, 'secret-two'));
  });

  it('matches a hand-rolled crypto.createHmac baseline', () => {
    const body = '{"event":"ticket.redeemed","data":{"ticketId":"t_42"}}';
    const secret = 'd'.repeat(64);
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    expect(signPayload(body, secret)).toBe(expected);
  });
});

describe('WEBHOOK_EVENTS catalog', () => {
  it('contains every event that handler code currently emits', () => {
    // These are the events `dispatchWebhook` / `queueWebhook` is called
    // with across the codebase. If an event is emitted but not listed
    // in the catalog, `dispatchWebhook`'s `events: { has: event }`
    // filter silently drops every delivery — so this test doubles as
    // a guard against that very quiet failure mode.
    const emitted: WebhookEvent[] = [
      'voucher.redeemed', // app/api/merchant/[slug]/redeem/route.ts
      'voucher.purchased', // app/api/stripe/webhook/route.ts
      'voucher.expired', // app/api/cron/auto-expire/route.ts
      'voucher.flash_sale_started', // app/api/merchant/[slug]/vouchers/[id]/flash-sale/route.ts
      'campaign.started', // app/api/campaigns/[id]/route.ts (PUT)
      'campaign.ended', // app/api/campaigns/[id]/route.ts + auto-expire cron
      'ticket.redeemed', // app/api/merchant/[slug]/redeem/route.ts
      'gift_card.redeemed', // app/api/merchant/[slug]/redeem/route.ts
      'redemption.created', // app/api/redemptions/route.ts + commerce webhook
      'redemption.confirmed', // app/api/redemptions/[id]/confirm + commerce webhook
      'review.created', // app/api/reviews/route.ts
      'subscription.created', // app/api/subscription-boxes/[id]/subscribe/route.ts
      'booking.created', // app/api/rentals/route.ts
      'test.ping', // app/api/merchant/[slug]/webhooks/[id]/test/route.ts
    ];
    for (const ev of emitted) {
      expect(WEBHOOK_EVENTS).toContain(ev);
    }
  });

  it('has no duplicate entries', () => {
    const set = new Set(WEBHOOK_EVENTS);
    expect(set.size).toBe(WEBHOOK_EVENTS.length);
  });

  it('has at least one entry per product surface', () => {
    const prefixes = new Set(WEBHOOK_EVENTS.map((e) => e.split('.')[0]));
    // voucher, ticket, gift_card, campaign, redemption, review — the
    // main surfaces that today or tomorrow want merchant notification.
    expect(prefixes).toContain('voucher');
    expect(prefixes).toContain('ticket');
    expect(prefixes).toContain('gift_card');
    expect(prefixes).toContain('campaign');
    expect(prefixes).toContain('redemption');
    expect(prefixes).toContain('review');
    expect(prefixes).toContain('subscription');
    expect(prefixes).toContain('booking');
  });
});
