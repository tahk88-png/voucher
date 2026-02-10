import { prisma } from "@/lib/prisma";
import { isPlatformAdmin as isPlatformAdminEmail } from "@/lib/admin";
import type { TenantMembershipRole } from "@/lib/access-control/roles";

export type Role = "platform_admin" | "merchant_admin" | "merchant_staff" | "user";

export interface UserWithRoles {
  id: string;
  email: string;
  merchantRoles: Array<{
    merchantId: string;
    role: TenantMembershipRole;
  }>;
}

const ROLE_RANK: Record<TenantMembershipRole, number> = {
  merchant_staff: 1,
  merchant_admin: 2,
};

/**
 * Get user's tenant memberships.
 * Backwards-compatible API used by existing routes.
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
    merchantRoles: user.merchantMembers.map((member) => ({
      merchantId: member.merchantId,
      role: member.role as TenantMembershipRole,
    })),
  };
}

/**
 * Check tenant role hierarchy.
 */
export async function hasMerchantRole(
  userId: string,
  merchantId: string,
  requiredRole: TenantMembershipRole
): Promise<boolean> {
  const member = await prisma.merchantMember.findUnique({
    where: {
      merchantId_userId: {
        merchantId,
        userId,
      },
    },
    select: { role: true },
  });

  if (!member) return false;

  const currentRole = member.role as TenantMembershipRole;
  return ROLE_RANK[currentRole] >= ROLE_RANK[requiredRole];
}

/**
 * Platform admin check.
 */
export function isPlatformAdmin(email: string | null | undefined): boolean {
  return isPlatformAdminEmail(email);
}

/**
 * Require tenant role or throw.
 */
export async function requireMerchantRole(
  userId: string,
  merchantId: string,
  requiredRole: TenantMembershipRole
): Promise<void> {
  const allowed = await hasMerchantRole(userId, merchantId, requiredRole);
  if (!allowed) {
    throw new Error("Insufficient permissions for this tenant action.");
  }
}
