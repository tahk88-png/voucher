import { describe, it, expect, vi } from 'vitest';

/**
 * Every URL in the sitemap must be a page that exists. A crawl of the live
 * sitemap found only 38 of 350 URLs answering 200: it prefixed every URL with
 * every locale, but under /[locale] only the campaign list and campaign pages
 * exist — `/<locale>` redirects to `/`, and /m and /v pages have no locale
 * prefix — so it listed 24 redirects and a 404 for every merchant × locale.
 */

const { campaignFind, merchantFind, voucherFind } = vi.hoisted(() => ({
  campaignFind: vi.fn(),
  merchantFind: vi.fn(),
  voucherFind: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    campaign: { findMany: campaignFind },
    merchant: { findMany: merchantFind },
    voucher: { findMany: voucherFind },
  },
}));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

import sitemap from '@/app/sitemap';
import { routing } from '@/routing';

const d = new Date('2026-01-01');

describe('sitemap lists only pages that exist', () => {
  it('prefixes only routes that live under /[locale]', async () => {
    campaignFind.mockResolvedValue([{ id: 'camp1', updatedAt: d }]);
    merchantFind.mockResolvedValue([{ slug: 'coffee-house', updatedAt: d }]);
    voucherFind.mockResolvedValue([{ id: 'vouch1', updatedAt: d }]);

    const paths = (await sitemap()).map((e) => new URL(e.url).pathname);
    const nonDefault = routing.locales.filter((l) => l !== routing.defaultLocale);

    // Homepage once, unprefixed; never a redirecting /<locale> root.
    expect(paths.filter((p) => p === '/')).toHaveLength(1);
    for (const l of nonDefault) expect(paths).not.toContain(`/${l}`);

    // Merchant and voucher pages exist only without a locale prefix — once each.
    expect(paths.filter((p) => p === '/m/coffee-house')).toHaveLength(1);
    expect(paths.filter((p) => p === '/v/vouch1')).toHaveLength(1);
    expect(paths.some((p) => /^\/[a-z]{2}\/(m|v)\//.test(p))).toBe(false);

    // Campaign list and campaign pages exist under every locale.
    for (const l of nonDefault) {
      expect(paths).toContain(`/${l}/campaigns`);
      expect(paths).toContain(`/${l}/campaigns/camp1`);
    }

    // Nothing else: every path matches a real route.
    const allowed = /^\/((?:[a-z]{2}\/)?campaigns(\/camp1)?|m\/coffee-house|v\/vouch1)?$/;
    for (const p of paths) expect(p).toMatch(allowed);
  });
});
