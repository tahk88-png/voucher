import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import type { ABTestStatus } from '@prisma/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Variant = {
  id: string
  name: string
  weight: number
  config: Record<string, unknown>
}

export type TestResults = {
  testId: string
  testName: string
  status: ABTestStatus
  variants: Array<
    Variant & {
      impressions: number
      conversions: number
      conversionRate: number
    }
  >
  significance: number | null
  winnerId: string | null
}

// ---------------------------------------------------------------------------
// Deterministic variant assignment
// ---------------------------------------------------------------------------

function hashToVariant(testName: string, userId: string, variants: Variant[]): string {
  const hash = crypto
    .createHash('sha256')
    .update(testName + ':' + userId)
    .digest('hex')
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0)
  const bucket = parseInt(hash.substring(0, 8), 16) % totalWeight

  let cumulative = 0
  for (const variant of variants) {
    cumulative += variant.weight
    if (bucket < cumulative) return variant.id
  }
  return variants[variants.length - 1].id
}

// ---------------------------------------------------------------------------
// Get variant for a user (creates assignment if new)
// ---------------------------------------------------------------------------

export async function getVariant(
  testName: string,
  userId: string
): Promise<{ variantId: string; config: Record<string, unknown> } | null> {
  const test = await prisma.aBTest.findUnique({ where: { name: testName } })
  if (!test || test.status !== 'running') return null

  const variants = test.variants as Variant[]
  if (!variants || variants.length === 0) return null

  // Check existing assignment
  const existing = await prisma.aBTestAssignment.findUnique({
    where: { testId_userId: { testId: test.id, userId } },
  })

  if (existing) {
    const variant = variants.find((v) => v.id === existing.variantId)
    return { variantId: existing.variantId, config: variant?.config ?? {} }
  }

  // Deterministic assignment
  const variantId = hashToVariant(testName, userId, variants)
  await prisma.aBTestAssignment.create({
    data: { testId: test.id, userId, variantId },
  })

  // Update impressions metric
  const metrics = (test.metrics as Record<string, Record<string, number>>) ?? {
    impressions: {},
    conversions: {},
  }
  metrics.impressions = metrics.impressions ?? {}
  metrics.impressions[variantId] = (metrics.impressions[variantId] ?? 0) + 1
  await prisma.aBTest.update({ where: { id: test.id }, data: { metrics } })

  const variant = variants.find((v) => v.id === variantId)
  return { variantId, config: variant?.config ?? {} }
}

// ---------------------------------------------------------------------------
// Track conversion
// ---------------------------------------------------------------------------

export async function trackConversion(testName: string, userId: string): Promise<boolean> {
  const test = await prisma.aBTest.findUnique({ where: { name: testName } })
  if (!test) return false

  const assignment = await prisma.aBTestAssignment.findUnique({
    where: { testId_userId: { testId: test.id, userId } },
  })
  if (!assignment || assignment.converted) return false

  await prisma.aBTestAssignment.update({
    where: { id: assignment.id },
    data: { converted: true },
  })

  // Update conversions metric
  const metrics = (test.metrics as Record<string, Record<string, number>>) ?? {
    impressions: {},
    conversions: {},
  }
  metrics.conversions = metrics.conversions ?? {}
  metrics.conversions[assignment.variantId] =
    (metrics.conversions[assignment.variantId] ?? 0) + 1
  await prisma.aBTest.update({ where: { id: test.id }, data: { metrics } })

  return true
}

// ---------------------------------------------------------------------------
// Statistical significance (chi-squared approximation)
// ---------------------------------------------------------------------------

function chiSquaredSignificance(observed: number[][], expected: number[][]): number {
  let chiSq = 0
  for (let i = 0; i < observed.length; i++) {
    for (let j = 0; j < observed[i].length; j++) {
      if (expected[i][j] > 0) {
        chiSq += Math.pow(observed[i][j] - expected[i][j], 2) / expected[i][j]
      }
    }
  }

  // Approximate p-value for 1 degree of freedom (2 variants)
  // Using Wilson-Hilferty approximation
  const df = Math.max((observed.length - 1) * (observed[0].length - 1), 1)
  const z = Math.pow(chiSq / df, 1 / 3) - (1 - 2 / (9 * df))
  const sqrtTerm = Math.sqrt(2 / (9 * df))
  const pValue = 1 - normalCDF(z / sqrtTerm)
  return Math.max(0, Math.min(1, pValue))
}

function normalCDF(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const sign = x < 0 ? -1 : 1
  const absX = Math.abs(x)
  const t = 1.0 / (1.0 + p * absX)
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX)
  return 0.5 * (1.0 + sign * y)
}

// ---------------------------------------------------------------------------
// Get test results with stats
// ---------------------------------------------------------------------------

export async function getTestResults(testId: string): Promise<TestResults | null> {
  const test = await prisma.aBTest.findUnique({
    where: { id: testId },
    include: { assignments: true },
  })
  if (!test) return null

  const variants = test.variants as Variant[]
  const variantStats = variants.map((v) => {
    const assignments = test.assignments.filter((a) => a.variantId === v.id)
    const impressions = assignments.length
    const conversions = assignments.filter((a) => a.converted).length
    return {
      ...v,
      impressions,
      conversions,
      conversionRate: impressions > 0 ? conversions / impressions : 0,
    }
  })

  // Calculate significance if we have at least 2 variants with data
  let significance: number | null = null
  const withData = variantStats.filter((v) => v.impressions > 0)
  if (withData.length >= 2) {
    const totalImpressions = withData.reduce((s, v) => s + v.impressions, 0)
    const totalConversions = withData.reduce((s, v) => s + v.conversions, 0)
    const overallRate = totalConversions / totalImpressions

    const observed = withData.map((v) => [v.conversions, v.impressions - v.conversions])
    const expected = withData.map((v) => [
      v.impressions * overallRate,
      v.impressions * (1 - overallRate),
    ])
    significance = chiSquaredSignificance(observed, expected)
  }

  return {
    testId: test.id,
    testName: test.name,
    status: test.status,
    variants: variantStats,
    significance,
    winnerId: test.winnerId,
  }
}

// ---------------------------------------------------------------------------
// CRUD helpers
// ---------------------------------------------------------------------------

export async function createTest(data: {
  name: string
  description?: string
  targetType: string
  targetId?: string
  variants: Variant[]
}) {
  return prisma.aBTest.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      targetType: data.targetType,
      targetId: data.targetId ?? null,
      variants: data.variants as any,
      metrics: { impressions: {}, conversions: {} },
    },
  })
}

export async function updateTestStatus(
  testId: string,
  status: ABTestStatus,
  winnerId?: string
) {
  const updateData: Record<string, unknown> = { status }

  if (status === 'running') {
    updateData.startedAt = new Date()
  } else if (status === 'completed') {
    updateData.endedAt = new Date()
    if (winnerId) updateData.winnerId = winnerId
  }

  return prisma.aBTest.update({
    where: { id: testId },
    data: updateData,
  })
}
