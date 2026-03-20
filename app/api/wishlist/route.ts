import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';

export async function GET() {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      include: {
        voucher: {
          select: {
            id: true,
            type: true,
            value: true,
            currency: true,
            status: true,
            validFrom: true,
            validTo: true,
            merchant: { select: { id: true, name: true, slug: true, brandLogoUrl: true } },
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        merchant: {
          select: {
            id: true,
            name: true,
            slug: true,
            brandLogoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ items });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { voucherId, campaignId, merchantId, priceAlert, alertPrice } = body;

    if (!voucherId && !campaignId && !merchantId) {
      return NextResponse.json(
        { error: 'voucherId, campaignId, or merchantId is required' },
        { status: 400 }
      );
    }

    // Check for existing wishlist item
    const existingWhere = {
      ...(voucherId && { userId_voucherId: { userId: session.user.id, voucherId } }),
      ...(campaignId && { userId_campaignId: { userId: session.user.id, campaignId } }),
      ...(merchantId && { userId_merchantId: { userId: session.user.id, merchantId } }),
    };

    // Use the first matching unique constraint
    const uniqueKey = Object.keys(existingWhere)[0];
    if (uniqueKey) {
      const existing = await prisma.wishlistItem.findUnique({
        where: { [uniqueKey]: (existingWhere as Record<string, unknown>)[uniqueKey] } as any,
      });
      if (existing) {
        return NextResponse.json({ error: 'Already in wishlist' }, { status: 409 });
      }
    }

    const item = await prisma.wishlistItem.create({
      data: {
        userId: session.user.id,
        voucherId: voucherId || null,
        campaignId: campaignId || null,
        merchantId: merchantId || null,
        priceAlert: priceAlert ?? false,
        alertPrice: alertPrice ?? null,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  });
}

export async function DELETE(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, voucherId, campaignId, merchantId } = body;

    if (id) {
      const item = await prisma.wishlistItem.findUnique({ where: { id } });
      if (!item || item.userId !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      await prisma.wishlistItem.delete({ where: { id } });
    } else if (voucherId) {
      await prisma.wishlistItem.deleteMany({
        where: { userId: session.user.id, voucherId },
      });
    } else if (campaignId) {
      await prisma.wishlistItem.deleteMany({
        where: { userId: session.user.id, campaignId },
      });
    } else if (merchantId) {
      await prisma.wishlistItem.deleteMany({
        where: { userId: session.user.id, merchantId },
      });
    } else {
      return NextResponse.json({ error: 'id, voucherId, campaignId, or merchantId is required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  });
}
