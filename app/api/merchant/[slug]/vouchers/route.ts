import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { requireActiveMerchant } from '@/lib/merchant-status';
import { captureException } from '@/lib/error-tracking';
import { z } from 'zod';

const createVoucherSchema = z.object({
  type: z.enum(['percentage', 'fixed_amount', 'credit_amount']),
  value: z.number().int().positive(),
  currency: z.string(),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
  usageLimitTotal: z.number().int().positive().optional(),
  usageLimitPerUser: z.number().int().positive().optional(),
  weeklyDropEnabled: z.boolean().default(false),
  weeklyDropJson: z.any().optional(),
  conditionsJson: z.any().optional(),
  designJson: z.any().optional(),
  codePrefix: z.string().optional(),
});

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
    const data = createVoucherSchema.parse(body);

    const voucher = await prisma.voucher.create({
      data: {
        merchantId: merchant.id,
        status: 'draft',
        ...data,
        validFrom: new Date(data.validFrom),
        validTo: new Date(data.validTo),
        weeklyDropJson: data.weeklyDropJson ? JSON.stringify(data.weeklyDropJson) : Prisma.DbNull,
        conditionsJson: data.conditionsJson ? JSON.stringify(data.conditionsJson) : Prisma.DbNull,
        designJson: data.designJson ? JSON.stringify(data.designJson) : Prisma.DbNull,
      },
    });

    return NextResponse.json(voucher);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error) {
      captureException(error, { 
        context: 'voucher_creation',
        merchantSlug: params.slug 
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
    const merchant = await prisma.merchant.findUnique({
      where: { slug: params.slug },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // If authenticated and has merchant role, show all vouchers
    // Otherwise, show only published vouchers
    const where: {
      merchantId: string;
      status?: string;
    } = { merchantId: merchant.id };
    if (!session?.user?.id) {
      where.status = 'published';
    } else {
      try {
        await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');
      } catch {
        where.status = 'published';
      }
    }

    const vouchers = await prisma.voucher.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(vouchers);
  } catch (error) {
    if (error instanceof Error) {
      captureException(error, { 
        context: 'voucher_fetch',
        merchantSlug: params.slug 
      });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
