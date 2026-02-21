import { test, expect } from './fixtures';

test.describe('Merchant Dashboard', () => {
  test('should display merchant dashboard', async ({ page, merchantAdmin }) => {
    await page.goto(`/merchant/${merchantAdmin.merchantSlug}/dashboard`, { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(new RegExp(`/merchant/${merchantAdmin.merchantSlug}/dashboard$`));
    await expect(page.getByRole('heading', { name: /Merchant Dashboard/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Performance overview/i })).toBeVisible();
  });

  test('should navigate to vouchers list', async ({ page, merchantAdmin }) => {
    await page.goto(`/merchant/${merchantAdmin.merchantSlug}/vouchers`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*vouchers/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Vouchers/i })).toBeVisible();
    await expect(page.locator('input[aria-label="Search vouchers"]')).toBeVisible();
  });

  test('should navigate to redemptions list', async ({ page, merchantAdmin }) => {
    await page.goto(`/merchant/${merchantAdmin.merchantSlug}/redemptions`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*redemptions/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Redemptions', exact: true })).toBeVisible();
    await expect(page.getByText('View and confirm voucher redemptions.')).toBeVisible();
  });

  test('should access settings page', async ({ page, merchantAdmin }) => {
    await page.goto(`/merchant/${merchantAdmin.merchantSlug}/settings`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Settings|Seaded/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Merchant information/i })).toBeVisible();
  });
});
