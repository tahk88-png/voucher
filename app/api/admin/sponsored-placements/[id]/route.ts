import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/admin/guards';
import { recordAdminAudit } from '@/lib/admin/audit';
import { withErrorHandler } from '@/lib/error-handler';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.merchants.read');
    const { id } = await params;

    const placement = await prisma.sponsoredGiftPlacement.findUnique({
      where: { id },
      include: { merchant: { select: { id: true, name: true, slug: true } } },
    });

    if (!placement) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const now = new Date();
    const ctr = placement.impressionCount > 0
      ? (placement.clickCount / placement.impressionCount) * 100 : 0;
    const spendRate = placement.budgetCents > 0
      ? (placement.spentCents / placement.budgetCents) * 100 : 0;
    const isLive = placement.isActive && placement.startAt <= now && placement.endAt >= now;

    return NextResponse.json({
      placement: {
        ...placement,
        ctr: Math.round(ctr * 100) / 100,
        spendRate: Math.round(spendRate * 100) / 100,
        isLive,
      },
    });
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission('admin.merchants.edit');
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.sponsoredGiftPlacement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // The numeric columns are Int — reject non-integer / negative values up
    // front so a bad payload yields a clean 400 instead of a Prisma P2006
    // 500 (or a silently-truncated float corrupting spend-rate math).
    for (const key of ['budgetCents', 'priority', 'clickLimit', 'impressionsLimit'] as const) {
      const v = body[key];
      if (v !== undefined && v !== null && (typeof v !== 'number' || !Number.isInteger(v) || v < 0)) {
        return NextResponse.json(
          { error: `${key} must be a non-negative integer` },
          { status: 400 }
        );
      }
    }
    if (body.budgetCents !== undefined && body.budgetCents !== null && body.budgetCents <= 0) {
      return NextResponse.json({ error: 'budgetCents must be greater than 0' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (body.sponsorName !== undefined) data.sponsorName = body.sponsorName.trim();
    if (body.merchantId !== undefined) data.merchantId = body.merchantId || null;
    if (body.targetCategories !== undefined) data.targetCategories = body.targetCategories;
    if (body.targetOccasions !== undefined) data.targetOccasions = body.targetOccasions;
    if (body.budgetCents !== undefined) data.budgetCents = body.budgetCents;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.startAt !== undefined) data.startAt = new Date(body.startAt);
    if (body.endAt !== undefined) data.endAt = new Date(body.endAt);
    if (body.clickLimit !== undefined) data.clickLimit = body.clickLimit;
    if (body.impressionsLimit !== undefined) data.impressionsLimit = body.impressionsLimit;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const placement = await prisma.sponsoredGiftPlacement.update({
      where: { id },
      data,
      include: { merchant: { select: { id: true, name: true, slug: true } } },
    });

    await recordAdminAudit({
      actorUserId: admin.userId,
      action: 'sponsored_placement.update',
      targetType: 'SponsoredGiftPlacement',
      targetId: id,
    });

    return NextResponse.json({ placement });
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission('admin.merchants.edit');
    const { id } = await params;

    const existing = await prisma.sponsoredGiftPlacement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Soft-delete: deactivate instead of removing (preserves billing/impression history).
    const placement = await prisma.sponsoredGiftPlacement.update({
      where: { id },
      data: { isActive: false },
    });

    await recordAdminAudit({
      actorUserId: admin.userId,
      action: 'sponsored_placement.deactivate',
      targetType: 'SponsoredGiftPlacement',
      targetId: id,
    });

    return NextResponse.json({ placement, message: 'Placement deactivated' });
  });
}
