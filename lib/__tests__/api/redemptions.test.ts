import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from '@/app/api/redemptions/route';
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

describe('API: Redemptions', () => {
  let merchantId: string;
  let userId: string;
  let referrerId: string;
  let voucherId: string;
  let referralId: string;

  beforeEach(async () => {
    const merchant = await createTestMerchant('test-merchant-redemptions');
    merchantId = merchant.id;

    const user = await createTestUser('redeemer@example.com');
    userId = user.id;

    const referrer = await createTestUser('referrer@example.com');
    referrerId = referrer.id;

    await createMerchantMember(referrerId, merchantId, 'merchant_admin');

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

    const referral = await prisma.referral.create({
      data: {
        voucherId,
        merchantId,
        referrerUserId: referrerId,
        friendHash: 'test_hash',
        status: 'created',
      },
    });
    referralId = referral.id;
  });

  afterEach(async () => {
    await cleanupTestData(merchantId);
  });

  describe('POST /api/redemptions', () => {
    it('should create a redemption for valid voucher', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'redeemer@example.com' },
      } as any);

      const body = {
        voucherId,
        method: 'online',
        amountBeforeDiscount: 10000,
        discountApplied: 1000,
        currency: 'USD',
      };

      const request = createMockRequest(body);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('redemptionId');
      expect(data.requiresConfirmation).toBe(false);
    });

    it('should create locked credit when referral exists', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'redeemer@example.com' },
      } as any);

      const body = {
        voucherId,
        referralId,
        method: 'online',
        amountBeforeDiscount: 10000,
        discountApplied: 1000,
        currency: 'USD',
      };

      const request = createMockRequest(body);
      await POST(request);

      const credit = await prisma.creditLedger.findFirst({
        where: {
          merchantId,
          userId: referrerId,
          status: 'locked',
        },
      });

      expect(credit).toBeTruthy();
      expect(credit?.amount).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent voucher', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'redeemer@example.com' },
      } as any);

      const body = {
        voucherId: 'non-existent',
        method: 'online',
        amountBeforeDiscount: 10000,
        discountApplied: 1000,
        currency: 'USD',
      };

      const request = createMockRequest(body);
      const response = await POST(request);

      expect(response.status).toBe(404);
    });

    it('should return 400 for expired voucher', async () => {
      const expiredVoucher = await prisma.voucher.create({
        data: {
          merchantId,
          status: 'published',
          type: 'fixed_amount',
          value: 1000,
          currency: 'USD',
          validFrom: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          validTo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      });

      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'redeemer@example.com' },
      } as any);

      const body = {
        voucherId: expiredVoucher.id,
        method: 'online',
        amountBeforeDiscount: 10000,
        discountApplied: 1000,
        currency: 'USD',
      };

      const request = createMockRequest(body);
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should prevent self-referral redemption', async () => {
      // Create referral where referrer is the same as redeemer
      const selfReferral = await prisma.referral.create({
        data: {
          voucherId,
          merchantId,
          referrerUserId: userId,
          friendHash: 'self_hash',
          status: 'created',
        },
      });

      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'redeemer@example.com' },
      } as any);

      const body = {
        voucherId,
        referralId: selfReferral.id,
        method: 'online',
        amountBeforeDiscount: 10000,
        discountApplied: 1000,
        currency: 'USD',
      };

      const request = createMockRequest(body);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('own referral');
    });

    it('should enforce usage limits', async () => {
      const limitedVoucher = await prisma.voucher.create({
        data: {
          merchantId,
          status: 'published',
          type: 'fixed_amount',
          value: 1000,
          currency: 'USD',
          validFrom: new Date(),
          validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          usageLimitTotal: 1,
        },
      });

      // Create one confirmed redemption
      await prisma.redemption.create({
        data: {
          voucherId: limitedVoucher.id,
          merchantId,
          method: 'online',
          amountBeforeDiscount: 10000,
          discountApplied: 1000,
          currency: 'USD',
          confirmedAt: new Date(),
        },
      });

      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'redeemer@example.com' },
      } as any);

      const body = {
        voucherId: limitedVoucher.id,
        method: 'online',
        amountBeforeDiscount: 10000,
        discountApplied: 1000,
        currency: 'USD',
      };

      const request = createMockRequest(body);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('limit reached');
    });
  });
});
