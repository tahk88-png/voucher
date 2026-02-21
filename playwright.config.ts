import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const playwrightHost = process.env.PLAYWRIGHT_TEST_HOST || '127.0.0.1';
const playwrightPort = Number(process.env.PLAYWRIGHT_TEST_PORT || 3100);
const playwrightBaseUrl =
  process.env.PLAYWRIGHT_TEST_BASE_URL || `http://${playwrightHost}:${playwrightPort}`;
const playwrightDatabaseUrl =
  process.env.DATABASE_URL || 'postgresql://voucher_user:voucher_pass@localhost:5433/voucher_db';

if (!process.env.PLAYWRIGHT_TEST_BASE_URL) {
  process.env.PLAYWRIGHT_TEST_BASE_URL = playwrightBaseUrl;
}

export default defineConfig({
  testDir: './e2e',
  timeout: 90 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: playwrightBaseUrl,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `npm run dev -- --hostname ${playwrightHost} --port ${playwrightPort}`,
    url: playwrightBaseUrl,
    reuseExistingServer: false,
    timeout: 180 * 1000,
    env: {
      ...process.env,
      PLAYWRIGHT_TEST_BASE_URL: playwrightBaseUrl,
      DATABASE_URL: playwrightDatabaseUrl,
      NEXT_DIST_DIR: '.next-playwright',
    },
  },
});
