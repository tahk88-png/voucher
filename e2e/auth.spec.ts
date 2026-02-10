import { test, expect } from './fixtures';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    
    // Verify login form is visible
    await expect(page.locator('form')).toBeVisible({ timeout: 5000 });
    
    // Verify email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Verify submit action exists for passwordless flow
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('should allow navigation to login from home', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Find and click login link
    const loginLink = page
      .locator('a[href*="login"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Logi sisse")')
      .first();
    if (await loginLink.isVisible({ timeout: 2000 })) {
      await loginLink.click();
      await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
    }
  });

  test('should login with credentials', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';

    await page.goto('/login?role=user', { waitUntil: 'domcontentloaded' });
    
    // Fill login form (current UX is passwordless email link)
    await page.fill('input[type="email"]', testEmail);
    await page.locator('button[type="submit"]').first().click();
    
    // Wait for redirect after login
    await page.waitForURL(/.*user-dashboard|.*app|.*merchant|.*dashboard/, { timeout: 15000 });
    
    // Verify dashboard content renders
    await expect(page.getByText(/Rewards Dashboard|Dashboard/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    
    // Try to login with malformed email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.locator('button[type="submit"]').first().click();

    // HTML5 validation or inline error should block successful login
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });
});
