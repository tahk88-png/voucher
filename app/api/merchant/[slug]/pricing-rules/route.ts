import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin')

    const rules = await prisma.pricingRule.findMany({
      where: { merchantId: merchant.id },
      orderBy: { priority: 'desc' },
    })

    return NextResponse.json({ rules })
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin')

    const body = await req.json()
    const { ruleType, config, voucherId, campaignId, priority, isActive } = body

    const validTypes = ['demand', 'time_of_day', 'inventory', 'surge', 'loyalty']
    if (!ruleType || !validTypes.includes(ruleType)) {
      return NextResponse.json(
        { error: `ruleType must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'config object is required' }, { status: 400 })
    }

    const rule = await prisma.pricingRule.create({
      data: {
        merchantId: merchant.id,
        ruleType,
        config,
        voucherId: voucherId ?? null,
        campaignId: campaignId ?? null,
        priority: priority ?? 0,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json({ rule }, { status: 201 })
  })
}
