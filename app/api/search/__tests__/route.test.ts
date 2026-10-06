import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// /search used to return nothing on a site with live campaigns, because only
// published vouchers were searched. Active campaigns are now included.

const voucherFindMany = vi.fn();
const voucherCount = vi.fn();
const campaignFindMany = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    voucher: {
      findMany: (...a: unknown[]) => voucherFindMany(...a),
      count: (...a: unknown[]) => voucherCount(...a),
    },
    campaign: { findMany: (...a: unknown[]) => campaignFindMany(...a) },
  },
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { GET } from '../route';

const merchant = { id: 'm1', name: 'Corner Cafe', slug: 'corner-cafe', brandLogoUrl: null, defaultCurrency: 'EUR' };
const campaigns = [
  { id: 'c1', name: 'Espresso happy hour', description: null, price: 0, endDate: new Date('2030-01-01'), merchant },
  { id: 'c2', name: 'Sunset hike', description: 'Guided trail walk', price: 1500, endDate: new Date('2030-01-01'), merchant },
];

function get(query: string) {
  return GET(new NextRequest(`http://localhost:3000/api/search?${query}`));
}

beforeEach(() => {
  voucherFindMany.mockReset().mockResolvedValue([]);
  voucherCount.mockReset().mockResolvedValue(0);
  campaignFindMany.mockReset().mockResolvedValue(campaigns);
});

describe('GET /api/search', () => {
  it('returns matching active campaigns alongside vouchers', async () => {
    const res = await get('q=espresso');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.campaigns.map((c: { id: string }) => c.id)).toEqual(['c1', 'c2']);
    expect(body.campaigns[0]).toMatchObject({ categoryId: 'cafe', categoryLabel: 'Cafe & bakery', currency: 'EUR' });

    const where = campaignFindMany.mock.calls[0][0].where;
    // Same "active" rules as the /campaigns marketplace.
    expect(where.status).toBe('active');
    expect(where.merchant).toEqual({ isActive: true });
    expect(where.startDate.lte).toBeInstanceOf(Date);
    expect(where.endDate.gte).toBeInstanceOf(Date);
    expect(JSON.stringify(where.AND)).toContain('espresso');
  });

  it('filters campaigns by the same derived category as /campaigns', async () => {
    const body = await (await get('category=outdoor')).json();
    expect(body.campaigns.map((c: { id: string }) => c.id)).toEqual(['c2']);
  });

  it('narrows to the category in the database before the row cap', async () => {
    await get('category=outdoor');
    const where = campaignFindMany.mock.calls[0][0].where;
    // Category terms are part of the query, so older matches are not cut off
    // by newer campaigns from other categories.
    expect(JSON.stringify(where.AND)).toContain('hike');
    expect(JSON.stringify(where.AND)).toContain('matk');
  });

  it('orders campaigns by the same Sort choice as vouchers', async () => {
    await get('sort=expiring');
    expect(campaignFindMany.mock.calls[0][0].orderBy).toEqual({ endDate: 'asc' });
    campaignFindMany.mockClear();
    await get('sort=popular');
    expect(campaignFindMany.mock.calls[0][0].orderBy).toEqual({ purchases: { _count: 'desc' } });
    campaignFindMany.mockClear();
    await get('');
    expect(campaignFindMany.mock.calls[0][0].orderBy).toEqual({ createdAt: 'desc' });
  });

  it('leaves campaigns out when a voucher-only filter is set', async () => {
    const body = await (await get('type=percentage')).json();
    expect(body.campaigns).toEqual([]);
    expect(campaignFindMany).not.toHaveBeenCalled();
  });
});
