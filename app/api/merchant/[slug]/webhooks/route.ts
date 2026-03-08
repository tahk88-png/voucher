import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';

export async function GET(req: NextRequest, { params }: { params: Promise<{slug: string}> }) {
  return withErrorHandler(async () => {
  const { slug } = await params
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { merchantId: merchant.id },
      include: {
        _count: { select: { deliveries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(endpoints);
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{slug: string}> }) {
  return withErrorHandler(async () => {
  const { slug } = await params
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');
    const { url, events } = await req.json();

    if (!url || !events?.length) {
      return NextResponse.json({ error: 'url and events are required' }, { status: 400 });
    }

    const secret = crypto.randomBytes(32).toString('hex');

    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        merchantId: merchant.id,
        url,
        secret,
        events,
      },
    });

    return NextResponse.json({ ...endpoint, secret });
  });
}
