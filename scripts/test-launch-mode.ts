#!/usr/bin/env tsx
/**
 * Launch Mode Test Script
 * 
 * Tests kill switch and feature flags functionality:
 * - Verifies isActive field works
 * - Tests feature flag checks
 * - Verifies inactive merchants are blocked
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { isMerchantActive, requireActiveMerchant, isFeatureEnabled, activateMerchant, deactivateMerchant } from '../lib/merchant-status';
import { NotFoundError, ForbiddenError } from '../lib/errors';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  message: string;
}

const results: TestResult[] = [];

function addResult(name: string, status: 'pass' | 'fail', message: string) {
  results.push({ name, status, message });
  const icon = status === 'pass' ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

async function testIsMerchantActive() {
  try {
    // Find or create a test merchant
    let merchant = await prisma.merchant.findFirst();
    
    if (!merchant) {
      addResult('isMerchantActive: Setup', 'fail', 'No merchant found - run seed script first');
      return;
    }

    // Test active merchant
    const isActive = await isMerchantActive(merchant.id);
    if (typeof isActive === 'boolean') {
      addResult('isMerchantActive: Returns boolean', 'pass', `Merchant is ${isActive ? 'active' : 'inactive'}`);
    } else {
      addResult('isMerchantActive: Returns boolean', 'fail', 'Function does not return boolean');
    }

    // Test non-existent merchant
    try {
      await isMerchantActive('non-existent-id');
      addResult('isMerchantActive: Non-existent merchant', 'fail', 'Should throw NotFoundError');
    } catch (error) {
      if (error instanceof NotFoundError) {
        addResult('isMerchantActive: Non-existent merchant', 'pass', 'Correctly throws NotFoundError');
      } else {
        addResult('isMerchantActive: Non-existent merchant', 'fail', `Wrong error type: ${error instanceof Error ? error.constructor.name : 'Unknown'}`);
      }
    }
  } catch (error) {
    addResult('isMerchantActive: Test', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function testRequireActiveMerchant() {
  try {
    const merchant = await prisma.merchant.findFirst();
    if (!merchant) {
      addResult('requireActiveMerchant: Setup', 'fail', 'No merchant found');
      return;
    }

    // Test with active merchant
    try {
      // Ensure merchant is active
      await prisma.merchant.update({
        where: { id: merchant.id },
        data: { isActive: true },
      });

      await requireActiveMerchant(merchant.id);
      addResult('requireActiveMerchant: Active merchant', 'pass', 'Does not throw for active merchant');
    } catch (error) {
      addResult('requireActiveMerchant: Active merchant', 'fail', `Should not throw: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    // Test with inactive merchant
    try {
      // Deactivate merchant
      await prisma.merchant.update({
        where: { id: merchant.id },
        data: { isActive: false },
      });

      await requireActiveMerchant(merchant.id);
      addResult('requireActiveMerchant: Inactive merchant', 'fail', 'Should throw ForbiddenError');
    } catch (error) {
      if (error instanceof ForbiddenError) {
        addResult('requireActiveMerchant: Inactive merchant', 'pass', 'Correctly throws ForbiddenError');
      } else {
        addResult('requireActiveMerchant: Inactive merchant', 'fail', `Wrong error type: ${error instanceof Error ? error.constructor.name : 'Unknown'}`);
      }
    } finally {
      // Reactivate merchant
      await prisma.merchant.update({
        where: { id: merchant.id },
        data: { isActive: true },
      });
    }
  } catch (error) {
    addResult('requireActiveMerchant: Test', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function testFeatureFlags() {
  try {
    const merchant = await prisma.merchant.findFirst();
    if (!merchant) {
      addResult('Feature Flags: Setup', 'fail', 'No merchant found');
      return;
    }

    // Test with no feature flags
    const flagsEmpty = await isFeatureEnabled(merchant.id, 'testFeature');
    if (flagsEmpty === false) {
      addResult('Feature Flags: Default false', 'pass', 'Returns false when feature flag not set');
    } else {
      addResult('Feature Flags: Default false', 'fail', 'Should return false when feature flag not set');
    }

    // Set a feature flag
    await prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        featureFlags: {
          testFeature: true,
          anotherFeature: false,
        },
      },
    });

    const enabled = await isFeatureEnabled(merchant.id, 'testFeature');
    if (enabled === true) {
      addResult('Feature Flags: Enabled flag', 'pass', 'Returns true for enabled feature');
    } else {
      addResult('Feature Flags: Enabled flag', 'fail', 'Should return true for enabled feature');
    }

    const disabled = await isFeatureEnabled(merchant.id, 'anotherFeature');
    if (disabled === false) {
      addResult('Feature Flags: Disabled flag', 'pass', 'Returns false for disabled feature');
    } else {
      addResult('Feature Flags: Disabled flag', 'fail', 'Should return false for disabled feature');
    }

    // Clean up
    await prisma.merchant.update({
      where: { id: merchant.id },
      data: { featureFlags: Prisma.JsonNull },
    });
  } catch (error) {
    addResult('Feature Flags: Test', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function testActivateDeactivate() {
  try {
    const merchant = await prisma.merchant.findFirst();
    if (!merchant) {
      addResult('Activate/Deactivate: Setup', 'fail', 'No merchant found');
      return;
    }

    // Find or create a test user for audit log
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });
    }

    // Test deactivate
    await deactivateMerchant(merchant.id, user.id, 'Test deactivation');
    
    const isInactive = await isMerchantActive(merchant.id);
    if (isInactive === false) {
      addResult('Deactivate Merchant: Function', 'pass', 'Successfully deactivates merchant');
    } else {
      addResult('Deactivate Merchant: Function', 'fail', 'Merchant should be inactive after deactivation');
    }

    // Check audit log
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        merchantId: merchant.id,
        action: 'merchant_deactivated',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (auditLog) {
      addResult('Deactivate Merchant: Audit log', 'pass', 'Audit log entry created');
    } else {
      addResult('Deactivate Merchant: Audit log', 'fail', 'Audit log entry not found');
    }

    // Test activate
    await activateMerchant(merchant.id, user.id);
    
    const isActive = await isMerchantActive(merchant.id);
    if (isActive === true) {
      addResult('Activate Merchant: Function', 'pass', 'Successfully activates merchant');
    } else {
      addResult('Activate Merchant: Function', 'fail', 'Merchant should be active after activation');
    }

    // Check audit log
    const activateLog = await prisma.auditLog.findFirst({
      where: {
        merchantId: merchant.id,
        action: 'merchant_activated',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activateLog) {
      addResult('Activate Merchant: Audit log', 'pass', 'Audit log entry created');
    } else {
      addResult('Activate Merchant: Audit log', 'fail', 'Audit log entry not found');
    }
  } catch (error) {
    addResult('Activate/Deactivate: Test', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function main() {
  console.log('🧪 Testing Launch Mode Functionality...\n');

  await testIsMerchantActive();
  await testRequireActiveMerchant();
  await testFeatureFlags();
  await testActivateDeactivate();

  await prisma.$disconnect();

  // Summary
  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;

  console.log(`\n📈 Summary: ${passCount} passed, ${failCount} failed\n`);

  if (failCount > 0) {
    console.log('❌ Some tests failed. Please review the errors above.');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Error running tests:', error);
  process.exit(1);
});
