import { prisma } from './prisma';
import { NotFoundError, ForbiddenError } from './errors';

/**
 * Check if merchant is active (kill switch)
 */
export async function isMerchantActive(merchantId: string): Promise<boolean> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { isActive: true },
  });

  if (!merchant) {
    throw new NotFoundError('Merchant not found');
  }

  return merchant.isActive ?? true; // Default to true if column doesn't exist yet
}

/**
 * Require merchant to be active, throw if inactive
 */
export async function requireActiveMerchant(merchantId: string): Promise<void> {
  const active = await isMerchantActive(merchantId);
  if (!active) {
    throw new ForbiddenError('Merchant is inactive');
  }
}

/**
 * Get merchant feature flags
 */
export async function getMerchantFeatureFlags(merchantId: string): Promise<Record<string, boolean>> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { featureFlags: true },
  });

  if (!merchant) {
    throw new NotFoundError('Merchant not found');
  }

  if (!merchant.featureFlags) {
    return {};
  }

  return merchant.featureFlags as Record<string, boolean>;
}

/**
 * Check if a specific feature flag is enabled for merchant
 */
export async function isFeatureEnabled(
  merchantId: string,
  featureName: string
): Promise<boolean> {
  const flags = await getMerchantFeatureFlags(merchantId);
  return flags[featureName] === true;
}

/**
 * Deactivate merchant (kill switch)
 * Logs action to audit log
 */
export async function deactivateMerchant(
  merchantId: string,
  actorUserId: string,
  reason?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Deactivate merchant
    await tx.merchant.update({
      where: { id: merchantId },
      data: { isActive: false },
    });

    // Log to audit
    await tx.auditLog.create({
      data: {
        merchantId,
        actorUserId,
        action: 'merchant_deactivated',
        payloadJson: JSON.stringify({ reason }),
      },
    });
  });
}

/**
 * Activate merchant
 * Logs action to audit log
 */
export async function activateMerchant(
  merchantId: string,
  actorUserId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Activate merchant
    await tx.merchant.update({
      where: { id: merchantId },
      data: { isActive: true },
    });

    // Log to audit
    await tx.auditLog.create({
      data: {
        merchantId,
        actorUserId,
        action: 'merchant_activated',
      },
    });
  });
}
