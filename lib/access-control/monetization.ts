export const PLAN_TIERS = ["starter", "growth", "scale"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const MONETIZED_CAPABILITIES = [
  "campaign.create",
  "voucher.create",
  "team.member.invite",
  "promotion.boost",
  "analytics.advanced",
  "domain.custom",
] as const;

export type MonetizedCapability = (typeof MONETIZED_CAPABILITIES)[number];

export type BillingState = "trial" | "active" | "grace" | "locked";

export type PlanDefinition = {
  id: PlanTier;
  label: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  limits: {
    campaignCreatesPerCycle: number | null;
    activeCampaigns: number | null;
    voucherCreatesPerCycle: number | null;
    teamMembers: number | null;
  };
  capabilities: Record<MonetizedCapability, boolean>;
};

const starterCapabilities: Record<MonetizedCapability, boolean> = {
  "campaign.create": true,
  "voucher.create": true,
  "team.member.invite": true,
  "promotion.boost": false,
  "analytics.advanced": false,
  "domain.custom": false,
};

const growthCapabilities: Record<MonetizedCapability, boolean> = {
  ...starterCapabilities,
  "promotion.boost": true,
  "analytics.advanced": true,
  "domain.custom": true,
};

const scaleCapabilities: Record<MonetizedCapability, boolean> = {
  ...growthCapabilities,
};

export const PLAN_CATALOG: Record<PlanTier, PlanDefinition> = {
  starter: {
    id: "starter",
    label: "Starter",
    monthlyPriceCents: 990,
    yearlyPriceCents: 9900,
    limits: {
      campaignCreatesPerCycle: 5,
      activeCampaigns: 3,
      voucherCreatesPerCycle: 200,
      teamMembers: 2,
    },
    capabilities: starterCapabilities,
  },
  growth: {
    id: "growth",
    label: "Growth",
    monthlyPriceCents: 2990,
    yearlyPriceCents: 29900,
    limits: {
      campaignCreatesPerCycle: 60,
      activeCampaigns: 25,
      voucherCreatesPerCycle: 4000,
      teamMembers: 10,
    },
    capabilities: growthCapabilities,
  },
  scale: {
    id: "scale",
    label: "Scale",
    monthlyPriceCents: 9990,
    yearlyPriceCents: 99900,
    limits: {
      campaignCreatesPerCycle: null,
      activeCampaigns: null,
      voucherCreatesPerCycle: null,
      teamMembers: null,
    },
    capabilities: scaleCapabilities,
  },
};

export type MonetizationSurfaceEntry = {
  feature: string;
  soldAs: "subscription" | "usage_limit" | "addon";
  whoPays: "tenant";
  paymentTrigger: string;
  blockedBehavior: string;
  upgradePath: string;
};

export const MONETIZATION_SURFACE_MAP: readonly MonetizationSurfaceEntry[] = [
  {
    feature: "Campaign creation",
    soldAs: "usage_limit",
    whoPays: "tenant",
    paymentTrigger: "Trial expired or monthly creation limit reached",
    blockedBehavior: "Hard block on campaign create API",
    upgradePath: "Merchant Settings -> Billing -> Upgrade plan",
  },
  {
    feature: "Voucher creation",
    soldAs: "usage_limit",
    whoPays: "tenant",
    paymentTrigger: "Trial expired or voucher monthly limit reached",
    blockedBehavior: "Hard block on voucher create API",
    upgradePath: "Merchant Settings -> Billing -> Upgrade plan",
  },
  {
    feature: "Team member seats",
    soldAs: "usage_limit",
    whoPays: "tenant",
    paymentTrigger: "Plan seat limit reached",
    blockedBehavior: "Hard block on team invite API",
    upgradePath: "Merchant Settings -> Billing -> Upgrade plan",
  },
  {
    feature: "Promotion boosts",
    soldAs: "subscription",
    whoPays: "tenant",
    paymentTrigger: "Capability unavailable on current plan",
    blockedBehavior: "Feature disabled with upgrade guidance",
    upgradePath: "Merchant Settings -> Billing -> Upgrade to Growth+",
  },
];

export const TRIAL_DAYS = 60;
export const BILLING_GRACE_DAYS = 7;

export type MerchantBillingSnapshot = {
  createdAt: Date;
  subscriptionStatus: string | null;
  subscriptionPriceId: string | null;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
};

export type MerchantUsageSnapshot = {
  campaignsCreatedInCycle: number;
  activeCampaigns: number;
  vouchersCreatedInCycle: number;
  teamMembers: number;
};

export type EntitlementDecision = {
  allowed: boolean;
  billingState: BillingState;
  planTier: PlanTier;
  code?: string;
  reason?: string;
  requiredPlan?: PlanTier;
  upgradePath: string;
  limit?: {
    key: string;
    current: number;
    max: number;
  };
  graceEndsAt?: Date | null;
};

type BillingResolution = {
  billingState: BillingState;
  trialEndsAt: Date;
  graceEndsAt: Date | null;
  planTier: PlanTier;
};

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getConfiguredPriceIds(): Record<PlanTier, string[]> {
  return {
    starter: [process.env.STRIPE_PRICE_ID_STARTER].filter(Boolean) as string[],
    growth: [process.env.STRIPE_PRICE_ID_GROWTH, process.env.STRIPE_SUBSCRIPTION_PRICE_ID].filter(Boolean) as string[],
    scale: [process.env.STRIPE_PRICE_ID_SCALE].filter(Boolean) as string[],
  };
}

export function resolvePlanTierFromPriceId(priceId: string | null): PlanTier {
  if (!priceId) {
    return "growth";
  }

  const configured = getConfiguredPriceIds();
  if (configured.scale.includes(priceId)) return "scale";
  if (configured.growth.includes(priceId)) return "growth";
  if (configured.starter.includes(priceId)) return "starter";
  return "growth";
}

export function resolveBilling(snapshot: MerchantBillingSnapshot, now: Date = new Date()): BillingResolution {
  const status = snapshot.subscriptionStatus ?? "inactive";
  const trialEndsAt = snapshot.trialEndsAt ?? addDays(snapshot.createdAt, TRIAL_DAYS);
  const inTrial = now < trialEndsAt;
  const planTier = resolvePlanTierFromPriceId(snapshot.subscriptionPriceId);

  if (status === "active" || status === "trialing") {
    return {
      billingState: inTrial ? "trial" : "active",
      trialEndsAt,
      graceEndsAt: null,
      planTier,
    };
  }

  const graceCandidate = snapshot.currentPeriodEnd ? addDays(snapshot.currentPeriodEnd, BILLING_GRACE_DAYS) : null;
  const inGrace =
    (status === "past_due" || status === "unpaid") &&
    Boolean(graceCandidate && now <= graceCandidate);

  if (inGrace) {
    return {
      billingState: "grace",
      trialEndsAt,
      graceEndsAt: graceCandidate,
      planTier,
    };
  }

  if (inTrial) {
    return {
      billingState: "trial",
      trialEndsAt,
      graceEndsAt: null,
      planTier: "growth",
    };
  }

  return {
    billingState: "locked",
    trialEndsAt,
    graceEndsAt: graceCandidate,
    planTier,
  };
}

function getLimitDecision(
  key: string,
  current: number,
  max: number | null,
  metadata: Omit<EntitlementDecision, "allowed" | "upgradePath"> & { upgradePath: string }
): EntitlementDecision | null {
  if (max === null) {
    return null;
  }
  if (current < max) {
    return null;
  }
  return {
    allowed: false,
    billingState: metadata.billingState,
    planTier: metadata.planTier,
    code: "PAYWALL_LIMIT_REACHED",
    reason: `Plan limit reached for ${key}.`,
    requiredPlan: metadata.planTier === "starter" ? "growth" : "scale",
    upgradePath: metadata.upgradePath,
    limit: { key, current, max },
    graceEndsAt: metadata.graceEndsAt,
  };
}

export function evaluateEntitlement(
  capability: MonetizedCapability,
  billingSnapshot: MerchantBillingSnapshot,
  usage: MerchantUsageSnapshot,
  upgradePath: string,
  now: Date = new Date()
): EntitlementDecision {
  const billing = resolveBilling(billingSnapshot, now);
  const plan = PLAN_CATALOG[billing.planTier];

  if (billing.billingState === "locked") {
    return {
      allowed: false,
      billingState: billing.billingState,
      planTier: billing.planTier,
      code: "PAYWALL_SUBSCRIPTION_REQUIRED",
      reason: "Active subscription required. Trial has ended.",
      requiredPlan: "starter",
      upgradePath,
      graceEndsAt: billing.graceEndsAt,
    };
  }

  if (!plan.capabilities[capability]) {
    return {
      allowed: false,
      billingState: billing.billingState,
      planTier: billing.planTier,
      code: "PAYWALL_PLAN_UPGRADE_REQUIRED",
      reason: `${plan.label} plan does not include ${capability}.`,
      requiredPlan: billing.planTier === "starter" ? "growth" : "scale",
      upgradePath,
      graceEndsAt: billing.graceEndsAt,
    };
  }

  const base = {
    billingState: billing.billingState,
    planTier: billing.planTier,
    graceEndsAt: billing.graceEndsAt,
    upgradePath,
  };

  if (capability === "campaign.create") {
    const cycleLimit = getLimitDecision(
      "campaignCreatesPerCycle",
      usage.campaignsCreatedInCycle,
      plan.limits.campaignCreatesPerCycle,
      base
    );
    if (cycleLimit) return cycleLimit;

    const activeLimit = getLimitDecision(
      "activeCampaigns",
      usage.activeCampaigns,
      plan.limits.activeCampaigns,
      base
    );
    if (activeLimit) return activeLimit;
  }

  if (capability === "voucher.create") {
    const voucherLimit = getLimitDecision(
      "voucherCreatesPerCycle",
      usage.vouchersCreatedInCycle,
      plan.limits.voucherCreatesPerCycle,
      base
    );
    if (voucherLimit) return voucherLimit;
  }

  if (capability === "team.member.invite") {
    const seatLimit = getLimitDecision(
      "teamMembers",
      usage.teamMembers,
      plan.limits.teamMembers,
      base
    );
    if (seatLimit) return seatLimit;
  }

  return {
    allowed: true,
    billingState: billing.billingState,
    planTier: billing.planTier,
    upgradePath,
    graceEndsAt: billing.graceEndsAt,
  };
}

