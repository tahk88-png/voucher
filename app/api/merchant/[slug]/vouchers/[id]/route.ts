import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { captureException } from '@/lib/error-tracking';
import { dispatchMerchantAnnouncement } from '@/lib/notifications';
import { CacheKeys, invalidatePattern } from '@/lib/cache';
import { z } from 'zod';
import { withErrorHandler } from '@/lib/error-handler';

const updateVoucherSchema = z.object({
  status: z.enum(['draft', 'published', 'paused', 'ended']).optional(),
  type: z.enum(['percentage', 'fixed_amount', 'credit_amount']).optional(),
  value: z.number().int().positive().optional(),
  currency: z.string().optional(),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  usageLimitTotal: z.number().int().positive().nullable().optional(),
  usageLimitPerUser: z.number().int().positive().nullable().optional(),
  weeklyDropEnabled: z.boolean().optional(),
  weeklyDropJson: z.any().optional(),
  conditionsJson: z.any().optional(),
  designJson: z.any().optional(),
  codePrefix: z.string().nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{slug: string; id: string}> }
) {
  return withErrorHandler(async () => {
    const { slug, id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    await requireMerchantRole(session.user.id, merchant.id, 'merchant_admin');

    const voucher = await prisma.voucher.findUnique({
      where: { id },
    });

    if (!voucher || voucher.merchantId !== merchant.id) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }
    const previousStatus = voucher.status;

    const body = await req.json();
    const data = updateVoucherSchema.parse(body);

    // Prepare update data (Prisma.DbNull for clearing Json fields)
    const updateData: {
      status?: string;
      type?: string;
      value?: number;
      currency?: string;
      validFrom?: Date;
      validTo?: Date;
      usageLimitTotal?: number | null;
      usageLimitPerUser?: number | null;
      weeklyDropEnabled?: boolean;
      weeklyDropJson?: string | typeof Prisma.DbNull;
      conditionsJson?: string | typeof Prisma.DbNull;
      designJson?: string | typeof Prisma.DbNull;
      codePrefix?: string | null;
    } = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.validFrom !== undefined) updateData.validFrom = new Date(data.validFrom);
    if (data.validTo !== undefined) updateData.validTo = new Date(data.validTo);
    if (data.usageLimitTotal !== undefined) updateData.usageLimitTotal = data.usageLimitTotal;
    if (data.usageLimitPerUser !== undefined) updateData.usageLimitPerUser = data.usageLimitPerUser;
    if (data.weeklyDropEnabled !== undefined) updateData.weeklyDropEnabled = data.weeklyDropEnabled;
    if (data.weeklyDropJson !== undefined) {
      updateData.weeklyDropJson = data.weeklyDropJson ? JSON.stringify(data.weeklyDropJson) : Prisma.DbNull;
    }
    if (data.conditionsJson !== undefined) {
      updateData.conditionsJson = data.conditionsJson ? JSON.stringify(data.conditionsJson) : Prisma.DbNull;
    }
    if (data.designJson !== undefined) {
      updateData.designJson = data.designJson ? JSON.stringify(data.designJson) : Prisma.DbNull;
    }
    if (data.codePrefix !== undefined) updateData.codePrefix = data.codePrefix;

    const updated = await prisma.voucher.update({
      where: { id },
      data: updateData,
    });

    if (previousStatus !== 'published' && updated.status === 'published') {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const url = `${baseUrl}/v/${updated.id}`;
      await dispatchMerchantAnnouncement({
        merchantId: merchant.id,
        type: 'voucher_published',
        title: `New voucher from ${merchant.name}`,
        body: 'A new voucher is available. Tap to view the offer.',
        url,
      });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        actorUserId: session.user.id,
        action: 'voucher.updated',
        payloadJson: JSON.stringify({ voucherId: id, changes: Object.keys(updateData) }),
      },
    });

    await invalidatePattern(`${CacheKeys.publicMerchantVouchers(merchant.id)}*`);

    return NextResponse.json(updated);
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{slug: string; id: string}> }
) {
  return withErrorHandler(async () => {
    const { slug, id } = await params;
    const session = await auth();
    const merchant = await prisma.merchant.findUnique({
      where: { slug },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const voucher = await prisma.voucher.findUnique({
      where: { id },
    });

    if (!voucher || voucher.merchantId !== merchant.id) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    // Check permissions
    if (voucher.status !== 'published') {
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      try {
        await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');
      } catch {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(voucher);
  });
}
