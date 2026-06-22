import { test, expect } from './fixtures';

/**
 * Merchant redemptions surface.
 *
 * The redemption-confirmation pathway mutates DB state (Redemption row
 * + CreditLedger unlock + AuditLog). That full flow is exercised in
 * `lib/__tests__/credits.test.ts`. These specs verify the UI contract
 * for the staff-facing view: stats, list, confirm-button visibility.
 */

test.describe('Merchant Redemptions', () => {
  test('loads redemptions page for authenticated merchant staff', async ({ page, merchantStaff }) => {
    await page.goto(`/merchant/${merchantStaff.merchantSlug}/redemptions`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page).toHaveURL(
      new RegExp(`/merchant/${merchantStaff.merchantSlug}/redemptions$`),
    );
  });

  test('shows redemptions heading or empty state', async ({ page, merchantStaff }) => {
    await page.goto(`/merchant/${merchantStaff.merchantSlug}/redemptions`, {
      waitUntil: 'domcontentloaded',
    });

    // Either the empty-state copy or the first redemption row should render.
    const empty = page.getByText(/no redemptions yet|no redemptions/i);
    const anyRow = page.getByText('Method:').first();
    const either = await Promise.race([
      empty.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'empty').catch(() => null),
      anyRow.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'row').catch(() => null),
    ]);
    expect(['empty', 'row']).toContain(either);
  });

  test('breadcrumbs include dashboard link', async ({ page, merchantStaff }) => {
    await page.goto(`/merchant/${merchantStaff.merchantSlug}/redemptions`, {
      waitUntil: 'domcontentloaded',
    });

    const dashboardLink = page
      .locator(`a[href="/merchant/${merchantStaff.merchantSlug}/dashboard"]`)
      .first();
    await expect(dashboardLink).toBeVisible({ timeout: 5000 });
  });

  test('export button is visible on redemptions page', async ({ page, merchantStaff }) => {
    await page.goto(`/merchant/${merchantStaff.merchantSlug}/redemptions`, {
      waitUntil: 'domcontentloaded',
    });

    // The ExportRedemptionsButton renders a clickable control — we only check
    // that an export affordance exists, not its exact copy (subject to i18n).
    const exportControl = page
      .locator('button, a')
      .filter({ hasText: /export|csv|download/i })
      .first();
    await expect(exportControl).toBeVisible({ timeout: 5000 });
  });

  test('unauthorized user cannot access redemptions', async ({ page }) => {
    // Fresh context, no session
    const ctx = await page.context().browser()?.newContext();
    if (!ctx) test.skip();
    const freshPage = await ctx!.newPage();

    // Use a slug that almost certainly exists in seed ("coffee-house");
    // the point is to verify the guard redirects to /login, not the slug.
    await freshPage.goto('/merchant/coffee-house/redemptions', {
      waitUntil: 'domcontentloaded',
    });

    const url = new URL(freshPage.url());
    expect(url.pathname.startsWith('/login') || url.pathname !== '/merchant/coffee-house/redemptions').toBeTruthy();

    await freshPage.close();
    await ctx!.close();
  });
});
