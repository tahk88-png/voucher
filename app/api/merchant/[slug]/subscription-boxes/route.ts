import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withErrorHandler } from '@/lib/error-handler';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const merchant = await prisma.merchant.findUnique({ where: { slug } });
    if (!merchant) return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });

    const boxes = await prisma.subscriptionBox.findMany({
      where: { merchantId: merchant.id, isActive: true },
      include: { _count: { select: { subscriptions: true } }, items: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      boxes.map((b: any) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        priceCents: b.priceCents,
        currency: b.currency,
        interval: b.interval,
        maxItems: b.maxItems,
        subscriberCount: b._count.subscriptions,
        itemCount: b.items.length,
        createdAt: b.createdAt.toISOString(),
      })),
    );
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug } = await params;
    const merchant = await prisma.merchant.findUnique({ where: { slug } });
    if (!merchant) return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });

    // Verify merchant admin
    const member = await prisma.merchantMember.findUnique({
      where: { merchantId_userId: { merchantId: merchant.id, userId: session.user.id } },
    });
    if (!member || member.role !== 'merchant_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, priceCents, currency, interval, maxItems } = body;

    if (!name || !priceCents) {
      return NextResponse.json({ error: 'name and priceCents are required' }, { status: 400 });
    }

    const box = await prisma.subscriptionBox.create({
      data: {
        merchantId: merchant.id,
        name,
        description: description || null,
        priceCents: parseInt(priceCents, 10),
        currency: currency || 'EUR',
        interval: interval || 'monthly',
        maxItems: maxItems ? parseInt(maxItems, 10) : 3,
      },
    });

    return NextResponse.json(box, { status: 201 });
  });
}
