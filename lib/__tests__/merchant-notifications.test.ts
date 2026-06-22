/**
 * Unit tests for lib/merchant-notifications.ts.
 *
 * Covers:
 * - parsePrefs tolerates garbage input (non-object, array, non-boolean values)
 * - resolvePrefs fills defaults and forces required=true
 * - shouldNotifyMember short-circuits unknown categories / forces required ones
 * - getMembersToNotify filters opted-out members and members missing email
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const { merchantMemberFindUnique, merchantMemberFindMany } = vi.hoisted(() => ({
  merchantMemberFindUnique: vi.fn(),
  merchantMemberFindMany: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    merchantMember: {
      findUnique: merchantMemberFindUnique,
      findMany: merchantMemberFindMany,
    },
  },
}));

import {
  MERCHANT_NOTIFICATION_CATEGORIES,
  parsePrefs,
  resolvePrefs,
  shouldNotifyMember,
  getMembersToNotify,
} from '../merchant-notifications';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('parsePrefs', () => {
  it('returns {} for non-object input', () => {
    expect(parsePrefs(null)).toEqual({});
    expect(parsePrefs(undefined)).toEqual({});
    expect(parsePrefs('str')).toEqual({});
    expect(parsePrefs(42)).toEqual({});
    expect(parsePrefs([])).toEqual({}); // array is not a valid prefs map
  });

  it('drops non-boolean values', () => {
    const out = parsePrefs({ orders: true, payouts: 'yes', weekly_digest: 0, x: null });
    expect(out).toEqual({ orders: true });
  });
});

describe('resolvePrefs', () => {
  it('applies defaults for every category when stored is empty', () => {
    const resolved = resolvePrefs({});
    for (const cat of MERCHANT_NOTIFICATION_CATEGORIES) {
      expect(resolved[cat.key]).toBe(cat.required ? true : cat.defaultEnabled);
    }
  });

  it('honors explicit overrides for non-required categories', () => {
    const resolved = resolvePrefs({ weekly_digest: true, orders: false });
    expect(resolved.weekly_digest).toBe(true); // default was false
    expect(resolved.orders).toBe(false); // default was true
  });

  it('forces required categories on regardless of stored value', () => {
    const resolved = resolvePrefs({ fraud_alerts: false });
    expect(resolved.fraud_alerts).toBe(true);
  });
});

describe('shouldNotifyMember', () => {
  it('returns false for unknown category', async () => {
    expect(await shouldNotifyMember('m1', 'u1', 'made_up')).toBe(false);
    expect(merchantMemberFindUnique).not.toHaveBeenCalled();
  });

  it('returns true for required category without hitting DB', async () => {
    expect(await shouldNotifyMember('m1', 'u1', 'fraud_alerts')).toBe(true);
    expect(merchantMemberFindUnique).not.toHaveBeenCalled();
  });

  it('returns false when user is not a member', async () => {
    merchantMemberFindUnique.mockResolvedValue(null);
    expect(await shouldNotifyMember('m1', 'u1', 'orders')).toBe(false);
  });

  it('falls back to category default when stored pref is missing', async () => {
    merchantMemberFindUnique.mockResolvedValue({ notificationPrefs: {} });
    // 'orders' default is true, 'weekly_digest' default is false
    expect(await shouldNotifyMember('m1', 'u1', 'orders')).toBe(true);
    expect(await shouldNotifyMember('m1', 'u1', 'weekly_digest')).toBe(false);
  });

  it('respects stored boolean when present', async () => {
    merchantMemberFindUnique.mockResolvedValue({
      notificationPrefs: { orders: false, weekly_digest: true },
    });
    expect(await shouldNotifyMember('m1', 'u1', 'orders')).toBe(false);
    expect(await shouldNotifyMember('m1', 'u1', 'weekly_digest')).toBe(true);
  });
});

describe('getMembersToNotify', () => {
  it('returns empty array for unknown category', async () => {
    const out = await getMembersToNotify('m1', 'made_up');
    expect(out).toEqual([]);
    expect(merchantMemberFindMany).not.toHaveBeenCalled();
  });

  it('filters out opted-out members for non-required category', async () => {
    merchantMemberFindMany.mockResolvedValue([
      {
        notificationPrefs: { weekly_digest: true },
        user: { id: 'u1', email: 'a@b.com', name: 'A' },
      },
      {
        notificationPrefs: { weekly_digest: false },
        user: { id: 'u2', email: 'b@b.com', name: 'B' },
      },
      {
        notificationPrefs: {}, // default=false for weekly_digest
        user: { id: 'u3', email: 'c@b.com', name: 'C' },
      },
    ]);
    const out = await getMembersToNotify('m1', 'weekly_digest');
    expect(out).toEqual([{ userId: 'u1', email: 'a@b.com', name: 'A' }]);
  });

  it('includes every member for required category regardless of prefs', async () => {
    merchantMemberFindMany.mockResolvedValue([
      {
        notificationPrefs: { fraud_alerts: false }, // ignored
        user: { id: 'u1', email: 'a@b.com', name: 'A' },
      },
      {
        notificationPrefs: {},
        user: { id: 'u2', email: 'b@b.com', name: 'B' },
      },
    ]);
    const out = await getMembersToNotify('m1', 'fraud_alerts');
    expect(out).toHaveLength(2);
  });

  it('skips members without an email', async () => {
    merchantMemberFindMany.mockResolvedValue([
      {
        notificationPrefs: {},
        user: { id: 'u1', email: 'a@b.com', name: 'A' },
      },
      {
        notificationPrefs: {},
        user: { id: 'u2', email: null, name: 'B' },
      },
    ]);
    const out = await getMembersToNotify('m1', 'orders');
    expect(out).toEqual([{ userId: 'u1', email: 'a@b.com', name: 'A' }]);
  });
});
