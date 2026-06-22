import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/merchant/[slug]/webhooks/route';
import { NextRequest } from 'next/server';
import {
  createTestUser,
  createTestMerchant,
  createMerchantMember,
  prisma,
} from '../helpers';
import { auth } from '@/lib/auth';

// Handler-level integration test for /api/merchant/[slug]/webhooks.
// Covers RBAC (must be merchant_admin via MerchantMember), the SSRF
// guard on the URL, and the HMAC secret generation contract. Gated
// by VITEST_INCLUDE_INTEGRATION=1 via the lib/__tests__/api/** rule.

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('API: /api/merchant/[slug]/webhooks', () => {
  let userId: string;
  let merchantId: string;
  const slug = 'webhooks-test-merchant';
  const email = 'webhooks-integration@example.com';

  beforeEach(async () => {
    const user = await createTestUser(email);
    userId = user.id;
    const merchant = await createTestMerchant(slug);
    merchantId = merchant.id;
    await createMerchantMember(userId, merchantId, 'merchant_admin');
  });

  afterEach(async () => {
    await prisma.webhookDelivery.deleteMany({
      where: { endpoint: { merchantId } },
    });
    await prisma.webhookEndpoint.deleteMany({ where: { merchantId } });
    await prisma.merchantMember.deleteMany({ where: { merchantId } });
    await prisma.merchant.deleteMany({ where: { id: merchantId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  function mockAuth(session: unknown) {
    vi.mocked(auth).mockResolvedValue(session as any);
  }

  function params() {
    return { params: Promise.resolve({ slug }) };
  }

  // ---------------------------------------------------------------
  // GET
  // ---------------------------------------------------------------

  it('GET: returns 401 when unauthenticated', async () => {
    mockAuth(null);

    const response = await GET(
      new NextRequest(`http://localhost:3000/api/merchant/${slug}/webhooks`, { method: 'GET' }),
      params(),
    );
    expect(response.status).toBe(401);
  });

  it('GET: lists endpoints for the merchant, newest first', async () => {
    await prisma.webhookEndpoint.createMany({
      data: [
        { merchantId, url: 'https://old.example.com/hook', secret: 'a'.repeat(64), events: ['voucher.redeemed'], createdAt: new Date(Date.now() - 10000) },
        { merchantId, url: 'https://new.example.com/hook', secret: 'b'.repeat(64), events: ['campaign.ended'], createdAt: new Date() },
      ],
    });

    mockAuth({ user: { id: userId, email } });

    const response = await GET(
      new NextRequest(`http://localhost:3000/api/merchant/${slug}/webhooks`, { method: 'GET' }),
      params(),
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(2);
    expect(data[0].url).toBe('https://new.example.com/hook');
  });

  // ---------------------------------------------------------------
  // POST
  // ---------------------------------------------------------------

  function postRequest(body: unknown): NextRequest {
    return new NextRequest(`http://localhost:3000/api/merchant/${slug}/webhooks`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('POST: returns 401 when unauthenticated', async () => {
    mockAuth(null);

    const response = await POST(
      postRequest({ url: 'https://example.com/hook', events: ['voucher.redeemed'] }),
      params(),
    );
    expect(response.status).toBe(401);
  });

  it('POST: rejects non-HTTPS URLs with 400', async () => {
    mockAuth({ user: { id: userId, email } });

    const response = await POST(
      postRequest({ url: 'http://example.com/hook', events: ['voucher.redeemed'] }),
      params(),
    );
    expect(response.status).toBe(400);
  });

  it('POST: rejects localhost URLs (SSRF guard) with 400', async () => {
    mockAuth({ user: { id: userId, email } });

    const response = await POST(
      postRequest({ url: 'https://localhost/hook', events: ['voucher.redeemed'] }),
      params(),
    );
    expect(response.status).toBe(400);
  });

  it('POST: rejects private-IP URLs (SSRF guard) with 400', async () => {
    mockAuth({ user: { id: userId, email } });

    const response = await POST(
      postRequest({ url: 'https://192.168.1.1/hook', events: ['voucher.redeemed'] }),
      params(),
    );
    expect(response.status).toBe(400);
  });

  it('POST: rejects empty events array with 400', async () => {
    mockAuth({ user: { id: userId, email } });

    const response = await POST(
      postRequest({ url: 'https://example.com/hook', events: [] }),
      params(),
    );
    expect(response.status).toBe(400);
  });

  it('POST: creates an endpoint with a 64-char hex HMAC secret', async () => {
    mockAuth({ user: { id: userId, email } });

    const response = await POST(
      postRequest({ url: 'https://example.com/hook', events: ['voucher.redeemed', 'campaign.ended'] }),
      params(),
    );
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.url).toBe('https://example.com/hook');
    expect(data.events).toEqual(['voucher.redeemed', 'campaign.ended']);
    expect(data.secret).toMatch(/^[0-9a-f]{64}$/);

    // Secret is persisted.
    const persisted = await prisma.webhookEndpoint.findUnique({ where: { id: data.id } });
    expect(persisted?.secret).toBe(data.secret);
  });
});
