import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET } from '@/app/api/cron/auto-expire/route';
import { NextRequest } from 'next/server';
import { createTestMerchant, prisma } from '../helpers';

// Integration test for /api/cron/auto-expire. Exercises the real
// Prisma status transitions on Voucher (published → expired) and
// Campaign (active → ended), as driven by `validTo` / `endDate`
// crossing into the past.
//
// Gated by VITEST_INCLUDE_INTEGRATION=1 via the lib/__tests__/api/**
// exclude rule in vitest.config.ts.

// Don't actually emit HTTP webhooks during the test — the cron's
// `queueWebhook` call would trigger `prisma.webhookEndpoint.findMany`,
// which is fine on an empty table, but skipping the fetch explicitly
// keeps the test independent of outbound networking.
vi.mock('@/lib/webhooks', async () => {
  const actual = await vi.importActual<typeof import('@/lib/webhooks')>('@/lib/webhooks');
  return {
    ...actual,
    queueWebhook: vi.fn(),
  };
});

describe('API: /api/cron/auto-expire (GET)', () => {
  let merchantId: string;
  const slug = 'auto-expire-test-merchant';

  beforeEach(async () => {
    const merchant = await createTestMerchant(slug);
    merchantId = merchant.id;
  });

  afterEach(async () => {
    await prisma.voucher.deleteMany({ where: { merchantId } });
    await prisma.campaign.deleteMany({ where: { merchantId } });
    await prisma.merchant.deleteMany({ where: { id: merchantId } });
    vi.clearAllMocks();
  });

  function cronRequest(): NextRequest {
    return new NextRequest('http://localhost:3000/api/cron/auto-expire', {
      method: 'GET',
      headers: { authorization: `Bearer ${process.env.CRON_SECRET || 'test-secret'}` },
    });
  }

  it('flips published vouchers past validTo to expired', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const expiredId = (await prisma.voucher.create({
      data: {
        merchantId,
        status: 'published',
        type: 'fixed_amount',
        value: 500,
        currency: 'EUR',
        validFrom: new Date(Date.now() - 48 * 60 * 60 * 1000),
        validTo: yesterday,
      },
      select: { id: true },
    })).id;

    const stillValidId = (await prisma.voucher.create({
      data: {
        merchantId,
        status: 'published',
        type: 'fixed_amount',
        value: 500,
        currency: 'EUR',
        validFrom: new Date(Date.now() - 48 * 60 * 60 * 1000),
        validTo: tomorrow,
      },
      select: { id: true },
    })).id;

    const response = await GET(cronRequest());
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.vouchersExpired).toBeGreaterThanOrEqual(1);

    const [expired, stillValid] = await Promise.all([
      prisma.voucher.findUnique({ where: { id: expiredId }, select: { status: true } }),
      prisma.voucher.findUnique({ where: { id: stillValidId }, select: { status: true } }),
    ]);
    expect(expired?.status).toBe('expired');
    expect(stillValid?.status).toBe('published');
  });

  it('flips active campaigns past endDate to ended', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const endedId = (await prisma.campaign.create({
      data: {
        merchantId,
        name: 'Expired Summer Sale',
        type: 'limited',
        status: 'active',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: yesterday,
      },
      select: { id: true },
    })).id;

    const stillActiveId = (await prisma.campaign.create({
      data: {
        merchantId,
        name: 'Ongoing Winter Promo',
        type: 'limited',
        status: 'active',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: tomorrow,
      },
      select: { id: true },
    })).id;

    const response = await GET(cronRequest());
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.campaignsEnded).toBeGreaterThanOrEqual(1);

    const [ended, stillActive] = await Promise.all([
      prisma.campaign.findUnique({ where: { id: endedId }, select: { status: true } }),
      prisma.campaign.findUnique({ where: { id: stillActiveId }, select: { status: true } }),
    ]);
    expect(ended?.status).toBe('ended');
    expect(stillActive?.status).toBe('active');
  });

  it('queues a webhook per expired voucher and ended campaign', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await prisma.voucher.create({
      data: {
        merchantId,
        status: 'published',
        type: 'fixed_amount',
        value: 500,
        currency: 'EUR',
        validFrom: new Date(Date.now() - 48 * 60 * 60 * 1000),
        validTo: yesterday,
      },
    });
    await prisma.campaign.create({
      data: {
        merchantId,
        name: 'Old Promo',
        type: 'limited',
        status: 'active',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: yesterday,
      },
    });

    const { queueWebhook } = await import('@/lib/webhooks');

    await GET(cronRequest());

    const events = (queueWebhook as unknown as ReturnType<typeof vi.fn>).mock.calls.map(
      ([, event]) => event as string,
    );
    expect(events).toContain('voucher.expired');
    expect(events).toContain('campaign.ended');
  });

  it('is a no-op when nothing has expired', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.voucher.create({
      data: {
        merchantId,
        status: 'published',
        type: 'fixed_amount',
        value: 500,
        currency: 'EUR',
        validFrom: new Date(Date.now() - 48 * 60 * 60 * 1000),
        validTo: tomorrow,
      },
    });

    const response = await GET(cronRequest());
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.vouchersExpired).toBe(0);
    expect(data.campaignsEnded).toBe(0);
  });
});
