import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/reviews/route';
import { NextRequest } from 'next/server';
import { createTestUser, createTestMerchant, prisma } from '../helpers';
import { auth } from '@/lib/auth';

// Handler-level integration test for /api/reviews. Covers the list
// endpoint (GET with avg/rating aggregation) and the create endpoint
// (POST with auto-moderation + one-per-user-per-target guard). Gated
// by VITEST_INCLUDE_INTEGRATION=1 via the lib/__tests__/api/** rule.

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('API: /api/reviews', () => {
  let userId: string;
  let otherUserId: string;
  let merchantId: string;
  const email = 'reviews-integration@example.com';
  const otherEmail = 'reviews-other@example.com';

  beforeEach(async () => {
    const user = await createTestUser(email);
    userId = user.id;
    const other = await createTestUser(otherEmail);
    otherUserId = other.id;
    const merchant = await createTestMerchant('reviews-test-merchant');
    merchantId = merchant.id;
  });

  afterEach(async () => {
    await prisma.reviewVote.deleteMany({ where: { review: { merchantId } } });
    await prisma.review.deleteMany({ where: { merchantId } });
    await prisma.merchant.deleteMany({ where: { id: merchantId } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  });

  function mockAuth(session: unknown) {
    vi.mocked(auth).mockResolvedValue(session as any);
  }

  // ---------------------------------------------------------------
  // GET /api/reviews
  // ---------------------------------------------------------------

  describe('GET', () => {
    function listRequest(params: Record<string, string>): NextRequest {
      const url = new URL('http://localhost:3000/api/reviews');
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
      return new NextRequest(url, { method: 'GET' });
    }

    it('returns 400 when no target id is provided', async () => {
      const response = await GET(listRequest({}));
      expect(response.status).toBe(400);
    });

    it('lists published reviews for a merchant with avg rating', async () => {
      await prisma.review.createMany({
        data: [
          { userId, merchantId, rating: 5, comment: 'great', status: 'published' },
          { userId: otherUserId, merchantId, rating: 3, comment: 'ok', status: 'published' },
          { userId: otherUserId, merchantId, rating: 1, comment: 'banned content', status: 'hidden' },
        ],
      });

      const response = await GET(listRequest({ merchantId }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total).toBe(2); // hidden excluded
      expect(data.totalReviews).toBe(2);
      expect(data.avgRating).toBe(4); // (5 + 3) / 2
      expect(data.reviews).toHaveLength(2);
    });

    it('sorts by rating desc when sort=highest', async () => {
      await prisma.review.createMany({
        data: [
          { userId, merchantId, rating: 3, status: 'published' },
          { userId: otherUserId, merchantId, rating: 5, status: 'published' },
        ],
      });

      const response = await GET(listRequest({ merchantId, sort: 'highest' }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reviews[0].rating).toBe(5);
      expect(data.reviews[1].rating).toBe(3);
    });
  });

  // ---------------------------------------------------------------
  // POST /api/reviews
  // ---------------------------------------------------------------

  describe('POST', () => {
    function createRequest(body: unknown): NextRequest {
      return new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });
    }

    it('returns 401 when unauthenticated', async () => {
      mockAuth(null);

      const response = await POST(createRequest({ merchantId, rating: 5 }));
      expect(response.status).toBe(401);
    });

    it('returns 400 when rating is out of 1–5 range', async () => {
      mockAuth({ user: { id: userId, email } });

      const response = await POST(createRequest({ merchantId, rating: 6 }));
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toMatch(/rating/i);
    });

    it('returns 400 when no target id is provided', async () => {
      mockAuth({ user: { id: userId, email } });

      const response = await POST(createRequest({ rating: 4 }));
      expect(response.status).toBe(400);
    });

    it('creates a published review for clean content', async () => {
      mockAuth({ user: { id: userId, email } });

      const response = await POST(createRequest({
        merchantId,
        rating: 5,
        title: 'Loved it',
        comment: 'Great service, friendly staff.',
      }));
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.review.rating).toBe(5);
      expect(data.review.status).toBe('published');
      expect(data.moderation.status).toBe('published');
    });

    it('returns 409 on duplicate review from the same user', async () => {
      await prisma.review.create({
        data: { userId, merchantId, rating: 4, comment: 'first', status: 'published' },
      });

      mockAuth({ user: { id: userId, email } });

      const response = await POST(createRequest({ merchantId, rating: 5, comment: 'second' }));
      expect(response.status).toBe(409);
    });
  });
});
