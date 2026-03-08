import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{slug: string; id: string}> }
) {
  return withErrorHandler(async () => {
  const { slug, id } = await params
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');
    const body = await req.json();

    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id: id, merchantId: merchant.id },
    });
    if (!endpoint) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.webhookEndpoint.update({
      where: { id },
      data: {
        ...(body.url !== undefined && { url: body.url }),
        ...(body.events !== undefined && { events: body.events }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json(updated);
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{slug: string; id: string}> }
) {
  return withErrorHandler(async () => {
  const { slug, id } = await params
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id: id, merchantId: merchant.id },
    });
    if (!endpoint) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.webhookEndpoint.delete({ where: { id } });

    return NextResponse.json({ success: true });
  });
}
