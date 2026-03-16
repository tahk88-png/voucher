import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateDynamicPrice, recordPriceView } from '@/lib/dynamic-pricing'

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const voucherId = req.nextUrl.searchParams.get('voucherId')
    if (!voucherId) {
      return NextResponse.json({ error: 'voucherId parameter required' }, { status: 400 })
    }

    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
      select: { id: true, value: true, merchantId: true },
    })
    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 })
    }

    // Record the view for demand tracking
    recordPriceView(voucherId)

    const session = await auth()
    const userId = session?.user?.id

    const result = await calculateDynamicPrice(
      voucherId,
      voucher.value,
      voucher.merchantId,
      userId
    )

    return NextResponse.json({ price: result })
  })
}
