import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DEMO_SLUG_PREFIX, isDemoMerchantSlug, notDemoMerchant } from '@/lib/demo-content';

/**
 * Demo content (scripts/demo-content.cjs) must never be offered to search
 * engines as real offers. The live sitemap once listed all 8 "NÄIDIS" demo
 * campaigns in every locale.
 */
const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');

describe('demo content stays out of search results', () => {
  it('identifies demo merchants only by the shared slug prefix', () => {
    expect(isDemoMerchantSlug('demo-kohvik-mokka')).toBe(true);
    expect(isDemoMerchantSlug('coffee-house')).toBe(false);
    expect(isDemoMerchantSlug('my-demo-shop')).toBe(false);
    expect(isDemoMerchantSlug(null)).toBe(false);
    expect(notDemoMerchant).toEqual({ NOT: { slug: { startsWith: DEMO_SLUG_PREFIX } } });
  });

  it('the demo script uses the same prefix as the app', () => {
    expect(read('scripts', 'demo-content.cjs')).toContain(`const SLUG_PREFIX = '${DEMO_SLUG_PREFIX}'`);
  });

  it('the sitemap excludes demo merchants from every query', () => {
    const src = read('app', 'sitemap.ts');
    // campaigns, merchants and vouchers
    expect(src.match(/notDemoMerchant/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
  });

  it('demo campaign and merchant pages are noindex', () => {
    for (const f of [['app', '[locale]', 'campaigns', '[id]', 'page.tsx'], ['app', 'm', '[slug]', 'page.tsx']]) {
      const src = read(...f);
      expect(src).toMatch(/isDemoMerchantSlug\([^)]*slug\)\s*\?\s*\{\s*robots:\s*\{\s*index:\s*false/);
    }
  });
});
