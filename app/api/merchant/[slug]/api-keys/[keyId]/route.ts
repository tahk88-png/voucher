import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';

const AVAILABLE_PERMISSIONS = [
  'voucher.read',
  'voucher.create',
  'voucher.redeem',
  'campaign.read',
  'campaign.create',
  'gift_card.read',
  'gift_card.redeem',
  'customer.read',
  'analytics.read',
  'event.read',
  'event.checkin',
] as const;

const updateKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: z.array(z.enum(AVAILABLE_PERMISSIONS)).min(1).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; keyId: string }> }
) {
  return withErrorHandler(async () => {
    const { slug, keyId } = await params;
    const { merchant, profile } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const existing = await prisma.merchantApiKey.findFirst({
      where: { id: keyId, merchantId: merchant.id, revoked: false },
    });

    if (!existing) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    const body = await req.json();
    const data = updateKeySchema.parse(body);

    const updated = await prisma.merchantApiKey.update({
      where: { id: keyId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.permissions !== undefined ? { permissions: data.permissions } : {}),
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        actorUserId: profile.userId,
        action: 'api_key.updated',
        resourceType: 'api_key',
        resourceId: keyId,
        payloadJson: JSON.stringify(data),
      },
    });

    return NextResponse.json(updated);
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; keyId: string }> }
) {
  return withErrorHandler(async () => {
    const { slug, keyId } = await params;
    const { merchant, profile } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const existing = await prisma.merchantApiKey.findFirst({
      where: { id: keyId, merchantId: merchant.id, revoked: false },
    });

    if (!existing) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    await prisma.merchantApiKey.update({
      where: { id: keyId },
      data: { revoked: true },
    });

    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        actorUserId: profile.userId,
        action: 'api_key.revoked',
        resourceType: 'api_key',
        resourceId: keyId,
        payloadJson: JSON.stringify({
          name: existing.name,
          prefix: existing.prefix,
        }),
      },
    });

    return NextResponse.json({ success: true });
  });
}
