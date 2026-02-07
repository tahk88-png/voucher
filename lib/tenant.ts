import { prisma } from './prisma';

/**
 * Ensure a resource belongs to the specified merchant (tenant isolation)
 */
export async function ensureMerchantOwnership(
  resourceType: 'voucher' | 'referral' | 'redemption' | 'creditLedger',
  resourceId: string,
  merchantId: string
): Promise<boolean> {
  switch (resourceType) {
    case 'voucher': {
      const voucher = await prisma.voucher.findFirst({
        where: {
          id: resourceId,
          merchantId,
        },
      });
      return !!voucher;
    }
    case 'referral': {
      const referral = await prisma.referral.findFirst({
        where: {
          id: resourceId,
          merchantId,
        },
      });
      return !!referral;
    }
    case 'redemption': {
      const redemption = await prisma.redemption.findFirst({
        where: {
          id: resourceId,
          merchantId,
        },
      });
      return !!redemption;
    }
    case 'creditLedger': {
      const credit = await prisma.creditLedger.findFirst({
        where: {
          id: resourceId,
          merchantId,
        },
      });
      return !!credit;
    }
    default:
      return false;
  }
}

/**
 * Get merchant by slug
 */
export async function getMerchantBySlug(slug: string) {
  return prisma.merchant.findUnique({
    where: { slug },
  });
}
