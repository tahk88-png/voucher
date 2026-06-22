/**
 * Unit tests for lib/email/webhook-handler.ts — Resend webhook ingestion.
 *
 * Covers:
 * - event type mapping (sent / delivered / bounced / complained / opened)
 * - unknown / missing type is logged and dropped
 * - EmailEvent row creation + timestamp update
 * - hard bounce → hard_bounce suppression (permanent)
 * - soft bounce → soft_bounce suppression with 7-day expiration
 * - complaint → complaint suppression
 * - missing EmailMessage → warn + skip (no row created)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const { findFirst, eventCreate, messageUpdate, addSuppression, loggerWarn } =
  vi.hoisted(() => ({
    findFirst: vi.fn(),
    eventCreate: vi.fn(),
    messageUpdate: vi.fn(),
    addSuppression: vi.fn(),
    loggerWarn: vi.fn(),
  }));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    emailMessage: { findFirst, update: messageUpdate },
    emailEvent: { create: eventCreate },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: loggerWarn, info: vi.fn(), error: vi.fn() },
}));

vi.mock('../suppression', () => ({
  addSuppression,
}));

import { processResendWebhook } from '../webhook-handler';

beforeEach(() => {
  vi.clearAllMocks();
  findFirst.mockResolvedValue({ id: 'msg-1', to: 'recipient@example.com' });
});

const base = (type: string, extra: Record<string, unknown> = {}) => ({
  type,
  created_at: '2026-04-19T10:00:00Z',
  data: {
    email_id: 'resend-xyz',
    to: ['recipient@example.com'],
    from: 'noreply@vouchr.app',
    subject: 'Test',
    ...extra,
  },
});

describe('processResendWebhook', () => {
  it('drops events without a type', async () => {
    await processResendWebhook({});
    expect(loggerWarn).toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it('drops unknown event types', async () => {
    await processResendWebhook({ type: 'email.invented', data: { email_id: 'x' } });
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it('drops events without email_id', async () => {
    await processResendWebhook({ type: 'email.delivered' });
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it('skips (with warning) when no matching EmailMessage exists', async () => {
    findFirst.mockResolvedValue(null);
    await processResendWebhook(base('email.delivered'));
    expect(loggerWarn).toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
    expect(addSuppression).not.toHaveBeenCalled();
  });

  it('creates EmailEvent row and updates deliveredAt on email.delivered', async () => {
    await processResendWebhook(base('email.delivered'));

    expect(eventCreate).toHaveBeenCalledTimes(1);
    const eventArgs = eventCreate.mock.calls[0][0].data;
    expect(eventArgs.type).toBe('delivered');
    expect(eventArgs.provider).toBe('resend');
    expect(eventArgs.occurredAt).toBeInstanceOf(Date);

    // First update: deliveredAt timestamp. Second update: status = delivered.
    expect(messageUpdate).toHaveBeenCalledTimes(2);
    const firstUpdate = messageUpdate.mock.calls[0][0];
    expect(firstUpdate.data.deliveredAt).toBeInstanceOf(Date);
    const secondUpdate = messageUpdate.mock.calls[1][0];
    expect(secondUpdate.data.status).toBe('delivered');
  });

  it('updates openedAt on email.opened without changing status', async () => {
    await processResendWebhook(base('email.opened'));

    expect(messageUpdate).toHaveBeenCalledTimes(1);
    expect(messageUpdate.mock.calls[0][0].data.openedAt).toBeInstanceOf(Date);
  });

  it('updates clickedAt on email.clicked', async () => {
    await processResendWebhook(base('email.clicked'));
    expect(messageUpdate.mock.calls[0][0].data.clickedAt).toBeInstanceOf(Date);
  });

  it('hard bounce → adds permanent hard_bounce suppression', async () => {
    await processResendWebhook(base('email.bounced'));

    expect(addSuppression).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'recipient@example.com',
        reason: 'hard_bounce',
        source: 'webhook',
      }),
    );
    // No expiresAt => permanent
    expect(addSuppression.mock.calls[0][0].expiresAt).toBeUndefined();
  });

  it('soft bounce → adds soft_bounce suppression with 7-day expiration', async () => {
    const before = Date.now();
    await processResendWebhook(
      base('email.bounced', { bounce_type: 'soft' }),
    );
    const after = Date.now();

    expect(addSuppression).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'recipient@example.com',
        reason: 'soft_bounce',
      }),
    );
    const expires = addSuppression.mock.calls[0][0].expiresAt as Date;
    const expectedMin = before + 7 * 24 * 3600 * 1000 - 1000;
    const expectedMax = after + 7 * 24 * 3600 * 1000 + 1000;
    expect(expires.getTime()).toBeGreaterThanOrEqual(expectedMin);
    expect(expires.getTime()).toBeLessThanOrEqual(expectedMax);
  });

  it('complaint → adds complaint suppression', async () => {
    await processResendWebhook(base('email.complained'));

    expect(addSuppression).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'recipient@example.com',
        reason: 'complaint',
        source: 'webhook',
      }),
    );
  });

  it('email.sent creates event row but does NOT add suppression or update status', async () => {
    await processResendWebhook(base('email.sent'));

    expect(eventCreate).toHaveBeenCalled();
    expect(eventCreate.mock.calls[0][0].data.type).toBe('sent');
    expect(addSuppression).not.toHaveBeenCalled();
    // No timestamp field mapped for 'sent' → no update (status is already 'sent' at queue time)
    expect(messageUpdate).not.toHaveBeenCalled();
  });

  it('uses event.created_at for occurredAt when provided', async () => {
    await processResendWebhook(base('email.delivered'));
    const occurredAt = eventCreate.mock.calls[0][0].data.occurredAt as Date;
    expect(occurredAt.toISOString()).toBe('2026-04-19T10:00:00.000Z');
  });

  it('falls back to now() when created_at is missing', async () => {
    const before = Date.now();
    await processResendWebhook({
      type: 'email.delivered',
      data: { email_id: 'x' },
    });
    const after = Date.now();
    const ts = (eventCreate.mock.calls[0][0].data.occurredAt as Date).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after + 1000);
  });
});
