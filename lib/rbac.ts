import { prisma } from './prisma';
import { isPlatformAdmin as isPlatformAdminEmail } from './admin';

export type Role = 'platform_admin' | 'merchant_admin' | 'merchant_staff' | 'user';

export interface UserWithRoles {
  id: string;
  email: string;
  merchantRoles: Array<{
    merchantId: string;
    role: 'merchant_admin' | 'merchant_staff';
  }>;
}

/**
 * Get user's roles across all merchants
 */
export async function getUserRoles(userId: string): Promise<UserWithRoles | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      merchantMembers: {
        select: {
          merchantId: true,
          role: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    merchantRoles: user.merchantMembers.map((mm) => ({
      merchantId: mm.merchantId,
      role: mm.role as 'merchant_admin' | 'merchant_staff',
    })),
  };
}

/**
 * Check if user has a specific role for a merchant
 */
export async function hasMerchantRole(
  userId: string,
  merchantId: string,
  requiredRole: 'merchant_admin' | 'merchant_staff'
): Promise<boolean> {
  const member = await prisma.merchantMember.findUnique({
    where: {
      merchantId_userId: {
        merchantId,
        userId,
      },
    },
  });

  if (!member) return false;

  if (requiredRole === 'merchant_admin') {
    return member.role === 'merchant_admin';
  }

  // merchant_staff can access merchant_staff routes, merchant_admin can access both
  return member.role === 'merchant_admin' || member.role === 'merchant_staff';
}

/**
 * Check if user is platform admin
 * For now, we'll use a simple env-based check. In production, add a platform_admin flag to User model.
 */
export function isPlatformAdmin(email: string | null | undefined): boolean {
  return isPlatformAdminEmail(email);
}

/**
 * Require merchant role or throw
 */
export async function requireMerchantRole(
  userId: string,
  merchantId: string,
  requiredRole: 'merchant_admin' | 'merchant_staff'
): Promise<void> {
  const hasRole = await hasMerchantRole(userId, merchantId, requiredRole);
  if (!hasRole) {
    throw new Error('Insufficient permissions');
  }
}
