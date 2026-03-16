import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';
import crypto from 'crypto';

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

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.enum(AVAILABLE_PERMISSIONS)).min(1),
  expiresAt: z.string().datetime().optional(),
});

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function generateApiKey(): string {
  const random = crypto.randomBytes(32).toString('base64url');
  return `mk_${random}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const keys = await prisma.merchantApiKey.findMany({
      where: { merchantId: merchant.id, revoked: false },
      select: {
        id: true,
        name: true,
        prefix: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(keys);
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant, profile } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const body = await req.json();
    const data = createKeySchema.parse(body);

    const rawKey = generateApiKey();
    const prefix = rawKey.slice(0, 11) + '...'; // "mk_a1b2c3d4..."
    const keyHash = hashKey(rawKey);

    const apiKey = await prisma.merchantApiKey.create({
      data: {
        merchantId: merchant.id,
        name: data.name,
        keyHash,
        prefix,
        permissions: data.permissions,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        permissions: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        actorUserId: profile.userId,
        action: 'api_key.created',
        resourceType: 'api_key',
        resourceId: apiKey.id,
        payloadJson: JSON.stringify({
          name: data.name,
          permissions: data.permissions,
        }),
      },
    });

    // Return the full key ONLY on creation
    return NextResponse.json({
      ...apiKey,
      key: rawKey,
    });
  });
}
