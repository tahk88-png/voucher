import { test, expect } from './fixtures';

test.describe('Voucher Flow', () => {
  test('should allow claiming a public voucher and reveal claimed state', async ({ page, testVoucher }) => {
    await page.goto(`/voucher/${testVoucher.id}`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /25% Off Summer Collection/i })).toBeVisible();
    await page.getByRole('button', { name: /^Claim Voucher$/i }).click();

    await expect(page.getByRole('heading', { name: /Voucher Claimed!/i })).toBeVisible();
    await expect(page.getByText(/Your discount code has been copied/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Share with Friends/i })).toBeVisible();
  });

  test('should copy voucher code from public voucher page', async ({ page, testVoucher }) => {
    await page.goto(`/voucher/${testVoucher.id}`, { waitUntil: 'domcontentloaded' });

    const copyButton = page.locator('button').filter({ has: page.locator('svg.lucide-copy') }).first();
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    await expect(page.locator('svg.lucide-check').first()).toBeVisible();
  });
});

test.describe('Public Voucher Page', () => {
  test('should render voucher public content without login', async ({ page, testVoucher }) => {
    await page.goto(`/voucher/${testVoucher.id}`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /25% Off Summer Collection/i })).toBeVisible();
    await expect(page.getByText(/VOUCHER CODE/i)).toBeVisible();
    await expect(page.getByText(/SUMMER25/i)).toBeVisible();
  });

  test('should display QR code block', async ({ page, testVoucher }) => {
    await page.goto(`/voucher/${testVoucher.id}`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('svg.lucide-qr-code').first()).toBeVisible();
  });
});

test.describe('Referrals', () => {
  test('should show referrals page and QR toggle', async ({ page, authenticatedUser }) => {
    await page.goto('/app/referrals', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /^Referrals$/i })).toBeVisible();
    await expect(page.getByText('Your Referral Link', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /QR Code/i }).click();
    await expect(page.getByRole('heading', { name: /Referral QR Code/i })).toBeVisible();
  });
});

test.describe('Merchant Voucher Management', () => {
  test('should display vouchers list for merchant', async ({ page, merchantAdmin }) => {
    await page.goto(`/merchant/${merchantAdmin.merchantSlug}/vouchers`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /^Vouchers$/i })).toBeVisible();
    await expect(page.getByText(/SUMMER25|FREESHIP|WELCOME10/i).first()).toBeVisible();
  });

  test('should open voucher creation flow', async ({ page, merchantAdmin }) => {
    await page.goto(`/merchant/${merchantAdmin.merchantSlug}/vouchers`, { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /Create Voucher/i }).first().click();
    await expect(page).toHaveURL(/\/vouchers\/create|\/merchant\/[^/]+\/vouchers\/new/);
    await expect(page.getByRole('heading', { name: /Create Voucher/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Choose Template/i })).toBeVisible();
    await expect(page.getByText(/^Details$/).first()).toBeVisible();
  });

  test('should resolve voucher detail route to voucher management surface', async ({ page, merchantAdmin, testVoucher }) => {
    await page.goto(`/merchant/${merchantAdmin.merchantSlug}/vouchers/${testVoucher.id}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByRole('heading', { name: /^Vouchers$/i })).toBeVisible();
    await expect(page.getByText(/Create and manage your voucher codes/i)).toBeVisible();
  });
});

test.describe('Redemptions', () => {
  test('should display redemptions view for merchant staff', async ({ page, merchantStaff }) => {
    await page.goto(`/merchant/${merchantStaff.merchantSlug}/redemptions`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByText(/Staff Redeem/i)).toBeVisible();
    await expect(page.getByText(/Scan or enter code to redeem/i)).toBeVisible();
  });

  test('should validate a manual voucher code in redemptions', async ({ page, merchantStaff }) => {
    await page.goto(`/merchant/${merchantStaff.merchantSlug}/redemptions`, { waitUntil: 'domcontentloaded' });

    await page.locator('#code').fill('SUMMER25');
    await page.getByRole('button', { name: /Validate Code/i }).click();

    await expect(page.getByRole('heading', { name: /Valid Voucher!/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/SUMMER25/i)).toBeVisible();
  });
});
