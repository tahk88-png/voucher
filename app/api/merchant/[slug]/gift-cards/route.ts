import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { requireActiveMerchant } from '@/lib/merchant-status';
import { captureException } from '@/lib/error-tracking';
import { generateGiftCardCode, normalizeGiftCardCode } from '@/lib/gift-cards';
import { z } from 'zod';

const createGiftCardSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().min(3).max(3),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime().optional().nullable(),
  message: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  designJson: z.record(z.any()).optional(),
  codePrefix: z.string().max(12).optional(),
});

async function createGiftCardWithUniqueCode(data: {
  merchantId: string;
  amount: number;
  currency: string;
  validFrom: Date;
  validTo: Date | null;
  message: string | null;
  imageUrl: string | null;
  logoUrl: string | null;
  designJson?: Prisma.InputJsonValue;
  codePrefix?: string;
}) {
  const attempts = 5;
  for (let i = 0; i < attempts; i += 1) {
    const code = normalizeGiftCardCode(generateGiftCardCode(data.codePrefix));
    try {
      return await prisma.giftCard.create({
        data: {
          merchantId: data.merchantId,
          code,
          amount: data.amount,
          currency: data.currency,
          validFrom: data.validFrom,
          validTo: data.validTo,
          message: data.message,
          imageUrl: data.imageUrl,
          logoUrl: data.logoUrl,
          designJson: data.designJson,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        continue;
      }
      throw error;
    }
  }
  throw new Error('Failed to generate a unique gift card code');
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug: params.slug },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    await requireActiveMerchant(merchant.id);
    await requireMerchantRole(session.user.id, merchant.id, 'merchant_admin');

    const body = await req.json();
    const data = createGiftCardSchema.parse(body);

    const giftCard = await createGiftCardWithUniqueCode({
      merchantId: merchant.id,
      amount: data.amount,
      currency: data.currency.toUpperCase(),
      validFrom: new Date(data.validFrom),
      validTo: data.validTo ? new Date(data.validTo) : null,
      message: data.message ?? null,
      imageUrl: data.imageUrl ?? null,
      logoUrl: data.logoUrl ?? null,
      designJson: data.designJson ? (data.designJson as Prisma.InputJsonValue) : undefined,
      codePrefix: data.codePrefix,
    });

    return NextResponse.json(giftCard);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error) {
      captureException(error, {
        context: 'gift_card_creation',
        merchantSlug: params.slug,
      });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug: params.slug },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

    const giftCards = await prisma.giftCard.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(giftCards);
  } catch (error) {
    if (error instanceof Error) {
      captureException(error, {
        context: 'gift_card_fetch',
        merchantSlug: params.slug,
      });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
