import { prisma } from '@/lib/prisma'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PriceAdjustment = {
  rule: string
  ruleType: string
  amount: number
  reason: string
}

export type DynamicPriceResult = {
  finalPrice: number
  basePrice: number
  adjustments: PriceAdjustment[]
}

type RuleConfig = {
  peakHours?: number[]
  offPeakHours?: number[]
  multiplier?: number
  offPeakMultiplier?: number
  minPrice?: number
  maxPrice?: number
  threshold?: number // demand ratio or inventory count
  highDemandMultiplier?: number
  lowDemandMultiplier?: number
  lowInventoryThreshold?: number
  highInventoryThreshold?: number
  lowInventoryMultiplier?: number
  highInventoryMultiplier?: number
  surgeMultiplier?: number
  surgeDates?: string[] // ISO date strings
  surgeDaysOfWeek?: number[] // 0=Sun
  loyaltyDiscount?: number // percentage discount 0-100
  minPurchases?: number // minimum purchases to qualify
}

// ---------------------------------------------------------------------------
// In-memory view counter (production would use Redis)
// ---------------------------------------------------------------------------

const viewCounts = new Map<string, { views: number; lastReset: number }>()
const VIEW_WINDOW_MS = 60 * 60 * 1000 // 1 hour

export function recordPriceView(voucherId: string): void {
  const now = Date.now()
  const entry = viewCounts.get(voucherId)
  if (!entry || now - entry.lastReset > VIEW_WINDOW_MS) {
    viewCounts.set(voucherId, { views: 1, lastReset: now })
  } else {
    entry.views++
  }
}

function getViewCount(voucherId: string): number {
  const entry = viewCounts.get(voucherId)
  if (!entry) return 0
  if (Date.now() - entry.lastReset > VIEW_WINDOW_MS) return 0
  return entry.views
}

// ---------------------------------------------------------------------------
// Get active rules sorted by priority
// ---------------------------------------------------------------------------

export async function getActiveRules(
  merchantId: string,
  voucherId?: string,
  campaignId?: string
) {
  const where: Record<string, unknown> = {
    merchantId,
    isActive: true,
  }

  // Include global merchant rules + voucher/campaign specific
  const rules = await prisma.pricingRule.findMany({
    where: {
      merchantId,
      isActive: true,
      OR: [
        { voucherId: null, campaignId: null },
        ...(voucherId ? [{ voucherId }] : []),
        ...(campaignId ? [{ campaignId }] : []),
      ],
    },
    orderBy: { priority: 'desc' },
  })

  return rules
}

// ---------------------------------------------------------------------------
// Apply individual rule
// ---------------------------------------------------------------------------

function applyRule(
  ruleType: string,
  ruleName: string,
  config: RuleConfig,
  currentPrice: number,
  context: { voucherId: string; userId?: string; purchaseCount?: number }
): PriceAdjustment | null {
  switch (ruleType) {
    case 'demand': {
      const views = getViewCount(context.voucherId)
      const threshold = config.threshold ?? 50
      if (views > threshold) {
        const mult = config.highDemandMultiplier ?? 1.1
        const amount = Math.round(currentPrice * (mult - 1))
        return { rule: ruleName, ruleType, amount, reason: `High demand (${views} views/hr)` }
      }
      if (views < threshold / 5 && config.lowDemandMultiplier) {
        const mult = config.lowDemandMultiplier
        const amount = Math.round(currentPrice * (mult - 1))
        return { rule: ruleName, ruleType, amount, reason: `Low demand discount` }
      }
      return null
    }

    case 'time_of_day': {
      const hour = new Date().getHours()
      const peakHours = config.peakHours ?? [11, 12, 13, 14, 18, 19, 20]
      const isPeak = peakHours.includes(hour)
      if (isPeak) {
        const mult = config.multiplier ?? 1.15
        const amount = Math.round(currentPrice * (mult - 1))
        return { rule: ruleName, ruleType, amount, reason: `Peak hour pricing (${hour}:00)` }
      }
      if (config.offPeakMultiplier) {
        const mult = config.offPeakMultiplier
        const amount = Math.round(currentPrice * (mult - 1))
        return { rule: ruleName, ruleType, amount, reason: `Off-peak discount` }
      }
      return null
    }

    case 'inventory': {
      // This would ideally check actual inventory; simplified version
      const lowThreshold = config.lowInventoryThreshold ?? 5
      const highThreshold = config.highInventoryThreshold ?? 100
      // For now just apply multiplier based on config
      if (config.lowInventoryMultiplier) {
        const amount = Math.round(currentPrice * (config.lowInventoryMultiplier - 1))
        return { rule: ruleName, ruleType, amount, reason: 'Low inventory premium' }
      }
      return null
    }

    case 'surge': {
      const now = new Date()
      const todayStr = now.toISOString().split('T')[0]
      const dayOfWeek = now.getDay()

      const isSurgeDate = config.surgeDates?.includes(todayStr)
      const isSurgeDay = config.surgeDaysOfWeek?.includes(dayOfWeek)

      if (isSurgeDate || isSurgeDay) {
        const mult = config.surgeMultiplier ?? 1.25
        const amount = Math.round(currentPrice * (mult - 1))
        return { rule: ruleName, ruleType, amount, reason: 'Surge pricing active' }
      }
      return null
    }

    case 'loyalty': {
      const minPurchases = config.minPurchases ?? 3
      const discount = config.loyaltyDiscount ?? 10
      if ((context.purchaseCount ?? 0) >= minPurchases) {
        const amount = -Math.round(currentPrice * (discount / 100))
        return { rule: ruleName, ruleType, amount, reason: `Loyalty discount (${discount}%)` }
      }
      return null
    }

    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Calculate final dynamic price
// ---------------------------------------------------------------------------

export async function calculateDynamicPrice(
  voucherId: string,
  basePrice: number,
  merchantId: string,
  userId?: string
): Promise<DynamicPriceResult> {
  const rules = await getActiveRules(merchantId, voucherId)
  const adjustments: PriceAdjustment[] = []

  // Get user redemption count for loyalty rules
  let purchaseCount = 0
  if (userId) {
    purchaseCount = await prisma.redemption.count({
      where: { redeemedByUserId: userId, merchantId },
    }).catch(() => 0)
  }

  let currentPrice = basePrice

  for (const rule of rules) {
    const config = rule.config as RuleConfig
    const adjustment = applyRule(rule.ruleType, rule.id, config, currentPrice, {
      voucherId,
      userId,
      purchaseCount,
    })

    if (adjustment) {
      // Enforce min/max from config
      const minPrice = config.minPrice ?? 0
      const maxPrice = config.maxPrice ?? Infinity
      const newPrice = Math.max(minPrice, Math.min(maxPrice, currentPrice + adjustment.amount))
      adjustment.amount = newPrice - currentPrice
      if (adjustment.amount !== 0) {
        adjustments.push(adjustment)
        currentPrice = newPrice
      }
    }
  }

  // Final price must be non-negative
  const finalPrice = Math.max(0, Math.round(currentPrice))

  return { finalPrice, basePrice, adjustments }
}
