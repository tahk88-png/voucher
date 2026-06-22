/**
 * Unit tests for lib/email/suppression.ts.
 *
 * Covers:
 * - normalization of recipient addresses (lowercase/trim)
 * - Redis-backed caching layer, including miss → DB → cache-set
 * - cache invalidation on add/remove
 * - resilience to Redis outages
 * - the null-vs-expired-vs-permanent filter on EmailSuppression rows
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const { cacheGet, cacheSet, cacheDelete, suppressionFindFirst, suppressionFindUnique, suppressionUpsert, suppressionDelete } =
  vi.hoisted(() => ({
    cacheGet: vi.fn(),
    cacheSet: vi.fn(),
    cacheDelete: vi.fn(),
    suppressionFindFirst: vi.fn(),
    suppressionFindUnique: vi.fn(),
    suppressionUpsert: vi.fn(),
    suppressionDelete: vi.fn(),
  }));

vi.mock('@/lib/redis', () => ({
  cacheGet,
  cacheSet,
  cacheDelete,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    emailSuppression: {
      findFirst: suppressionFindFirst,
      findUnique: suppressionFindUnique,
      upsert: suppressionUpsert,
      delete: suppressionDelete,
    },
  },
}));

import {
  isEmailSuppressed,
  addSuppression,
  removeSuppression,
} from '../suppression';

beforeEach(() => {
  vi.clearAllMocks();
  cacheGet.mockResolvedValue(null);
  cacheSet.mockResolvedValue(undefined);
  cacheDelete.mockResolvedValue(undefined);
  suppressionFindFirst.mockResolvedValue(null);
  suppressionFindUnique.mockResolvedValue(null);
  suppressionUpsert.mockResolvedValue({});
  suppressionDelete.mockResolvedValue({});
});

describe('isEmailSuppressed', () => {
  it('returns false for unseen email and caches the negative result', async () => {
    const result = await isEmailSuppressed('NEW@example.com');

    expect(result).toEqual({ suppressed: false });
    expect(suppressionFindFirst).toHaveBeenCalledTimes(1);
    // Query uses normalized address
    expect(suppressionFindFirst.mock.calls[0][0].where.email).toBe(
      'new@example.com',
    );
    // Cache sentinel 'no' stored
    expect(cacheSet).toHaveBeenCalledWith(
      'email:suppressed:new@example.com',
      'no',
      expect.any(Number),
    );
  });

  it('returns true with reason for suppressed email and caches reason', async () => {
    suppressionFindFirst.mockResolvedValue({ reason: 'hard_bounce' });

    const result = await isEmailSuppressed('bad@x.com');

    expect(result).toEqual({ suppressed: true, reason: 'hard_bounce' });
    expect(cacheSet).toHaveBeenCalledWith(
      'email:suppressed:bad@x.com',
      'hard_bounce',
      expect.any(Number),
    );
  });

  it('hits cache and skips DB when cache says "no"', async () => {
    cacheGet.mockResolvedValue('no');

    const result = await isEmailSuppressed('cached@x.com');

    expect(result).toEqual({ suppressed: false });
    expect(suppressionFindFirst).not.toHaveBeenCalled();
  });

  it('hits cache with a reason and skips DB', async () => {
    cacheGet.mockResolvedValue('complaint');

    const result = await isEmailSuppressed('c@x.com');

    expect(result).toEqual({ suppressed: true, reason: 'complaint' });
    expect(suppressionFindFirst).not.toHaveBeenCalled();
  });

  it('falls through to DB when cache throws (Redis down)', async () => {
    cacheGet.mockRejectedValue(new Error('ECONNREFUSED'));
    suppressionFindFirst.mockResolvedValue({ reason: 'manual' });

    const result = await isEmailSuppressed('x@y.com');

    expect(result).toEqual({ suppressed: true, reason: 'manual' });
    expect(suppressionFindFirst).toHaveBeenCalledTimes(1);
  });

  it('includes the OR filter for null expiresAt and future expiresAt', async () => {
    await isEmailSuppressed('a@b.com');
    const where = suppressionFindFirst.mock.calls[0][0].where;
    expect(where.OR).toHaveLength(2);
    expect(where.OR[0]).toEqual({ expiresAt: null });
    expect(where.OR[1].expiresAt.gt).toBeInstanceOf(Date);
  });
});

describe('addSuppression', () => {
  it('upserts with normalized email and invalidates cache', async () => {
    await addSuppression({
      email: '  ADD@X.com  ',
      reason: 'hard_bounce',
      notes: 'bouncing',
    });

    expect(suppressionUpsert).toHaveBeenCalledTimes(1);
    const args = suppressionUpsert.mock.calls[0][0];
    expect(args.where).toEqual({
      email_reason: { email: 'add@x.com', reason: 'hard_bounce' },
    });
    expect(args.create.email).toBe('add@x.com');
    expect(args.create.source).toBe('webhook'); // default
    // Cache was invalidated for the normalized address
    expect(cacheDelete).toHaveBeenCalledWith('email:suppressed:add@x.com');
  });

  it('uses caller-provided source when passed', async () => {
    await addSuppression({
      email: 'a@b.com',
      reason: 'manual',
      source: 'admin_dashboard',
    });
    expect(suppressionUpsert.mock.calls[0][0].create.source).toBe(
      'admin_dashboard',
    );
  });

  it('does not throw when cache invalidation fails', async () => {
    cacheDelete.mockRejectedValue(new Error('redis down'));
    await expect(
      addSuppression({ email: 'a@b.com', reason: 'complaint' }),
    ).resolves.toBeUndefined();
    expect(suppressionUpsert).toHaveBeenCalled();
  });
});

describe('removeSuppression', () => {
  it('deletes by id and invalidates cache using fetched email', async () => {
    suppressionFindUnique.mockResolvedValue({ email: 'r@x.com' });

    await removeSuppression('sup-id-1');

    expect(suppressionDelete).toHaveBeenCalledWith({ where: { id: 'sup-id-1' } });
    expect(cacheDelete).toHaveBeenCalledWith('email:suppressed:r@x.com');
  });

  it('still deletes even if the prior findUnique returns null', async () => {
    suppressionFindUnique.mockResolvedValue(null);
    await expect(removeSuppression('sup-id-2')).resolves.toBeUndefined();
    expect(suppressionDelete).toHaveBeenCalled();
    expect(cacheDelete).not.toHaveBeenCalled();
  });
});
