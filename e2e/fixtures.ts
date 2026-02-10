import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

type TestFixtures = {
  authenticatedUser: { id: string; email: string };
  authenticatedMerchant: { id: string; slug: string };
  testVoucher: { id: string };
  merchantAdmin: { id: string; email: string; merchantId: string; merchantSlug: string };
  merchantStaff: { id: string; email: string; merchantId: string; merchantSlug: string };
  testMerchant: { id: string; slug: string };
};

const TEST_DATA = {
  merchantId: 'merchant-coffee-house',
  merchantSlug: 'coffee-house',
  voucherId: 'voucher-summer-25',
  userEmail: process.env.TEST_USER_EMAIL || 'test@example.com',
  adminEmail: process.env.MERCHANT_ADMIN_EMAIL || 'admin@coffee-house.com',
  staffEmail: process.env.MERCHANT_STAFF_EMAIL || 'user@coffee-house.com',
};

export const test = base.extend<TestFixtures>({
  authenticatedUser: async ({ page }, use) => {
    await seedClientSession(page, 'user');
    await use({ id: 'test-user', email: TEST_DATA.userEmail });
  },

  authenticatedMerchant: async ({ page }, use) => {
    await seedClientSession(page, 'merchant');
    await use({ id: TEST_DATA.merchantId, slug: TEST_DATA.merchantSlug });
  },

  testVoucher: async ({}, use) => {
    await use({ id: TEST_DATA.voucherId });
  },

  merchantAdmin: async ({ page }, use) => {
    await seedClientSession(page, 'merchant');
    await use({
      id: 'merchant-admin',
      email: TEST_DATA.adminEmail,
      merchantId: TEST_DATA.merchantId,
      merchantSlug: TEST_DATA.merchantSlug,
    });
  },

  merchantStaff: async ({ page }, use) => {
    await seedClientSession(page, 'merchant');
    await use({
      id: 'merchant-staff',
      email: TEST_DATA.staffEmail,
      merchantId: TEST_DATA.merchantId,
      merchantSlug: TEST_DATA.merchantSlug,
    });
  },

  testMerchant: async ({}, use) => {
    await use({ id: TEST_DATA.merchantId, slug: TEST_DATA.merchantSlug });
  },
});

export { expect } from '@playwright/test';

type AppRole = 'user' | 'merchant' | 'admin';

async function seedClientSession(page: Page, role: AppRole) {
  await page.addInitScript((nextRole: AppRole) => {
    window.localStorage.setItem('figmaAppRole', nextRole);
    window.localStorage.setItem('selectedLanguage', 'en');
    window.localStorage.setItem('selectedCountry', 'EE');
    window.localStorage.setItem('NEXT_LOCALE', 'en');
    document.cookie = 'NEXT_LOCALE=en; path=/';
  }, role);
}
