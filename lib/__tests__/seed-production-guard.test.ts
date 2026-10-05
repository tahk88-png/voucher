import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * prisma/seed.ts deletes rows and creates accounts whose passwords are
 * published in DEMO_USERS.md (including a platform admin). It must refuse to
 * run in production before it touches the database. prisma/ is outside the
 * tsconfig include, so this static check is the guard against regressions.
 */
describe('seed refuses to run in production', () => {
  const src = readFileSync(join(process.cwd(), 'prisma', 'seed.ts'), 'utf8');

  it('checks NODE_ENV=production with an explicit opt-out only', () => {
    expect(src).toMatch(/process\.env\.NODE_ENV === "production"/);
    expect(src).toMatch(/SEED_ALLOW_PRODUCTION !== "yes"/);
  });

  it('runs the check before the first destructive call', () => {
    const mainAt = src.indexOf('async function main()');
    const guardCallAt = src.indexOf('refuseInProduction()', mainAt);
    const firstDeleteAt = src.indexOf('.deleteMany(', mainAt);
    expect(guardCallAt).toBeGreaterThan(mainAt);
    expect(firstDeleteAt).toBeGreaterThan(guardCallAt);
  });
});
