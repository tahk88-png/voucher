import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET } from '@/app/api/loyalty/route';
import { NextRequest } from 'next/server';
import { createTestUser, prisma } from '../helpers';
import { auth } from '@/lib/auth';

// Handler-level integration test for /api/loyalty GET. Exercises the
// real Prisma client against the test database, but mocks auth() so
// we can swap session identities without a login flow. Gated behind
// VITEST_INCLUDE_INTEGRATION=1 via the lib/__tests__/api/** rule in
// vitest.config.ts.

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('API: /api/loyalty (GET)', () => {
  let userId: string;
  const email = 'loyalty-integration@example.com';

  beforeEach(async () => {
    const user = await createTestUser(email);
    userId = user.id;
  });

  afterEach(async () => {
    // Cascade deletes LoyaltyPointLog via the relation onDelete.
    await prisma.loyaltyAccount.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  function mockAuth(session: unknown) {
    vi.mocked(auth).mockResolvedValue(session as any);
  }

  function getRequest(): NextRequest {
    return new NextRequest('http://localhost:3000/api/loyalty', { method: 'GET' });
  }

  it('returns 401 when unauthenticated', async () => {
    mockAuth(null);

    const response = await GET(getRequest());
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('creates a loyalty account on first visit', async () => {
    mockAuth({ user: { id: userId, email } });

    // Sanity: no account exists yet.
    const before = await prisma.loyaltyAccount.findUnique({ where: { userId } });
    expect(before).toBeNull();

    const response = await GET(getRequest());
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.totalPoints).toBe(0);
    expect(data.lifetimePoints).toBe(0);
    expect(data.currentTier.name).toBe('bronze');
    expect(data.pointsHistory).toEqual([]);
    expect(Array.isArray(data.allTiers)).toBe(true);
    expect(data.allTiers.length).toBeGreaterThan(0);
    expect(data.allTiers.find((t: { isCurrent: boolean }) => t.isCurrent)).toMatchObject({ name: 'bronze' });

    const after = await prisma.loyaltyAccount.findUnique({ where: { userId } });
    expect(after).not.toBeNull();
    expect(after?.currentTier).toBe('bronze');
  });

  it('recomputes the tier when lifetimePoints crosses a threshold', async () => {
    // Create an account in a stale tier — bronze stored in DB but
    // lifetimePoints >= silver's 500 threshold (lib/loyalty-tiers.ts).
    // The route should correct it and persist the update in-place.
    await prisma.loyaltyAccount.create({
      data: {
        userId,
        totalPoints: 1500,
        lifetimePoints: 1500,
        currentTier: 'bronze',
      },
    });

    mockAuth({ user: { id: userId, email } });

    const response = await GET(getRequest());
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.currentTier.name).toBe('silver');

    const persisted = await prisma.loyaltyAccount.findUnique({ where: { userId } });
    expect(persisted?.currentTier).toBe('silver');
  });

  it('includes points history (most recent first, capped at 20)', async () => {
    const account = await prisma.loyaltyAccount.create({
      data: { userId, totalPoints: 500, lifetimePoints: 500, currentTier: 'bronze' },
    });

    // Insert 25 log rows — API should return 20.
    const now = Date.now();
    await prisma.loyaltyPointLog.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        loyaltyAccountId: account.id,
        points: 10,
        reason: 'purchase',
        description: `log-${i}`,
        createdAt: new Date(now - i * 1000),
      })),
    });

    mockAuth({ user: { id: userId, email } });

    const response = await GET(getRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pointsHistory).toHaveLength(20);
    // Newest first — log-0 has the latest createdAt.
    expect(data.pointsHistory[0].description).toBe('log-0');
  });
});
