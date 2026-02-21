import { PrismaClient } from '@prisma/client';
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

type ResolvedSeedData = {
  merchantId: string;
  merchantSlug: string;
  voucherId: string;
};

const DEFAULT_DATABASE_URL = 'postgresql://voucher_user:voucher_pass@localhost:5433/voucher_db';
const DEFAULT_PLAYWRIGHT_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:3100';
const DB_RETRY_ATTEMPTS = 5;
const DB_RETRY_DELAY_MS = 1_000;

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_DATABASE_URL;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDbUnavailableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }
  return error.message.includes("Can't reach database server") || error.message.includes('P1001');
}

async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= DB_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isDbUnavailableError(error) || attempt === DB_RETRY_ATTEMPTS) {
        throw error;
      }
      await sleep(DB_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError;
}

const prisma = new PrismaClient();

const TEST_DATA = {
  merchantSlug: process.env.MERCHANT_SLUG || 'coffee-house',
  userEmail: process.env.TEST_USER_EMAIL || 'test@example.com',
  userPassword: process.env.TEST_USER_PASSWORD || 'test123',
  adminEmail: process.env.TEST_ADMIN_EMAIL || 'admin@coffee-house.com',
  adminPassword: process.env.TEST_ADMIN_PASSWORD || 'admin123',
  staffEmail: process.env.TEST_STAFF_EMAIL,
  staffPassword: process.env.TEST_STAFF_PASSWORD,
};

let seedDataPromise: Promise<ResolvedSeedData> | null = null;

function getSeedData(): Promise<ResolvedSeedData> {
  if (!seedDataPromise) {
    seedDataPromise = withDbRetry(async () => {
      let merchant =
        (await prisma.merchant.findUnique({
          where: { slug: TEST_DATA.merchantSlug },
          select: { id: true, slug: true, isActive: true },
        })) ||
        (await prisma.merchant.findFirst({
          select: { id: true, slug: true, isActive: true },
          orderBy: { createdAt: 'asc' },
        }));

      if (!merchant) {
        throw new Error('No merchant found for e2e fixtures. Run `npm run db:seed` first.');
      }

      if (!merchant.isActive) {
        merchant = await prisma.merchant.update({
          where: { id: merchant.id },
          data: { isActive: true },
          select: { id: true, slug: true, isActive: true },
        });
      }

      let voucher =
        (await prisma.voucher.findFirst({
          where: {
            merchantId: merchant.id,
            status: 'published',
          },
          select: { id: true, status: true },
          orderBy: { createdAt: 'desc' },
        })) ||
        (await prisma.voucher.findFirst({
          where: { merchantId: merchant.id },
          select: { id: true, status: true },
          orderBy: { createdAt: 'desc' },
        }));

      if (!voucher) {
        throw new Error(`No voucher found for merchant ${merchant.slug}.`);
      }

      if (voucher.status !== 'published') {
        voucher = await prisma.voucher.update({
          where: { id: voucher.id },
          data: { status: 'published' },
          select: { id: true, status: true },
        });
      }

      return {
        merchantId: merchant.id,
        merchantSlug: merchant.slug,
        voucherId: voucher.id,
      };
    })();
  }

  return seedDataPromise;
}

async function loginWithCredentials(page: Page, email: string, password: string, callbackPath: string) {
  const csrfResponse = await page.request.get('/api/auth/csrf');
  if (!csrfResponse.ok()) {
    throw new Error(`Failed to fetch CSRF token (${csrfResponse.status()})`);
  }

  const csrfBody = (await csrfResponse.json()) as { csrfToken?: string };
  if (!csrfBody.csrfToken) {
    throw new Error('Missing CSRF token from /api/auth/csrf');
  }

  const callbackUrl = `${DEFAULT_PLAYWRIGHT_BASE_URL}${callbackPath}`;
  const signInResponse = await page.request.post('/api/auth/callback/credentials', {
    form: {
      csrfToken: csrfBody.csrfToken,
      email,
      password,
      callbackUrl,
      json: 'true',
    },
  });

  if (signInResponse.status() >= 400) {
    const responseBody = await signInResponse.text();
    throw new Error(`Credentials sign-in failed (${signInResponse.status()}): ${responseBody.slice(0, 200)}`);
  }

  await page.goto(callbackPath, { waitUntil: 'domcontentloaded' });
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 });
}

export const test = base.extend<TestFixtures>({
  authenticatedUser: async ({ page }, use) => {
    await loginWithCredentials(page, TEST_DATA.userEmail, TEST_DATA.userPassword, '/app/referrals');
    await use({ id: 'test-user', email: TEST_DATA.userEmail });
  },

  authenticatedMerchant: async ({ page }, use) => {
    const seed = await getSeedData();
    await loginWithCredentials(page, TEST_DATA.adminEmail, TEST_DATA.adminPassword, `/merchant/${seed.merchantSlug}/dashboard`);
    await use({ id: seed.merchantId, slug: seed.merchantSlug });
  },

  testVoucher: async ({}, use) => {
    const seed = await getSeedData();
    await use({ id: seed.voucherId });
  },

  merchantAdmin: async ({ page }, use) => {
    const seed = await getSeedData();
    await loginWithCredentials(page, TEST_DATA.adminEmail, TEST_DATA.adminPassword, `/merchant/${seed.merchantSlug}/dashboard`);
    await use({
      id: 'merchant-admin',
      email: TEST_DATA.adminEmail,
      merchantId: seed.merchantId,
      merchantSlug: seed.merchantSlug,
    });
  },

  merchantStaff: async ({ page }, use) => {
    const seed = await getSeedData();
    const staffEmail = TEST_DATA.staffEmail && TEST_DATA.staffPassword ? TEST_DATA.staffEmail : TEST_DATA.adminEmail;
    const staffPassword = TEST_DATA.staffEmail && TEST_DATA.staffPassword ? TEST_DATA.staffPassword : TEST_DATA.adminPassword;

    await loginWithCredentials(page, staffEmail, staffPassword, `/merchant/${seed.merchantSlug}/redemptions`);
    await use({
      id: 'merchant-staff',
      email: staffEmail,
      merchantId: seed.merchantId,
      merchantSlug: seed.merchantSlug,
    });
  },

  testMerchant: async ({}, use) => {
    const seed = await getSeedData();
    await use({ id: seed.merchantId, slug: seed.merchantSlug });
  },
});

export { expect } from '@playwright/test';
