import { defineConfig, configDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 20000,
    exclude: [
      ...configDefaults.exclude,
      'e2e/**',
      '**/e2e/**',
      // Ignore worktree copies (CCD session-created) that would otherwise
      // double-collect tests and hit a DB they can't authenticate against.
      '.claude/**',
      '**/.claude/**',
      // Integration tests that require a live Postgres. Run with
      // `npm run test:integration` after `docker compose up -d`.
      // NOTE: access-control.monetization & access-control.roles are PURE
      // (no prisma/DB — monetization.ts's DB helpers live in
      // monetization-db.ts), so they run in the default suite for revenue +
      // RBAC coverage. Only genuinely DB-backed tests stay gated below.
      ...(process.env.VITEST_INCLUDE_INTEGRATION
        ? []
        : [
            'lib/__tests__/credits.test.ts',
            'lib/__tests__/api/**',
            'lib/__tests__/b2b/**',
            'lib/__tests__/admin/idempotency.test.ts',
          ]),
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      // Focus coverage on our own code. Exclude generated / config / test
      // scaffolding so thresholds are meaningful.
      include: ['lib/**/*.{ts,tsx}'],
      exclude: [
        'lib/**/__tests__/**',
        'lib/**/*.test.{ts,tsx}',
        'lib/**/*.d.ts',
        'lib/generated/**',
      ],
      // Thresholds are the PR gate. These are the current *floor* — the
      // build fails if coverage regresses below them. Ratchet upward in
      // the same PR that adds new tests; never lower without a conscious
      // reason. Current headline: 8% lines / 13% functions / 55% branches
      // across lib/** (many untested surfaces still; email / stripe-webhook
      // / rate-limit / admin-audit / currency are covered).
      thresholds: {
        lines: 8,
        functions: 13,
        branches: 50,
        statements: 8,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
