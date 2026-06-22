import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/admin/guards';
import { recordAdminAudit } from '@/lib/admin/audit';
import { withErrorHandler } from '@/lib/error-handler';

export async function GET(_req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.billing.read');

    const rates = await prisma.vatRate.findMany({
      orderBy: [{ countryCode: 'asc' }, { rateType: 'asc' }, { effectiveFrom: 'desc' }],
    });

    return NextResponse.json({ rates });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission('admin.system.manage');

    const body = await req.json();
    const { countryCode, rate, rateType, effectiveFrom, effectiveUntil, isActive } = body;

    if (!countryCode || rate == null || !rateType || !effectiveFrom) {
      return NextResponse.json(
        { error: 'countryCode, rate, rateType, and effectiveFrom are required' },
        { status: 400 }
      );
    }

    const validRateTypes = ['standard', 'reduced', 'super_reduced', 'zero'];
    if (!validRateTypes.includes(rateType)) {
      return NextResponse.json(
        { error: `rateType must be one of: ${validRateTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (typeof rate !== 'number' || rate < 0 || rate > 100) {
      return NextResponse.json(
        { error: 'rate must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    const code = countryCode.toUpperCase();

    // Upsert on matching effective period
    const existing = await prisma.vatRate.findFirst({
      where: { countryCode: code, rateType, effectiveFrom: new Date(effectiveFrom) },
    });

    if (existing) {
      const updated = await prisma.vatRate.update({
        where: { id: existing.id },
        data: {
          rate,
          effectiveUntil: effectiveUntil ? new Date(effectiveUntil) : null,
          isActive: isActive ?? true,
        },
      });
      await recordAdminAudit({
        actorUserId: admin.userId,
        action: 'vat_rate.update',
        targetType: 'VatRate',
        targetId: updated.id,
      });
      return NextResponse.json({ rate: updated });
    }

    const created = await prisma.vatRate.create({
      data: {
        countryCode: code,
        rate,
        rateType,
        effectiveFrom: new Date(effectiveFrom),
        effectiveUntil: effectiveUntil ? new Date(effectiveUntil) : null,
        isActive: isActive ?? true,
      },
    });

    await recordAdminAudit({
      actorUserId: admin.userId,
      action: 'vat_rate.create',
      targetType: 'VatRate',
      targetId: created.id,
    });

    return NextResponse.json({ rate: created }, { status: 201 });
  });
}
