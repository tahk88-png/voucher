import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  return withErrorHandler(async () => {
    const { slug, id } = await params
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin')

    const existing = await prisma.pricingRule.findFirst({
      where: { id, merchantId: merchant.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    const body = await req.json()
    const { ruleType, config, priority, isActive, voucherId, campaignId } = body

    const rule = await prisma.pricingRule.update({
      where: { id },
      data: {
        ...(ruleType !== undefined && { ruleType }),
        ...(config !== undefined && { config }),
        ...(priority !== undefined && { priority }),
        ...(isActive !== undefined && { isActive }),
        ...(voucherId !== undefined && { voucherId }),
        ...(campaignId !== undefined && { campaignId }),
      },
    })

    return NextResponse.json({ rule })
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  return withErrorHandler(async () => {
    const { slug, id } = await params
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin')

    const existing = await prisma.pricingRule.findFirst({
      where: { id, merchantId: merchant.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    await prisma.pricingRule.delete({ where: { id } })

    return NextResponse.json({ success: true })
  })
}
