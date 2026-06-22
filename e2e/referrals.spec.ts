import { test, expect } from './fixtures';

/**
 * Referrals workspace.
 *
 * Covers the authenticated user's referral dashboard: referral code
 * rendering, share link, and navigation to invite flow. Does NOT actually
 * redeem a referral (that path mutates credits and needs seeded state);
 * for DB-mutating coverage see unit tests in `lib/__tests__/credits.test.ts`.
 */

test.describe('Referrals workspace', () => {
  test('loads the referrals dashboard for an authenticated user', async ({ page, authenticatedUser }) => {
    await page.goto('/app/referrals', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/app\/referrals$/);
  });

  test('renders the share link (or share path) on the referrals page', async ({ page, authenticatedUser }) => {
    await page.goto('/app/referrals', { waitUntil: 'domcontentloaded' });
    // The server-rendered page includes the literal `/app/share` string
    // as the user's referral URL tail.
    await expect(page.getByText('/app/share').first()).toBeVisible({ timeout: 10000 });
  });

  test('unauthenticated visits to /app/referrals redirect to login', async ({ page }) => {
    // Visit without fixture → no session cookie
    const ctx = await page.context().browser()?.newContext();
    if (!ctx) test.skip();

    const freshPage = await ctx!.newPage();
    const response = await freshPage.goto('/app/referrals', { waitUntil: 'domcontentloaded' });

    // Either redirected to /login or got a 401/302
    const url = new URL(freshPage.url());
    // We expect to land on /login (possibly with ?callbackUrl=...)
    expect(url.pathname.startsWith('/login') || (response && response.status() >= 300)).toBeTruthy();

    await freshPage.close();
    await ctx!.close();
  });
});

/**
 * Referral invite landing page (/app/share).
 *
 * This is the URL the referrer copies and sends to a friend. It should
 * load even without auth (the share path is typically public and may
 * prompt sign-up). We don't know the exact copy/CTA here so we just
 * verify the route resolves and renders something.
 */
test.describe('Referral share landing page', () => {
  test('/app/share resolves to a page', async ({ page }) => {
    const response = await page.goto('/app/share', { waitUntil: 'domcontentloaded' });
    // 2xx or a redirect is fine; a 5xx should fail this test.
    if (response) {
      expect(response.status()).toBeLessThan(500);
    }
    // The response body should render a body element with some content.
    await expect(page.locator('body')).toBeVisible();
  });
});
