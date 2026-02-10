import { prisma } from "@/lib/prisma";
import { NotFoundError, PaymentRequiredError } from "@/lib/errors";
import { evaluateEntitlement, PLAN_CATALOG, resolveBilling, type MonetizedCapability } from "@/lib/access-control/monetization";

function getCycleStart(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

async function getUsageSnapshot(merchantId: string, now: Date) {
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

function getUpgradePath(merchantSlug: string, capability: MonetizedCapability) {
  return `/merchant/${merchantSlug}/settings?upgrade=${encodeURIComponent(capability)}`;
}

export async function getMerchantBillingStatus(merchantId: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: { subscription: true },
  });

  if (!merchant) {
    throw new NotFoundError("Merchant not found");
  }

  const billing = resolveBilling(
    {
      createdAt: merchant.createdAt,
      subscriptionStatus: merchant.subscription?.status ?? null,
      subscriptionPriceId: merchant.subscription?.priceId ?? null,
      trialEndsAt: merchant.subscription?.trialEndsAt ?? null,
      currentPeriodEnd: merchant.subscription?.currentPeriodEnd ?? null,
    },
    new Date()
  );

  return {
    status: merchant.subscription?.status ?? "inactive",
    active: billing.billingState === "active" || billing.billingState === "trial" || billing.billingState === "grace",
    inTrial: billing.billingState === "trial",
    billingState: billing.billingState,
    planTier: billing.planTier,
    plan: PLAN_CATALOG[billing.planTier],
    trialEndsAt: billing.trialEndsAt,
    graceEndsAt: billing.graceEndsAt,
    currentPeriodEnd: merchant.subscription?.currentPeriodEnd ?? null,
    stripeCustomerId: merchant.subscription?.stripeCustomerId ?? null,
    stripeSubscriptionId: merchant.subscription?.stripeSubscriptionId ?? null,
  };
}

async function requireCapabilityAccess(merchantId: string, capability: MonetizedCapability) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: { subscription: true },
  });

  if (!merchant) {
    throw new NotFoundError("Merchant not found");
  }

  const now = new Date();
  const usage = await getUsageSnapshot(merchantId, now);
  const decision = evaluateEntitlement(
    capability,
    {
      createdAt: merchant.createdAt,
      subscriptionStatus: merchant.subscription?.status ?? null,
      subscriptionPriceId: merchant.subscription?.priceId ?? null,
      trialEndsAt: merchant.subscription?.trialEndsAt ?? null,
      currentPeriodEnd: merchant.subscription?.currentPeriodEnd ?? null,
    },
    usage,
    getUpgradePath(merchant.slug, capability),
    now
  );

  if (!decision.allowed) {
    throw new PaymentRequiredError(decision.reason ?? "Subscription upgrade required.", {
      code: decision.code ?? "PAYWALL_BLOCKED",
      capability,
      billingState: decision.billingState,
      planTier: decision.planTier,
      requiredPlan: decision.requiredPlan ?? null,
      upgradePath: decision.upgradePath,
      limit: decision.limit ?? null,
      graceEndsAt: decision.graceEndsAt?.toISOString() ?? null,
    });
  }

  return decision;
}

export async function requireCampaignCreationAccess(merchantId: string) {
  return requireCapabilityAccess(merchantId, "campaign.create");
}

export async function requireVoucherCreationAccess(merchantId: string) {
  return requireCapabilityAccess(merchantId, "voucher.create");
}

export async function requireTeamInviteAccess(merchantId: string) {
  return requireCapabilityAccess(merchantId, "team.member.invite");
}
