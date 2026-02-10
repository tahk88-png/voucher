import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  evaluateEntitlement,
  type EntitlementDecision,
  type MonetizedCapability,
  type MerchantBillingSnapshot,
  type MerchantUsageSnapshot,
} from "@/lib/access-control/monetization";
import { getMerchantMembership, profileHasPermission, resolveAccessProfile, type AccessProfile } from "@/lib/access-control/profile";
import { type AppPermission, type TenantMembershipRole } from "@/lib/access-control/roles";

const TENANT_ROLE_PRIORITY: Record<TenantMembershipRole, number> = {
  merchant_staff: 1,
  merchant_admin: 2,
};

export class AccessControlError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, status: number, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "AccessControlError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function requireAuthenticatedProfile(): Promise<AccessProfile> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AccessControlError("Authentication required.", 401, "AUTH_REQUIRED");
  }

  const profile = await resolveAccessProfile(session.user.id, session.user.email ?? null);
  if (!profile) {
    throw new AccessControlError("User account not found.", 401, "AUTH_PROFILE_NOT_FOUND");
  }

  return profile;
}

export function assertPermission(profile: AccessProfile, permission: AppPermission): void {
  if (!profileHasPermission(profile, permission)) {
    throw new AccessControlError("You do not have permission to perform this action.", 403, "PERMISSION_DENIED", {
      permission,
      roles: profile.roles,
    });
  }
}

export async function requirePlatformAdminProfile(): Promise<AccessProfile> {
  const profile = await requireAuthenticatedProfile();
  if (!profile.roles.includes("platform_admin")) {
    throw new AccessControlError("Platform admin access required.", 403, "PLATFORM_ADMIN_REQUIRED");
  }
  return profile;
}

export async function requireMerchantProfileAccessBySlug(
  merchantSlug: string,
  requiredRole: TenantMembershipRole = "merchant_staff"
): Promise<{
  profile: AccessProfile;
  merchant: {
    id: string;
    slug: string;
    name: string;
    createdAt: Date;
    subscription: {
      status: string;
      priceId: string | null;
      trialEndsAt: Date | null;
      currentPeriodEnd: Date | null;
    } | null;
  };
  effectiveRole: TenantMembershipRole;
}> {
  const profile = await requireAuthenticatedProfile();

  const merchant = await prisma.merchant.findUnique({
    where: { slug: merchantSlug },
    include: {
      subscription: {
        select: {
          status: true,
          priceId: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  return assertMerchantAccessForProfile(profile, merchant, requiredRole);
}

export async function requireMerchantProfileAccessById(
  merchantId: string,
  requiredRole: TenantMembershipRole = "merchant_staff"
): Promise<{
  profile: AccessProfile;
  merchant: {
    id: string;
    slug: string;
    name: string;
    createdAt: Date;
    subscription: {
      status: string;
      priceId: string | null;
      trialEndsAt: Date | null;
      currentPeriodEnd: Date | null;
    } | null;
  };
  effectiveRole: TenantMembershipRole;
}> {
  const profile = await requireAuthenticatedProfile();

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: {
      subscription: {
        select: {
          status: true,
          priceId: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  return assertMerchantAccessForProfile(profile, merchant, requiredRole);
}

function assertMerchantAccessForProfile(
  profile: AccessProfile,
  merchant: {
    id: string;
    slug: string;
    name: string;
    createdAt: Date;
    subscription: {
      status: string;
      priceId: string | null;
      trialEndsAt: Date | null;
      currentPeriodEnd: Date | null;
    } | null;
  } | null,
  requiredRole: TenantMembershipRole
) {
  if (!merchant) {
    throw new AccessControlError("Merchant not found.", 404, "MERCHANT_NOT_FOUND");
  }

  if (profile.roles.includes("platform_admin")) {
    return {
      profile,
      merchant,
      effectiveRole: "merchant_admin" as TenantMembershipRole,
    };
  }

  const membership = getMerchantMembership(profile, merchant.id);
  if (!membership) {
    throw new AccessControlError("Access to this tenant is not allowed.", 403, "TENANT_ACCESS_DENIED");
  }

  if (TENANT_ROLE_PRIORITY[membership.role] < TENANT_ROLE_PRIORITY[requiredRole]) {
    throw new AccessControlError("Higher tenant role required for this action.", 403, "TENANT_ROLE_TOO_LOW", {
      requiredRole,
      currentRole: membership.role,
    });
  }

  return {
    profile,
    merchant,
    effectiveRole: membership.role,
  };
}

function getCycleStart(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

async function getMerchantUsageSnapshot(merchantId: string, now: Date): Promise<MerchantUsageSnapshot> {
  const cycleStart = getCycleStart(now);
  const [campaignsCreatedInCycle, activeCampaigns, vouchersCreatedInCycle, teamMembers] = await Promise.all([
    prisma.campaign.count({
      where: {
        merchantId,
        createdAt: { gte: cycleStart },
      },
    }),
    prisma.campaign.count({
      where: {
        merchantId,
        status: "active",
      },
    }),
    prisma.voucher.count({
      where: {
        merchantId,
        createdAt: { gte: cycleStart },
      },
    }),
    prisma.merchantMember.count({
      where: { merchantId },
    }),
  ]);

  return {
    campaignsCreatedInCycle,
    activeCampaigns,
    vouchersCreatedInCycle,
    teamMembers,
  };
}

function getUpgradePath(merchantSlug: string, capability: MonetizedCapability): string {
  return `/merchant/${merchantSlug}/settings?upgrade=${encodeURIComponent(capability)}`;
}

export async function requireMerchantCapability(
  merchantId: string,
  merchantSlug: string,
  capability: MonetizedCapability
): Promise<EntitlementDecision> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: {
      subscription: {
        select: {
          status: true,
          priceId: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  if (!merchant) {
    throw new AccessControlError("Merchant not found.", 404, "MERCHANT_NOT_FOUND");
  }

  const now = new Date();
  const usageSnapshot = await getMerchantUsageSnapshot(merchantId, now);
  const billingSnapshot: MerchantBillingSnapshot = {
    createdAt: merchant.createdAt,
    subscriptionStatus: merchant.subscription?.status ?? null,
    subscriptionPriceId: merchant.subscription?.priceId ?? null,
    trialEndsAt: merchant.subscription?.trialEndsAt ?? null,
    currentPeriodEnd: merchant.subscription?.currentPeriodEnd ?? null,
  };

  const decision = evaluateEntitlement(
    capability,
    billingSnapshot,
    usageSnapshot,
    getUpgradePath(merchantSlug, capability),
    now
  );

  if (!decision.allowed) {
    throw new AccessControlError(decision.reason ?? "Plan restriction.", 402, decision.code ?? "PAYWALL_BLOCKED", {
      capability,
      billingState: decision.billingState,
      planTier: decision.planTier,
      requiredPlan: decision.requiredPlan,
      upgradePath: decision.upgradePath,
      limit: decision.limit,
      graceEndsAt: decision.graceEndsAt?.toISOString() ?? null,
    });
  }

  return decision;
}
