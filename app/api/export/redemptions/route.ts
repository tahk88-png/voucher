import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchantSlug = req.nextUrl.searchParams.get('merchantSlug');
    if (!merchantSlug) {
      return NextResponse.json({ error: 'Merchant slug required' }, { status: 400 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

    const redemptions = await prisma.redemption.findMany({
      where: { merchantId: merchant.id },
      include: {
        voucher: {
          select: { id: true, type: true },
        },
        referral: {
          include: {
            referrer: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Generate CSV
    const headers = [
      'ID',
      'Voucher ID',
      'Voucher Type',
      'Method',
      'Order Reference',
      'Amount Before Discount',
      'Discount Applied',
      'Currency',
      'Referrer',
      'Confirmed At',
      'Created At',
    ];

    const rows = redemptions.map((r) => [
      r.id,
      r.voucher.id,
      r.voucher.type,
      r.method,
      r.orderReference || '',
      String(r.amountBeforeDiscount / 100),
      String(r.discountApplied / 100),
      r.currency,
      r.referral?.referrer?.email || '',
      r.confirmedAt ? new Date(r.confirmedAt).toISOString() : '',
      new Date(r.createdAt).toISOString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="redemptions-${merchantSlug}-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting redemptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
