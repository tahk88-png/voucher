import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';

export async function GET(req: NextRequest, { params }: { params: Promise<{slug: string}> }) {
  return withErrorHandler(async () => {
  const { slug } = await params
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const url = new URL(req.url);
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');

    const fromDate = fromParam ? new Date(fromParam) : new Date(0);
    const toDate = toParam ? new Date(toParam + 'T23:59:59') : new Date();
    const dateFilter = { gte: fromDate, lte: toDate };

    const [voucherPurchases, ticketPurchases] = await Promise.all([
      prisma.voucherPurchase.findMany({
        where: { merchantId: merchant.id, status: 'paid', createdAt: dateFilter },
        select: { amount: true, platformFeeAmount: true, currency: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ticketPurchase.findMany({
        where: { merchantId: merchant.id, status: 'paid', createdAt: dateFilter },
        select: { amount: true, currency: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const rows = [
      '\uFEFFDate,Type,Amount,Currency,Platform Fee', // BOM for Excel UTF-8 compatibility
      ...voucherPurchases.map((p) =>
        `${p.createdAt.toISOString().split('T')[0]},voucher,${(p.amount / 100).toFixed(2)},${p.currency},${((p.platformFeeAmount || 0) / 100).toFixed(2)}`
      ),
      ...ticketPurchases.map((p) =>
        `${p.createdAt.toISOString().split('T')[0]},ticket,${(p.amount / 100).toFixed(2)},${p.currency},0.00`
      ),
    ];

    const dateLabel = fromParam ? `${fromParam}_${toParam ?? 'now'}` : new Date().toISOString().split('T')[0];

    return new NextResponse(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${merchant.slug}-report-${dateLabel}.csv"`,
      },
    });
  });
}
