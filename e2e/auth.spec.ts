import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'test123';
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:3100';

async function loginWithCredentials(page: Page, email: string, password: string, callbackPath = '/app/entry') {
  const csrfResponse = await page.request.get('/api/auth/csrf');
  expect(csrfResponse.ok()).toBeTruthy();

  const csrfBody = (await csrfResponse.json()) as { csrfToken?: string };
  if (!csrfBody.csrfToken) {
    throw new Error('Missing CSRF token from /api/auth/csrf');
  }

  const signInResponse = await page.request.post('/api/auth/callback/credentials', {
    form: {
      csrfToken: csrfBody.csrfToken,
      email,
      password,
      callbackUrl: `${BASE_URL}${callbackPath}`,
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

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('form')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#cred-email')).toBeVisible();
    await expect(page.locator('#cred-password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should allow navigation to login from home', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const loginLink = page.locator('a[href="/login"]').first();
    await expect(loginLink).toBeVisible();

    const loginHref = await loginLink.getAttribute('href');
    expect(loginHref).toBe('/login');

    await page.goto(loginHref ?? '/login', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should login with credentials', async ({ page }) => {
    await loginWithCredentials(page, TEST_EMAIL, TEST_PASSWORD);

    const landingPath = new URL(page.url()).pathname;
    expect(landingPath).toMatch(/^\/(app|merchant|admin)(\/|$)/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    await page.fill('#cred-email', 'invalid-email');
    await page.fill('#cred-password', 'anything');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });
});
