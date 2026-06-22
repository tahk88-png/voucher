import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/admin/guards';
import { recordAdminAudit } from '@/lib/admin/audit';
import { withErrorHandler } from '@/lib/error-handler';

export async function GET(_req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.billing.read');

    const exemptions = await prisma.vatExemption.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        merchant: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ exemptions });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission('admin.system.manage');

    const body = await req.json();
    const { merchantId, countryCode, exemptionType, documentReference, expiresAt } = body;

    if (!merchantId || !countryCode || !exemptionType) {
      return NextResponse.json(
        { error: 'merchantId, countryCode, and exemptionType are required' },
        { status: 400 }
      );
    }

    const validTypes = ['b2b', 'export', 'charity', 'public_body'];
    if (!validTypes.includes(exemptionType)) {
      return NextResponse.json(
        { error: `exemptionType must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const code = countryCode.toUpperCase();

    const existing = await prisma.vatExemption.findFirst({
      where: { merchantId, countryCode: code, exemptionType },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'An exemption with this merchant, country, and type already exists' },
        { status: 409 }
      );
    }

    const exemption = await prisma.vatExemption.create({
      data: {
        merchantId,
        countryCode: code,
        exemptionType,
        documentReference: documentReference ?? null,
        approvedAt: new Date(),
        approvedBy: admin.userId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        merchant: { select: { id: true, name: true, slug: true } },
      },
    });

    await recordAdminAudit({
      actorUserId: admin.userId,
      action: 'vat_exemption.create',
      targetType: 'VatExemption',
      targetId: exemption.id,
    });

    return NextResponse.json({ exemption }, { status: 201 });
  });
}
