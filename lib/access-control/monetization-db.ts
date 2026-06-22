/**
 * DB-driven plan catalog (server-only).
 *
 * Split out of monetization.ts so that the pure plan data/types in that
 * module can be imported by client components without dragging prisma
 * (and its `fs`/`logger` transitive deps) into the browser bundle.
 *
 * Loads billing plans from the DB with a 5-minute in-process cache and
 * falls back to the hardcoded PLAN_CATALOG when the DB is empty or
 * unavailable.
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import {
  PLAN_CATALOG,
  PLAN_TIERS,
  resolvePlanTierFromPriceId,
  type PlanDefinition,
  type PlanTier,
  type MonetizedCapability,
} from "./monetization";

let cachedDbPlans: Record<string, PlanDefinition> | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

/**
 * Load billing plans from DB. Falls back to hardcoded PLAN_CATALOG if DB empty.
 * Cached for 5 minutes to avoid repeated DB queries.
 */
export async function getPlansFromDb(): Promise<Record<PlanTier, PlanDefinition>> {
  const now = Date.now();
  if (cachedDbPlans && now < cacheExpiry) {
    return cachedDbPlans as Record<PlanTier, PlanDefinition>;
  }

  try {
    const dbPlans = await prisma.billingPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    if (dbPlans.length === 0) {
      return PLAN_CATALOG;
    }

    const planMap: Record<string, PlanDefinition> = {};
    for (const p of dbPlans) {
      const limits = p.limits as PlanDefinition["limits"];
      const capabilities = p.capabilities as Record<MonetizedCapability, boolean>;
      planMap[p.slug] = {
        id: p.slug as PlanTier,
        label: p.name,
        monthlyPriceCents: p.priceMonthlyCents,
        yearlyPriceCents: p.priceYearlyCents,
        limits: {
          campaignCreatesPerCycle: limits?.campaignCreatesPerCycle ?? null,
          activeCampaigns: limits?.activeCampaigns ?? null,
          voucherCreatesPerCycle: limits?.voucherCreatesPerCycle ?? null,
          teamMembers: limits?.teamMembers ?? null,
        },
        capabilities: {
          "campaign.create": capabilities?.["campaign.create"] ?? true,
          "voucher.create": capabilities?.["voucher.create"] ?? true,
          "team.member.invite": capabilities?.["team.member.invite"] ?? true,
          "promotion.boost": capabilities?.["promotion.boost"] ?? false,
          "analytics.advanced": capabilities?.["analytics.advanced"] ?? false,
          "domain.custom": capabilities?.["domain.custom"] ?? false,
        },
      };
    }

    cachedDbPlans = planMap;
    cacheExpiry = now + CACHE_TTL_MS;
    return planMap as Record<PlanTier, PlanDefinition>;
  } catch {
    // DB unavailable — fall back to hardcoded
    return PLAN_CATALOG;
  }
}

/**
 * Resolve plan tier from Stripe price ID using DB plans.
 */
export async function resolvePlanTierFromDb(priceId: string | null): Promise<PlanTier> {
  if (!priceId) return "pro";

  try {
    const plan = await prisma.billingPlan.findFirst({
      where: {
        OR: [
          { stripePriceIdMonthly: priceId },
          { stripePriceIdYearly: priceId },
        ],
      },
    });
    if (plan && PLAN_TIERS.includes(plan.slug as PlanTier)) {
      return plan.slug as PlanTier;
    }
  } catch {
    // Fall back to env-based resolution
  }

  return resolvePlanTierFromPriceId(priceId);
}
