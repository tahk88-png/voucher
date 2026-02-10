import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/admin";
import {
  type AppPermission,
  type AppRole,
  getHighestRole,
  hasPermission,
  resolveDefaultLanding,
  roleFromTenantMembership,
  type TenantMembershipRole,
} from "@/lib/access-control/roles";

export type MerchantMembership = {
  merchantId: string;
  merchantSlug: string;
  merchantName: string;
  role: TenantMembershipRole;
};

export type AccessProfile = {
  userId: string;
  email: string | null;
  roles: AppRole[];
  highestRole: AppRole;
  merchantMemberships: MerchantMembership[];
};

export async function resolveAccessProfile(userId: string, emailHint?: string | null): Promise<AccessProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      merchantMembers: {
        include: {
          merchant: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const email = emailHint ?? user.email ?? null;
  const memberships: MerchantMembership[] = user.merchantMembers
    .filter((member) => Boolean(member.merchant))
    .map((member) => ({
      merchantId: member.merchantId,
      merchantSlug: member.merchant.slug,
      merchantName: member.merchant.name,
      role: member.role as TenantMembershipRole,
    }));

  const roleSet = new Set<AppRole>(["end_user"]);

  for (const membership of memberships) {
    roleSet.add(roleFromTenantMembership(membership.role));
  }

  if (isPlatformAdmin(email)) {
    roleSet.add("platform_admin");
  }

  const roles = Array.from(roleSet);
  const highestRole = getHighestRole(roles);

  return {
    userId: user.id,
    email,
    roles,
    highestRole,
    merchantMemberships: memberships,
  };
}

export function profileHasPermission(profile: AccessProfile, permission: AppPermission): boolean {
  return profile.roles.some((role) => hasPermission(role, permission));
}

export function getMerchantMembership(profile: AccessProfile, merchantId: string): MerchantMembership | null {
  return profile.merchantMemberships.find((membership) => membership.merchantId === merchantId) ?? null;
}

export function resolveDefaultLandingForProfile(profile: AccessProfile): string {
  const preferredMerchant = profile.merchantMemberships[0]?.merchantSlug;
  return resolveDefaultLanding(profile.highestRole, preferredMerchant);
}

