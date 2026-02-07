#!/usr/bin/env tsx
/**
 * Migration Check Script
 * 
 * Checks if database migrations are up to date and if launch mode migration has been applied.
 */

import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function checkMigrations() {
  console.log('🔍 Checking database migrations...\n');

  try {
    // Check if Merchant table has launch mode fields
    const result = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'Merchant'
        AND column_name IN ('isActive', 'featureFlags', 'invitedAt', 'onboardedAt')
      ORDER BY column_name;
    `;

    const requiredFields = ['isActive', 'featureFlags', 'invitedAt', 'onboardedAt'];
    const foundFields = result.map(r => r.column_name);

    console.log('Launch mode fields check:');
    for (const field of requiredFields) {
      if (foundFields.includes(field)) {
        console.log(`  ✅ ${field} - exists`);
      } else {
        console.log(`  ❌ ${field} - MISSING`);
      }
    }

    if (foundFields.length === requiredFields.length) {
      console.log('\n✅ All launch mode fields exist. Migration appears to be applied.');
    } else {
      console.log('\n⚠️  Some launch mode fields are missing.');
      console.log('\nTo apply migration:');
      console.log('  npm run db:migrate');
      console.log('  # Or apply SQL directly:');
      console.log('  psql $DATABASE_URL -f prisma/migrations/launch_mode/migration.sql');
    }

    // Check migration file exists
    const migrationPath = join(process.cwd(), 'prisma', 'migrations', 'launch_mode', 'migration.sql');
    if (existsSync(migrationPath)) {
      console.log('\n✅ Launch mode migration file exists');
    } else {
      console.log('\n⚠️  Launch mode migration file not found');
    }

  } catch (error) {
    console.error('❌ Error checking migrations:', error instanceof Error ? error.message : 'Unknown error');
    console.error('\nMake sure:');
    console.error('  1. Database is running');
    console.error('  2. DATABASE_URL is set correctly');
    console.error('  3. Prisma can connect to database');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
