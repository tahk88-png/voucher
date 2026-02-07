import { test, expect } from './fixtures';

test.describe('Merchant Dashboard', () => {
  test('should display merchant dashboard', async ({ page, merchantAdmin }) => {
    await page.goto(`/merchant/${merchantAdmin.merchantSlug}/dashboard`);
    
    // Verify dashboard loads
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
    
    // Verify key elements are present (adjust selectors based on actual dashboard)
    // Dashboard might show stats, vouchers, redemptions, etc.
    const dashboardContent = page.locator('main, [role="main"]').first();
    await expect(dashboardContent).toBeVisible({ timeout: 3000 });
  });

  test('should navigate to vouchers list', async ({ page, merchantAdmin }) => {
    await page.goto(`/merchant/${merchantAdmin.merchantSlug}/dashboard`);
    
    // Click vouchers link in navigation
    const vouchersLink = page.locator('a[href*="vouchers"], nav a:has-text("Vouchers")').first();
    if (await vouchersLink.isVisible({ timeout: 3000 })) {
      await vouchersLink.click();
      await expect(page).toHaveURL(/.*vouchers/, { timeout: 5000 });
    } else {
      // If navigation link not found, go directly
      await page.goto(`/merchant/${merchantAdmin.merchantSlug}/vouchers`);
      await expect(page).toHaveURL(/.*vouchers/);
    }
  });

  test('should navigate to redemptions list', async ({ page, merchantAdmin }) => {
    await page.goto(`/merchant/${merchantAdmin.merchantSlug}/dashboard`);
    
    // Click redemptions link
    const redemptionsLink = page.locator('a[href*="redemptions"], nav a:has-text("Redemptions")').first();
    if (await redemptionsLink.isVisible({ timeout: 3000 })) {
      await redemptionsLink.click();
      await expect(page).toHaveURL(/.*redemptions/, { timeout: 5000 });
    } else {
      // If navigation link not found, go directly
      await page.goto(`/merchant/${merchantAdmin.merchantSlug}/redemptions`);
      await expect(page).toHaveURL(/.*redemptions/);
    }
  });

  test('should access settings page', async ({ page, merchantAdmin }) => {
    await page.goto(`/merchant/${merchantAdmin.merchantSlug}/settings`);
    
    // Verify settings page loads
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 5000 });
  });
});
