import { test as base } from '@playwright/test';
import { prisma } from '../lib/prisma';

type TestFixtures = {
  authenticatedUser: { id: string; email: string };
  authenticatedMerchant: { id: string; slug: string };
  testVoucher: { id: string };
  merchantAdmin: { id: string; email: string; merchantId: string; merchantSlug: string };
  merchantStaff: { id: string; email: string; merchantId: string; merchantSlug: string };
  testMerchant: { id: string; slug: string };
};

export const test = base.extend<TestFixtures>({
  authenticatedUser: async ({ page }, use) => {
    // Login as test user
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'test123';

    await page.goto('/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL(/.*app|.*merchant/);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    if (!user) {
      throw new Error('Test user not found');
    }

    await use({ id: user.id, email: user.email });
  },

  authenticatedMerchant: async ({ authenticatedUser }, use) => {
    // Get merchant for authenticated user
    const member = await prisma.merchantMember.findFirst({
      where: { userId: authenticatedUser.id },
      include: { merchant: true },
    });

    if (!member) {
      throw new Error('User is not a member of any merchant');
    }

    await use({ id: member.merchant.id, slug: member.merchant.slug });
  },

  testVoucher: async ({ authenticatedMerchant }, use) => {
    // Get or create a test voucher
    let voucher = await prisma.voucher.findFirst({
      where: {
        merchantId: authenticatedMerchant.id,
        status: 'published',
      },
    });

    if (!voucher) {
      voucher = await prisma.voucher.create({
        data: {
          merchantId: authenticatedMerchant.id,
          status: 'published',
          type: 'fixed_amount',
          value: 1000,
          currency: 'USD',
          validFrom: new Date(),
          validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    await use({ id: voucher.id });
  },

  merchantAdmin: async ({ page }, use) => {
    // Login as merchant admin (admin@coffee-house.com or test@example.com)
    const adminEmail = process.env.MERCHANT_ADMIN_EMAIL || 'admin@coffee-house.com';
    const adminPassword = process.env.MERCHANT_ADMIN_PASSWORD || 'test123';
    
    // Try to find admin user, fallback to test@example.com if admin@coffee-house.com doesn't exist
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    
    if (!adminUser) {
      // Fallback to test@example.com which is merchant_admin
      adminUser = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });
    }

    if (!adminUser) {
      throw new Error('Merchant admin user not found');
    }

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', adminUser.email);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL(/.*app|.*merchant/, { timeout: 10000 });

    // Get merchant for admin user
    const member = await prisma.merchantMember.findFirst({
      where: {
        userId: adminUser.id,
        role: 'merchant_admin',
      },
      include: { merchant: true },
    });

    if (!member) {
      throw new Error('User is not a merchant admin');
    }

    await use({
      id: adminUser.id,
      email: adminUser.email,
      merchantId: member.merchant.id,
      merchantSlug: member.merchant.slug,
    });
  },

  merchantStaff: async ({ page }, use) => {
    // Login as merchant staff (user@example.com)
    const staffEmail = process.env.MERCHANT_STAFF_EMAIL || 'user@example.com';
    const staffPassword = process.env.MERCHANT_STAFF_PASSWORD || 'test123';

    const staffUser = await prisma.user.findUnique({
      where: { email: staffEmail },
    });

    if (!staffUser) {
      throw new Error('Merchant staff user not found');
    }

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', staffUser.email);
    await page.fill('input[type="password"]', staffPassword);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL(/.*app|.*merchant/, { timeout: 10000 });

    // Get merchant for staff user
    const member = await prisma.merchantMember.findFirst({
      where: {
        userId: staffUser.id,
        role: 'merchant_staff',
      },
      include: { merchant: true },
    });

    if (!member) {
      throw new Error('User is not a merchant staff');
    }

    await use({
      id: staffUser.id,
      email: staffUser.email,
      merchantId: member.merchant.id,
      merchantSlug: member.merchant.slug,
    });
  },

  testMerchant: async ({ }, use) => {
    // Get or create test merchant (coffee-house)
    let merchant = await prisma.merchant.findUnique({
      where: { slug: 'coffee-house' },
    });

    if (!merchant) {
      merchant = await prisma.merchant.create({
        data: {
          name: 'Coffee House',
          slug: 'coffee-house',
          country: 'US',
          defaultCurrency: 'USD',
        },
      });
    }

    await use({ id: merchant.id, slug: merchant.slug });
  },
});

export { expect } from '@playwright/test';
