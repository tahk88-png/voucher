import { test, expect } from './fixtures';

/**
 * Password reset flow.
 *
 * Two UI modes depending on URL params:
 * - No `?token=...&email=...` → "Forgot password" form (request a reset link)
 * - Both present → "Reset password" form (set new password)
 *
 * Mutation paths (POST /api/auth/forgot-password, POST /api/auth/reset-password)
 * are unit-tested separately. These e2e specs verify the UI contract only:
 * the right form renders for the right URL shape, and submitting the forgot
 * form always lands on a "check your email" screen (to prevent enumeration).
 */

test.describe('Password reset page', () => {
  test('renders the forgot-password form when no token is present', async ({ page }) => {
    await page.goto('/reset-password', { waitUntil: 'domcontentloaded' });

    // The forgot-password form has an email input + send-link button.
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.getByRole('button', { name: /send.*reset|link/i })).toBeVisible();
    // And a back-to-login link for clarity
    await expect(page.locator('a[href="/login"]').first()).toBeVisible();
  });

  test('renders the reset-password form when token + email are present', async ({ page }) => {
    // Token value does not need to be valid — the form is rendered
    // client-side from URL params before any backend validation runs.
    await page.goto('/reset-password?token=test-token&email=user%40example.com', {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirm')).toBeVisible();
    await expect(page.getByRole('button', { name: /set|reset/i })).toBeVisible();
  });

  test('shows "check your email" confirmation after submitting the forgot form', async ({ page }) => {
    // Intercept the forgot-password API so the test doesn't depend on a
    // real mailer / DB row. The UI shows the confirmation regardless of
    // response (anti-enumeration), but we still want a 2xx-ish response
    // to keep network logs clean.
    await page.route('**/api/auth/forgot-password', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    );

    await page.goto('/reset-password', { waitUntil: 'domcontentloaded' });
    await page.fill('#email', 'reset-target@example.com');
    await page.getByRole('button', { name: /send.*reset|link/i }).click();

    // The "Check your email!" heading (or its translations) should appear
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible({ timeout: 5000 });
    // Back-to-login link remains
    await expect(page.locator('a[href="/login"]').first()).toBeVisible();
  });

  test('client-side validation rejects mismatched passwords', async ({ page }) => {
    await page.goto('/reset-password?token=test-token&email=user%40example.com', {
      waitUntil: 'domcontentloaded',
    });

    await page.fill('#password', 'Password123!');
    await page.fill('#confirm', 'Different456!');
    await page.getByRole('button', { name: /set|reset/i }).click();

    // Error text (English copy or non-English — just verify an error
    // container appears). The implementation renders an AlertCircle icon
    // with the error message; we check for the red-border alert div.
    await expect(page.locator('[class*="bg-red-50"]')).toBeVisible({ timeout: 3000 });
  });
});
