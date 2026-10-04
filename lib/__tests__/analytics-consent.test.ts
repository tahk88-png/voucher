import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * GDPR regression guard: analytics must stay off until the visitor opts in.
 *
 * Consent is collected by the cookie banner and stored in an httpOnly cookie.
 * For a long time nothing read it back — isAnalyticsAllowed() had no callers —
 * so the platform was compliant only because no page happened to call the
 * analytics endpoints. These checks make the gating structural instead.
 *
 * Static source checks (no DB, no network) so they run in the default suite.
 */

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

describe('analytics respects cookie consent', () => {
  for (const [route, recorder] of [
    ['track', 'trackEvent('],
    ['pageview', 'trackPageView('],
  ] as const) {
    it(`/api/analytics/${route} checks consent before recording`, () => {
      const src = read('app', 'api', 'analytics', route, 'route.ts');
      const consentAt = src.indexOf('isAnalyticsAllowed()');
      const recordAt = src.indexOf(recorder);
      expect(consentAt).toBeGreaterThan(-1);
      expect(recordAt).toBeGreaterThan(-1);
      expect(consentAt).toBeLessThan(recordAt);
    });
  }

  it('the root layout never renders Vercel Analytics ungated', () => {
    const layout = read('app', 'layout.tsx');
    expect(layout).not.toMatch(/from ["']@vercel\/analytics/);
    expect(layout).not.toMatch(/<Analytics\b/);
    expect(layout).toContain('<ConsentGatedAnalytics');
  });

  it('the gated component only renders analytics after consent', () => {
    const gate = read('components', 'consent-gated-analytics.tsx');
    expect(gate).toContain('useState(false)');
    expect(gate).toMatch(/allowed \? <Analytics \/> : null/);
  });

  it('the banner broadcasts the choice so accepting takes effect without a reload', () => {
    const banner = read('components', 'cookie-consent-banner.tsx');
    expect(banner).toContain('dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT');
  });
});
