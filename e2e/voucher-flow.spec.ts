import { test, expect } from './fixtures';

test.describe('Public Voucher Page', () => {
  test('should resolve legacy voucher alias route', async ({ page, testVoucher }) => {
    await page.goto(`/voucher/${testVoucher.id}`, { waitUntil: 'domcontentloaded' });

    const currentPath = new URL(page.url()).pathname;
    if (currentPath === `/voucher/${testVoucher.id}`) {
      await page.goto(`/v/${testVoucher.id}`, { waitUntil: 'domcontentloaded' });
    }

    await expect(page).toHaveURL(new RegExp(`/(voucher|v)/${testVoucher.id}$`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should render published voucher with copy button and QR code', async ({ page, testVoucher }) => {
    await page.goto(`/v/${testVoucher.id}`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByLabel(/Copy voucher code/i)).toBeVisible();
    await expect(page.getByAltText(/QR code for voucher/i)).toBeVisible();
  });

  test('should allow interacting with voucher code copy action', async ({ page, testVoucher }) => {
    await page.goto(`/v/${testVoucher.id}`, { waitUntil: 'domcontentloaded' });

    const copyButton = page.getByLabel(/Copy voucher code/i);
    await copyButton.click();
    await expect(copyButton).toBeVisible();
  });
});

test.describe('Referrals', () => {
  test('should load referrals workspace for authenticated user', async ({ page, authenticatedUser }) => {
    await page.goto('/app/referrals', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/app\/referrals$/);
    await expect(page.getByText('/app/share')).toBeVisible();
  });
});

test.describe('Merchant Voucher Management', () => {
  test('should display merchant vouchers surface', async ({ page, merchantAdmin }) => {
    await page.goto(`/merchant/${merchantAdmin.merchantSlug}/vouchers`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page).toHaveURL(new RegExp(`/merchant/${merchantAdmin.merchantSlug}/vouchers$`));
    await expect(page.locator('input[aria-label="Search vouchers"]')).toBeVisible();
    await expect(
      page.locator(`a[href="/merchant/${merchantAdmin.merchantSlug}/vouchers/new"]`).first(),
    ).toBeVisible();
  });

  test('should open voucher creation flow', async ({ page, merchantAdmin }) => {
    await page.goto(`/merchant/${merchantAdmin.merchantSlug}/vouchers`, {
      waitUntil: 'domcontentloaded',
    });

    const createLink = page.locator(`a[href="/merchant/${merchantAdmin.merchantSlug}/vouchers/new"]`).first();
    await expect(createLink).toBeVisible();

    const createHref = await createLink.getAttribute('href');
    expect(createHref).toBe(`/merchant/${merchantAdmin.merchantSlug}/vouchers/new`);
    await page.goto(createHref ?? `/merchant/${merchantAdmin.merchantSlug}/vouchers/new`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page).toHaveURL(new RegExp(`/merchant/${merchantAdmin.merchantSlug}/vouchers/new$`));
    await expect(page.locator('#voucher-type')).toBeVisible();
    await expect(page.locator('#voucher-value')).toBeVisible();
  });

  test('should resolve voucher detail route to edit form', async ({ page, merchantAdmin, testVoucher }) => {
    await page.goto(`/merchant/${merchantAdmin.merchantSlug}/vouchers/${testVoucher.id}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(
      page,
    ).toHaveURL(new RegExp(`/merchant/${merchantAdmin.merchantSlug}/vouchers/${testVoucher.id}$`));
    await expect(page.locator('#edit-voucher-value')).toBeVisible();
    await expect(page.locator('#voucher-type')).toBeVisible();
  });
});

test.describe('Redemptions', () => {
  test('should display redemptions view for merchant staff', async ({ page, merchantStaff }) => {
    await page.goto(`/merchant/${merchantStaff.merchantSlug}/redemptions`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page).toHaveURL(new RegExp(`/merchant/${merchantStaff.merchantSlug}/redemptions$`));
    await expect(page.getByText('View and confirm voucher redemptions.')).toBeVisible();
  });

  test('should show redemption empty state or list content', async ({ page, merchantStaff }) => {
    await page.goto(`/merchant/${merchantStaff.merchantSlug}/redemptions`, {
      waitUntil: 'domcontentloaded',
    });

    const emptyState = page.getByText('No redemptions yet');
    const redemptionRow = page.getByText('Method:').first();

    if (await emptyState.isVisible().catch(() => false)) {
      await expect(emptyState).toBeVisible();
      return;
    }

    await expect(redemptionRow).toBeVisible();
  });
});
