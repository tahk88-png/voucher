import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withErrorHandler } from '@/lib/error-handler';

type Params = Promise<{ slug: string; id: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  return withErrorHandler(async () => {
    const { slug, id } = await params;
    const merchant = await prisma.merchant.findUnique({ where: { slug } });
    if (!merchant) return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });

    const box = await prisma.subscriptionBox.findFirst({
      where: { id, merchantId: merchant.id },
      include: {
        items: { include: { voucher: { select: { id: true, type: true, value: true, currency: true } } } },
        _count: { select: { subscriptions: true } },
      },
    });

    if (!box) return NextResponse.json({ error: 'Box not found' }, { status: 404 });

    return NextResponse.json({
      ...box,
      subscriberCount: box._count.subscriptions,
      createdAt: box.createdAt.toISOString(),
      updatedAt: box.updatedAt.toISOString(),
    });
  });
}

export async function PUT(req: NextRequest, { params }: { params: Params }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug, id } = await params;
    const merchant = await prisma.merchant.findUnique({ where: { slug } });
    if (!merchant) return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });

    const member = await prisma.merchantMember.findUnique({
      where: { merchantId_userId: { merchantId: merchant.id, userId: session.user.id } },
    });
    if (!member || member.role !== 'merchant_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, priceCents, currency, interval, maxItems, isActive } = body;

    const box = await prisma.subscriptionBox.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(priceCents !== undefined && { priceCents: parseInt(priceCents, 10) }),
        ...(currency !== undefined && { currency }),
        ...(interval !== undefined && { interval }),
        ...(maxItems !== undefined && { maxItems: parseInt(maxItems, 10) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(box);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug, id } = await params;
    const merchant = await prisma.merchant.findUnique({ where: { slug } });
    if (!merchant) return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });

    const member = await prisma.merchantMember.findUnique({
      where: { merchantId_userId: { merchantId: merchant.id, userId: session.user.id } },
    });
    if (!member || member.role !== 'merchant_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.subscriptionBox.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  });
}
