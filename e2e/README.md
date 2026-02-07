# E2E Tests

End-to-end tests using Playwright to verify the complete user flows.

## Setup

1. Install Playwright browsers:

```bash
npx playwright install
```

1. Ensure test database is seeded:

```bash
npm run db:seed
```

1. Start development server:

```bash
npm run dev
```

## Running Tests

### Run all E2E tests

```bash
npm run test:e2e
```

### Run with UI mode

```bash
npm run test:e2e:ui
```

### Run in debug mode

```bash
npm run test:e2e:debug
```

### Run specific test file

```bash
npx playwright test e2e/voucher-flow.spec.ts
```

## Test Structure

- `voucher-flow.spec.ts` - Complete voucher redemption flow
- `auth.spec.ts` - Authentication flows
- `merchant-dashboard.spec.ts` - Merchant dashboard operations

## Test Data

Tests require seeded data:

- Test merchant (slug: `coffee-house` or similar)
- Test users (admin and regular user)
- Published vouchers

Update test IDs in spec files to match your seed data.

## Configuration

See `playwright.config.ts` for:

- Browser configurations
- Base URL
- Test timeouts
- Screenshot/recording settings

## CI/CD

E2E tests run in CI (see `.github/workflows/ci.yml`):

- Tests run on push to main/develop
- Uses GitHub Actions runners
- Requires database service

## Writing New Tests

1. Create new spec file in `e2e/` directory
2. Use Playwright's page object model for reusable components
3. Use test fixtures for authentication
4. Clean up test data after each test

Example:

```typescript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('/path');
  await expect(page.locator('selector')).toBeVisible();
});
```
