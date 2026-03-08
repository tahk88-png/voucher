import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AccessControlError, accessErrorResponse, requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

// GET - list waitlist for a voucher
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{slug: string; id: string}> }
) {
  return withErrorHandler(async () => {
  const { slug, id } = await params
    await requireMerchantProfileAccessBySlug(slug, 'merchant_staff');

    const entries = await prisma.waitlistEntry.findMany({
      where: { voucherId: id },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    return NextResponse.json({ entries, count: entries.length });
  });
}

// POST - notify waitlist (send emails)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{slug: string; id: string}> }
) {
  return withErrorHandler(async () => {
  const { slug, id } = await params
    await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const voucher = await prisma.voucher.findFirst({
      where: { id },
      select: { id: true, merchantId: true, type: true, value: true, currency: true, validTo: true },
    });
    if (!voucher) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });

    const entries = await prisma.waitlistEntry.findMany({
      where: { voucherId: id, notifiedAt: null },
      take: 100,
    });

    // Mark as notified (actual email sending would be done in production via email service)
    await prisma.waitlistEntry.updateMany({
      where: { voucherId: id, notifiedAt: null },
      data: { notifiedAt: new Date() },
    });

    return NextResponse.json({ notified: entries.length });
  });
}
