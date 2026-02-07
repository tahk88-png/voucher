import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST, GET } from '@/app/api/merchant/[slug]/vouchers/route';
import {
  createTestUser,
  createTestMerchant,
  createMerchantMember,
  cleanupTestData,
  createMockRequest,
} from '../helpers';
import { auth } from '@/lib/auth';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('API: Merchant Vouchers', () => {
  let merchantId: string;
  let userId: string;
  let merchantSlug: string;

  beforeEach(async () => {
    const merchant = await createTestMerchant('test-merchant-vouchers');
    merchantId = merchant.id;
    merchantSlug = merchant.slug;

    const user = await createTestUser('voucher-test@example.com');
    userId = user.id;

    await createMerchantMember(userId, merchantId, 'merchant_admin');
  });

  afterEach(async () => {
    await cleanupTestData(merchantId, userId);
  });

  describe('POST /api/merchant/[slug]/vouchers', () => {
    it('should create a voucher when authenticated as merchant admin', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'voucher-test@example.com' },
      } as any);

      const body = {
        type: 'fixed_amount',
        value: 1000,
        currency: 'USD',
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimitTotal: 100,
        codePrefix: 'TEST',
      };

      const request = createMockRequest(body);
      const response = await POST(request, { params: { slug: merchantSlug } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data.type).toBe('fixed_amount');
      expect(data.value).toBe(1000);
      expect(data.status).toBe('draft');
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const body = {
        type: 'fixed_amount',
        value: 1000,
        currency: 'USD',
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const request = createMockRequest(body);
      const response = await POST(request, { params: { slug: merchantSlug } });

      expect(response.status).toBe(401);
    });

    it('should return 404 when merchant not found', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'voucher-test@example.com' },
      } as any);

      const body = {
        type: 'fixed_amount',
        value: 1000,
        currency: 'USD',
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const request = createMockRequest(body);
      const response = await POST(request, { params: { slug: 'non-existent' } });

      expect(response.status).toBe(404);
    });

    it('should validate input schema', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'voucher-test@example.com' },
      } as any);

      const body = {
        type: 'invalid_type',
        value: -100,
      };

      const request = createMockRequest(body);
      const response = await POST(request, { params: { slug: merchantSlug } });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/merchant/[slug]/vouchers', () => {
    it('should return published vouchers for unauthenticated users', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      // Create a published voucher
      const { prisma } = await import('../helpers');
      await prisma.voucher.create({
        data: {
          merchantId,
          status: 'published',
          type: 'fixed_amount',
          value: 500,
          currency: 'USD',
          validFrom: new Date(),
          validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const request = createMockRequest();
      const response = await GET(request, { params: { slug: merchantSlug } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].status).toBe('published');
    });

    it('should return all vouchers for merchant staff', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'voucher-test@example.com' },
      } as any);

      const { prisma } = await import('../helpers');
      await prisma.voucher.create({
        data: {
          merchantId,
          status: 'draft',
          type: 'fixed_amount',
          value: 500,
          currency: 'USD',
          validFrom: new Date(),
          validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const request = createMockRequest();
      const response = await GET(request, { params: { slug: merchantSlug } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      // Should include draft vouchers for staff
    });
  });
});
