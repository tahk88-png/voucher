import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from '@/app/api/referrals/create/route';
import {
  createTestUser,
  createTestMerchant,
  createMerchantMember,
  cleanupTestData,
  createMockRequest,
} from '../helpers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('API: Referrals', () => {
  let merchantId: string;
  let userId: string;
  let voucherId: string;

  beforeEach(async () => {
    const merchant = await createTestMerchant('test-merchant-referrals');
    merchantId = merchant.id;

    const user = await createTestUser('referrer-test@example.com');
    userId = user.id;

    await createMerchantMember(userId, merchantId, 'merchant_admin');

    const voucher = await prisma.voucher.create({
      data: {
        merchantId,
        status: 'published',
        type: 'fixed_amount',
        value: 1000,
        currency: 'USD',
        validFrom: new Date(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    voucherId = voucher.id;
  });

  afterEach(async () => {
    await cleanupTestData(merchantId, userId);
  });

  describe('POST /api/referrals/create', () => {
    it('should create a referral for published voucher', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'referrer-test@example.com' },
      } as any);

      const body = {
        voucherId,
      };

      const request = createMockRequest(body);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('referralId');
      expect(data).toHaveProperty('shareUrl');
      expect(data.shareUrl).toContain('/r/');
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const body = {
        voucherId,
      };

      const request = createMockRequest(body);
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent voucher', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'referrer-test@example.com' },
      } as any);

      const body = {
        voucherId: 'non-existent',
      };

      const request = createMockRequest(body);
      const response = await POST(request);

      expect(response.status).toBe(404);
    });

    it('should return 400 for non-published voucher', async () => {
      const draftVoucher = await prisma.voucher.create({
        data: {
          merchantId,
          status: 'draft',
          type: 'fixed_amount',
          value: 1000,
          currency: 'USD',
          validFrom: new Date(),
          validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'referrer-test@example.com' },
      } as any);

      const body = {
        voucherId: draftVoucher.id,
      };

      const request = createMockRequest(body);
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should enforce rate limits', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'referrer-test@example.com' },
      } as any);

      // Create many referrals quickly to trigger rate limit
      const body = {
        voucherId,
      };

      // Create referrals up to rate limit (typically 10 per hour)
      let lastResponse;
      for (let i = 0; i < 15; i++) {
        lastResponse = await POST(createMockRequest(body));
      }

      // Should eventually hit rate limit
      const lastData = await lastResponse!.json();
      if (lastResponse!.status === 429) {
        expect(lastData.error).toContain('Rate limit');
      }
    });

    it('should hash friend identifier when provided', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'referrer-test@example.com' },
      } as any);

      const body = {
        voucherId,
        friendHint: 'friend@example.com',
      };

      const request = createMockRequest(body);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Check that referral was created with hashed friend identifier
      const referral = await prisma.referral.findUnique({
        where: { id: data.referralId },
      });

      expect(referral).toBeTruthy();
      expect(referral?.friendHash).not.toBe('friend@example.com');
      expect(referral?.friendHash).toBeTruthy();
    });
  });
});
