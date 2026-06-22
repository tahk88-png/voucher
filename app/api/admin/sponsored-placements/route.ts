import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/admin/guards';
import { recordAdminAudit } from '@/lib/admin/audit';
import { withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.merchants.read');

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
    const status = searchParams.get('status'); // active | inactive | all

    const now = new Date();
    const where: Record<string, unknown> = {};
    if (status === 'active') {
      where.isActive = true;
      where.startAt = { lte: now };
      where.endAt = { gte: now };
    } else if (status === 'inactive') {
      where.OR = [{ isActive: false }, { endAt: { lt: now } }];
    }

    const [placements, total] = await Promise.all([
      prisma.sponsoredGiftPlacement.findMany({
        where,
        include: { merchant: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sponsoredGiftPlacement.count({ where }),
    ]);

    const enriched = placements.map((p) => {
      const ctr = p.impressionCount > 0 ? (p.clickCount / p.impressionCount) * 100 : 0;
      const spendRate = p.budgetCents > 0 ? (p.spentCents / p.budgetCents) * 100 : 0;
      const isLive = p.isActive && p.startAt <= now && p.endAt >= now;
      return { ...p, ctr: Math.round(ctr * 100) / 100, spendRate: Math.round(spendRate * 100) / 100, isLive };
    });

    return NextResponse.json({
      placements: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission('admin.merchants.edit');

    const body = await req.json();
    const {
      sponsorName,
      merchantId,
      targetCategories,
      targetOccasions,
      budgetCents,
      priority,
      startAt,
      endAt,
      clickLimit,
      impressionsLimit,
    } = body;

    if (!sponsorName?.trim()) {
      return NextResponse.json({ error: 'sponsorName is required' }, { status: 400 });
    }
    if (!budgetCents || budgetCents <= 0) {
      return NextResponse.json({ error: 'budgetCents must be positive' }, { status: 400 });
    }
    if (!startAt || !endAt) {
      return NextResponse.json({ error: 'startAt and endAt are required' }, { status: 400 });
    }

    const start = new Date(startAt);
    const end = new Date(endAt);
    if (end <= start) {
      return NextResponse.json({ error: 'endAt must be after startAt' }, { status: 400 });
    }

    const placement = await prisma.sponsoredGiftPlacement.create({
      data: {
        sponsorName: sponsorName.trim(),
        merchantId: merchantId || undefined,
        targetCategories: targetCategories ?? [],
        targetOccasions: targetOccasions ?? [],
        budgetCents,
        priority: priority ?? 0,
        startAt: start,
        endAt: end,
        clickLimit: clickLimit ?? undefined,
        impressionsLimit: impressionsLimit ?? undefined,
      },
      include: { merchant: { select: { id: true, name: true, slug: true } } },
    });

    await recordAdminAudit({
      actorUserId: admin.userId,
      action: 'sponsored_placement.create',
      targetType: 'SponsoredGiftPlacement',
      targetId: placement.id,
    });

    return NextResponse.json({ placement }, { status: 201 });
  });
}
