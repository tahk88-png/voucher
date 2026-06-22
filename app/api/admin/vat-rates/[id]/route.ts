import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/admin/guards';
import { recordAdminAudit } from '@/lib/admin/audit';
import { withErrorHandler } from '@/lib/error-handler';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission('admin.system.manage');
    const { id } = await params;
    const body = await req.json();
    const { rate, rateType, effectiveFrom, effectiveUntil, isActive } = body;

    const existing = await prisma.vatRate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'VAT rate not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (rate !== undefined) {
      if (typeof rate !== 'number' || rate < 0 || rate > 100) {
        return NextResponse.json({ error: 'rate must be a number between 0 and 100' }, { status: 400 });
      }
      data.rate = rate;
    }
    if (rateType !== undefined) {
      const validRateTypes = ['standard', 'reduced', 'super_reduced', 'zero'];
      if (!validRateTypes.includes(rateType)) {
        return NextResponse.json(
          { error: `rateType must be one of: ${validRateTypes.join(', ')}` },
          { status: 400 }
        );
      }
      data.rateType = rateType;
    }
    if (effectiveFrom !== undefined) data.effectiveFrom = new Date(effectiveFrom);
    if (effectiveUntil !== undefined) data.effectiveUntil = effectiveUntil ? new Date(effectiveUntil) : null;
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await prisma.vatRate.update({ where: { id }, data });

    await recordAdminAudit({
      actorUserId: admin.userId,
      action: 'vat_rate.update',
      targetType: 'VatRate',
      targetId: id,
    });

    return NextResponse.json({ rate: updated });
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission('admin.system.manage');
    const { id } = await params;

    const existing = await prisma.vatRate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'VAT rate not found' }, { status: 404 });
    }

    // Soft-delete: deactivate instead of removing (preserves historical records).
    await prisma.vatRate.update({ where: { id }, data: { isActive: false } });

    await recordAdminAudit({
      actorUserId: admin.userId,
      action: 'vat_rate.deactivate',
      targetType: 'VatRate',
      targetId: id,
    });

    return NextResponse.json({ success: true });
  });
}
