import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET } from '@/app/api/cashback/summary/route';
import { createTestUser, createTestMerchant, prisma } from '../helpers';
import { auth } from '@/lib/auth';

// Handler-level integration test for /api/cashback/summary. Exercises
// the real Prisma aggregation that powers the user wallet's "available /
// locked / used / expired / expiring soon" rollup. Gated by
// VITEST_INCLUDE_INTEGRATION=1 via the lib/__tests__/api/** rule.

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('API: /api/cashback/summary (GET)', () => {
  let userId: string;
  let merchantAId: string;
  let merchantBId: string;
  const email = 'cashback-integration@example.com';

  beforeEach(async () => {
    const user = await createTestUser(email);
    userId = user.id;

    const a = await createTestMerchant('cashback-test-a');
    const b = await createTestMerchant('cashback-test-b');
    merchantAId = a.id;
    merchantBId = b.id;
  });

  afterEach(async () => {
    await prisma.creditLedger.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.merchant.deleteMany({ where: { id: { in: [merchantAId, merchantBId] } } });
  });

  function mockAuth(session: unknown) {
    vi.mocked(auth).mockResolvedValue(session as any);
  }

  it('returns 401 when unauthenticated', async () => {
    mockAuth(null);

    const response = await GET();
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('unauthorized');
  });

  it('returns zeroed totals when the user has no credit entries', async () => {
    mockAuth({ user: { id: userId, email } });

    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.totals).toEqual({ available: 0, locked: 0, used: 0, expired: 0, total: 0 });
    expect(data.byMerchant).toEqual([]);
    expect(data.expiringSoon).toEqual([]);
    expect(data.currencies).toEqual([]);
  });

  it('aggregates totals, byMerchant, and expiringSoon across two merchants', async () => {
    const now = new Date();
    const inTenDays = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const inSixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const alreadyExpired = new Date(now.getTime() - 1000);

    await prisma.creditLedger.createMany({
      data: [
        // Merchant A: €10 available (expiring soon), €5 locked, €3 used.
        { userId, merchantId: merchantAId, amount: 1000, currency: 'EUR', status: 'available', source: 'referral_redemption', sourceId: 'a-1', expiresAt: inTenDays },
        { userId, merchantId: merchantAId, amount: 500, currency: 'EUR', status: 'locked', source: 'referral_redemption', sourceId: 'a-2' },
        { userId, merchantId: merchantAId, amount: 300, currency: 'EUR', status: 'used', source: 'manual_adjustment', sourceId: 'a-3' },

        // Merchant B: €20 available (expires in 60 days — NOT expiring soon),
        // €7 expired.
        { userId, merchantId: merchantBId, amount: 2000, currency: 'USD', status: 'available', source: 'referral_redemption', sourceId: 'b-1', expiresAt: inSixtyDays },
        { userId, merchantId: merchantBId, amount: 700, currency: 'USD', status: 'expired', source: 'referral_redemption', sourceId: 'b-2', expiresAt: alreadyExpired },
      ],
    });

    mockAuth({ user: { id: userId, email } });

    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();

    // Grand totals.
    expect(data.totals.available).toBe(1000 + 2000);
    expect(data.totals.locked).toBe(500);
    expect(data.totals.used).toBe(300);
    expect(data.totals.expired).toBe(700);
    expect(data.totals.total).toBe(1000 + 500 + 300 + 2000 + 700);

    // Per-merchant rollup — sorted by (available + locked) desc.
    expect(data.byMerchant).toHaveLength(2);
    expect(data.byMerchant[0].merchantId).toBe(merchantBId); // 2000 + 0 > 1000 + 500
    expect(data.byMerchant[0].available).toBe(2000);
    expect(data.byMerchant[0].currency).toBe('USD');
    expect(data.byMerchant[1].merchantId).toBe(merchantAId);
    expect(data.byMerchant[1].available).toBe(1000);
    expect(data.byMerchant[1].locked).toBe(500);
    expect(data.byMerchant[1].used).toBe(300);

    // Expiring soon — only the 10-day-out entry qualifies.
    expect(data.expiringSoon).toHaveLength(1);
    expect(data.expiringSoon[0].amount).toBe(1000);
    expect(data.expiringSoon[0].merchantSlug).toBe('cashback-test-a');

    // Currencies — sorted, deduplicated.
    expect(data.currencies).toEqual(['EUR', 'USD']);
  });
});
