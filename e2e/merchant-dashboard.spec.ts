import { test, expect } from './fixtures';

test.describe('Merchant Dashboard', () => {
  test('should display merchant dashboard', async ({ page, merchantAdmin }) => {
    await page.goto(`/merchant/${merchantAdmin.merchantSlug}/dashboard`, { waitUntil: 'domcontentloaded' });
    
    // Verify dashboard loads
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Minu Pood|Kaupmees|Toolaud|Tooleht|Tookeskkond/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should navigate to vouchers list', async ({ page, merchantAdmin }) => {
    await page.goto(`/merchant/${merchantAdmin.merchantSlug}/vouchers`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*vouchers/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Vouchers/i })).toBeVisible();
  });

  test('should navigate to redemptions list', async ({ page, merchantAdmin }) => {
    await page.goto(`/merchant/${merchantAdmin.merchantSlug}/redemptions`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*redemptions/, { timeout: 10000 });
    await expect(page.getByText(/Staff Redeem/i)).toBeVisible();
  });

  test('should access settings page', async ({ page, merchantAdmin }) => {
    await page.goto(`/merchant/${merchantAdmin.merchantSlug}/settings`, { waitUntil: 'domcontentloaded' });
    
    // Verify settings page loads
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Seaded ja Integratsioonid/i })).toBeVisible({ timeout: 10000 });
  });
});
