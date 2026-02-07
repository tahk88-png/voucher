import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST, GET } from '@/app/api/campaigns/route';
import {
  createTestUser,
  createTestMerchant,
  createMerchantMember,
  cleanupTestData,
  createMockRequest,
} from '../helpers';
import { auth } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('API: Campaigns', () => {
  let merchantId: string;
  let userId: string;

  beforeEach(async () => {
    const merchant = await createTestMerchant('test-merchant-campaigns');
    merchantId = merchant.id;

    const user = await createTestUser('campaign-test@example.com');
    userId = user.id;

    await createMerchantMember(userId, merchantId, 'merchant_admin');
  });

  afterEach(async () => {
    await cleanupTestData(merchantId, userId);
  });

  describe('POST /api/campaigns', () => {
    it('should create a campaign when authenticated as merchant admin', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'campaign-test@example.com' },
      } as any);

      const body = {
        merchantId,
        name: 'Test Campaign',
        type: 'limited',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        price: 1000,
        creditPercentage: 500, // 5%
      };

      const request = createMockRequest(body);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data.name).toBe('Test Campaign');
      expect(data.type).toBe('limited');
      expect(data.status).toBe('draft');
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const body = {
        merchantId,
        name: 'Test Campaign',
        type: 'limited',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const request = createMockRequest(body);
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent merchant', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'campaign-test@example.com' },
      } as any);

      const body = {
        merchantId: 'non-existent',
        name: 'Test Campaign',
        type: 'limited',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const request = createMockRequest(body);
      const response = await POST(request);

      expect(response.status).toBe(404);
    });

    it('should validate input schema', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'campaign-test@example.com' },
      } as any);

      const body = {
        merchantId,
        name: '',
        type: 'invalid',
      };

      const request = createMockRequest(body);
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/campaigns', () => {
    it('should return campaigns for merchant', async () => {
      const { prisma } = await import('../helpers');
      await prisma.campaign.create({
        data: {
          merchantId,
          name: 'Active Campaign',
          type: 'limited',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'active',
        },
      });

      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'campaign-test@example.com' },
      } as any);

      const request = createMockRequest();
      const url = new URL('http://localhost:3000/api/campaigns?merchantId=' + merchantId);
      const getRequest = new NextRequest(url, { method: 'GET' });
      const response = await GET(getRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should require merchantId parameter', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: userId, email: 'campaign-test@example.com' },
      } as any);

      const url = new URL('http://localhost:3000/api/campaigns');
      const getRequest = new NextRequest(url, { method: 'GET' });
      const response = await GET(getRequest);

      expect(response.status).toBe(400);
    });
  });
});
