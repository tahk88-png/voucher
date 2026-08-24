import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, sep } from 'path';

/**
 * Guard-coverage regression test for the protected API surface.
 *
 * A live sweep found three `/api/admin/gifts/*` routes whose POST was guarded
 * but whose GET was not, so anyone could read admin data unauthenticated. This
 * test locks that class of bug down: every HTTP handler under /api/admin and
 * /api/merchant must reference an authorization guard.
 *
 * It is a static source check — no DB, no network — so it runs in the default
 * suite and fails fast in CI when a new route forgets its guard.
 */

const ROOT = process.cwd();
const ADMIN_DIR = join(ROOT, 'app', 'api', 'admin');
const MERCHANT_DIR = join(ROOT, 'app', 'api', 'merchant');

const VERBS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

const ADMIN_GUARDS = [
  'requireAdminPermission',
  'requireAdminProfile',
  'requireAdmin',
  'requirePlatformAdmin',
  'verifyPlatformAdmin',
  'withAdminAudit',
  'requirePermission',
  'resolveAccessProfile',
  'getAuthenticatedUser',
];

const MERCHANT_GUARDS = [
  'requireMerchantCapability',
  'requireMerchantAccess',
  'assertMerchantAccess',
  'requireMerchant',
  'resolveAccessProfile',
  'getAuthenticatedUser',
  'auth()',
];

/**
 * Routes that are intentionally reachable without a session, with the reason.
 * Anything added here is a deliberate product decision, not an oversight.
 */
const INTENTIONAL_PUBLIC: Record<string, string> = {
  // Scrape endpoint: authenticated with a METRICS_TOKEN bearer token instead
  // of a user session (see the route's own 401 branch).
  'admin/ops/metrics/prometheus/route.ts': 'METRICS_TOKEN bearer auth',
  // Public storefront data for a merchant's purchasable gift cards. Returns a
  // narrow projection and never exposes gift-card codes.
  'merchant/[slug]/gift-cards/public/route.ts': 'public storefront endpoint',
};

function routeFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    let entries: string[];
    try {
      entries = readdirSync(d);
    } catch {
      return;
    }
    for (const e of entries) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (e === 'route.ts') out.push(p);
    }
  };
  walk(dir);
  return out;
}

function exportedVerbs(src: string): string[] {
  return VERBS.filter((v) =>
    new RegExp(`export\\s+(async\\s+)?function\\s+${v}\\b|export\\s+const\\s+${v}\\b`).test(src),
  );
}

function key(file: string, base: string): string {
  // stable, OS-independent key like "admin/gifts/categories/route.ts"
  const rel = relative(join(ROOT, 'app', 'api'), file);
  return rel.split(sep).join('/');
}

describe('protected API routes reference an authorization guard', () => {
  const adminFiles = routeFiles(ADMIN_DIR);
  const merchantFiles = routeFiles(MERCHANT_DIR);

  it('finds the admin and merchant route trees', () => {
    expect(adminFiles.length).toBeGreaterThan(0);
    expect(merchantFiles.length).toBeGreaterThan(0);
  });

  it('every /api/admin handler is guarded', () => {
    const unguarded: string[] = [];
    for (const f of adminFiles) {
      const k = key(f, ADMIN_DIR);
      if (INTENTIONAL_PUBLIC[k]) continue;
      const src = readFileSync(f, 'utf8');
      if (exportedVerbs(src).length === 0) continue;
      if (!ADMIN_GUARDS.some((g) => src.includes(g))) unguarded.push(k);
    }
    expect(unguarded).toEqual([]);
  });

  it('every /api/merchant handler is guarded', () => {
    const unguarded: string[] = [];
    for (const f of merchantFiles) {
      const k = key(f, MERCHANT_DIR);
      if (INTENTIONAL_PUBLIC[k]) continue;
      const src = readFileSync(f, 'utf8');
      if (exportedVerbs(src).length === 0) continue;
      if (!MERCHANT_GUARDS.some((g) => src.includes(g))) unguarded.push(k);
    }
    expect(unguarded).toEqual([]);
  });

  it('admin gift taxonomy GETs specifically require a permission', () => {
    // These three regressed once: POST was guarded, GET was not.
    for (const name of ['categories', 'occasions', 'personas']) {
      const src = readFileSync(join(ADMIN_DIR, 'gifts', name, 'route.ts'), 'utf8');
      const getBody = src.slice(src.indexOf('export async function GET'));
      expect(getBody).toContain('requireAdminPermission');
    }
  });

  it('public pages do not fetch admin endpoints', () => {
    // /gifts must use the public /api/gifts/taxonomy endpoint instead. Match
    // actual fetch calls rather than any mention, so explanatory comments that
    // reference the admin paths don't trip the assertion.
    const publicPage = readFileSync(join(ROOT, 'app', 'gifts', 'page.tsx'), 'utf8');
    const adminFetch = /fetch\(\s*[`'"]\/api\/admin\//.test(publicPage);
    expect(adminFetch).toBe(false);
    expect(publicPage).toContain('/api/gifts/taxonomy');
  });
});
