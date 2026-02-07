#!/usr/bin/env tsx
/**
 * MVP Setup Verification Script
 * 
 * Verifies that all MVP requirements are properly configured:
 * - Database schema is up to date
 * - Launch mode fields exist
 * - PWA is configured
 * - Cron endpoint exists
 * - Required environment variables are documented
 */

import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface VerificationResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const results: VerificationResult[] = [];

function addResult(name: string, status: 'pass' | 'fail' | 'warning', message: string) {
  results.push({ name, status, message });
}

async function verifyDatabaseSchema() {
  try {
    // Check if Merchant model has launch mode fields
    const merchant = await prisma.merchant.findFirst();
    if (!merchant) {
      addResult('Database Schema', 'warning', 'No merchants found - run seed script');
      return;
    }

    // Check if isActive field exists (launch mode)
    if (typeof merchant.isActive === 'undefined') {
      addResult('Launch Mode: isActive field', 'fail', 'Merchant.isActive field missing - run migration');
    } else {
      addResult('Launch Mode: isActive field', 'pass', 'Merchant.isActive field exists');
    }

    // Check if featureFlags field exists
    if (merchant.featureFlags === null || typeof merchant.featureFlags === 'undefined') {
      addResult('Launch Mode: featureFlags field', 'warning', 'featureFlags is null (OK if not set)');
    } else {
      addResult('Launch Mode: featureFlags field', 'pass', 'Merchant.featureFlags field exists');
    }

    // Check if invitedAt and onboardedAt exist
    if (typeof merchant.invitedAt === 'undefined') {
      addResult('Launch Mode: invitedAt field', 'fail', 'Merchant.invitedAt field missing - run migration');
    } else {
      addResult('Launch Mode: invitedAt field', 'pass', 'Merchant.invitedAt field exists');
    }

    if (typeof merchant.onboardedAt === 'undefined') {
      addResult('Launch Mode: onboardedAt field', 'fail', 'Merchant.onboardedAt field missing - run migration');
    } else {
      addResult('Launch Mode: onboardedAt field', 'pass', 'Merchant.onboardedAt field exists');
    }

    addResult('Database Schema', 'pass', 'Database schema verified');
  } catch (error) {
    addResult('Database Schema', 'fail', `Error checking schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function verifyPWASetup() {
  const manifestPath = join(process.cwd(), 'public', 'manifest.json');
  const icon192Path = join(process.cwd(), 'public', 'icon-192.png');
  const icon512Path = join(process.cwd(), 'public', 'icon-512.png');
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      if (manifest.name && manifest.icons && manifest.icons.length > 0) {
        addResult('PWA: manifest.json', 'pass', 'PWA manifest.json exists and is valid');
      } else {
        addResult('PWA: manifest.json', 'warning', 'PWA manifest.json exists but may be incomplete');
      }
    } catch (error) {
      addResult('PWA: manifest.json', 'fail', `Error reading manifest.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    addResult('PWA: manifest.json', 'fail', 'PWA manifest.json not found');
  }

  // Check PWA icons
  if (existsSync(icon192Path)) {
    addResult('PWA: icon-192.png', 'pass', 'PWA icon 192x192 exists');
  } else {
    addResult('PWA: icon-192.png', 'warning', 'PWA icon 192x192 missing (run: node scripts/generate-icons.js)');
  }

  if (existsSync(icon512Path)) {
    addResult('PWA: icon-512.png', 'pass', 'PWA icon 512x512 exists');
  } else {
    addResult('PWA: icon-512.png', 'warning', 'PWA icon 512x512 missing (run: node scripts/generate-icons.js)');
  }

  // Check next.config.js for PWA setup
  const nextConfigPath = join(process.cwd(), 'next.config.js');
  if (existsSync(nextConfigPath)) {
    const config = readFileSync(nextConfigPath, 'utf-8');
    if (config.includes('next-pwa')) {
      addResult('PWA: next-pwa config', 'pass', 'next-pwa is configured in next.config.js');
    } else {
      addResult('PWA: next-pwa config', 'fail', 'next-pwa not found in next.config.js');
    }
  }
}

function verifyCronSetup() {
  const cronEndpointPath = join(process.cwd(), 'app', 'api', 'cron', 'credit-expiry-warnings', 'route.ts');
  if (existsSync(cronEndpointPath)) {
    addResult('Cron: credit-expiry-warnings endpoint', 'pass', 'Cron endpoint exists');
  } else {
    addResult('Cron: credit-expiry-warnings endpoint', 'fail', 'Cron endpoint not found');
  }

  const vercelJsonPath = join(process.cwd(), 'vercel.json');
  if (existsSync(vercelJsonPath)) {
    try {
      const vercelConfig = JSON.parse(readFileSync(vercelJsonPath, 'utf-8'));
      if (vercelConfig.crons && vercelConfig.crons.length > 0) {
        addResult('Cron: vercel.json config', 'pass', 'Vercel cron configuration exists');
      } else {
        addResult('Cron: vercel.json config', 'warning', 'Vercel cron configuration missing (OK if not using Vercel)');
      }
    } catch (error) {
      addResult('Cron: vercel.json config', 'warning', 'Could not parse vercel.json');
    }
  } else {
    addResult('Cron: vercel.json config', 'warning', 'vercel.json not found (OK if not using Vercel)');
  }
}

function verifyLaunchModeFunctions() {
  const merchantStatusPath = join(process.cwd(), 'lib', 'merchant-status.ts');
  if (existsSync(merchantStatusPath)) {
    const content = readFileSync(merchantStatusPath, 'utf-8');
    
    if (content.includes('requireActiveMerchant')) {
      addResult('Launch Mode: requireActiveMerchant function', 'pass', 'requireActiveMerchant function exists');
    } else {
      addResult('Launch Mode: requireActiveMerchant function', 'fail', 'requireActiveMerchant function not found');
    }

    if (content.includes('isFeatureEnabled')) {
      addResult('Launch Mode: isFeatureEnabled function', 'pass', 'isFeatureEnabled function exists');
    } else {
      addResult('Launch Mode: isFeatureEnabled function', 'fail', 'isFeatureEnabled function not found');
    }

    if (content.includes('deactivateMerchant')) {
      addResult('Launch Mode: deactivateMerchant function', 'pass', 'deactivateMerchant function exists');
    } else {
      addResult('Launch Mode: deactivateMerchant function', 'fail', 'deactivateMerchant function not found');
    }
  } else {
    addResult('Launch Mode: merchant-status.ts', 'fail', 'lib/merchant-status.ts not found');
  }
}

function verifyEnvironmentVariables() {
  const envExamplePath = join(process.cwd(), '.env.example');
  if (existsSync(envExamplePath)) {
    const envExample = readFileSync(envExamplePath, 'utf-8');
    const requiredVars = [
      'DATABASE_URL',
      'AUTH_SECRET',
      'NEXTAUTH_URL',
      'NEXT_PUBLIC_APP_URL',
    ];

    const missing: string[] = [];
    for (const varName of requiredVars) {
      if (!envExample.includes(varName)) {
        missing.push(varName);
      }
    }

    if (missing.length === 0) {
      addResult('Environment: .env.example', 'pass', 'All required environment variables documented');
    } else {
      addResult('Environment: .env.example', 'warning', `Missing variables in .env.example: ${missing.join(', ')}`);
    }
  } else {
    addResult('Environment: .env.example', 'warning', '.env.example not found');
  }
}

async function main() {
  console.log('🔍 Verifying MVP Setup...\n');

  await verifyDatabaseSchema();
  verifyPWASetup();
  verifyCronSetup();
  verifyLaunchModeFunctions();
  verifyEnvironmentVariables();

  await prisma.$disconnect();

  // Print results
  console.log('\n📊 Verification Results:\n');
  
  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;

  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.name}: ${result.message}`);
    
    if (result.status === 'pass') passCount++;
    else if (result.status === 'fail') failCount++;
    else warningCount++;
  }

  console.log(`\n📈 Summary: ${passCount} passed, ${failCount} failed, ${warningCount} warnings\n`);

  if (failCount > 0) {
    console.log('❌ Some verifications failed. Please fix the issues above.');
    process.exit(1);
  } else if (warningCount > 0) {
    console.log('⚠️  Some warnings found. Review the items above.');
    process.exit(0);
  } else {
    console.log('✅ All verifications passed!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Error running verification:', error);
  process.exit(1);
});
