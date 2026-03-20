import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { recordAdminAudit } from '@/lib/admin/audit';
import {
  getFlaggedRedemptions,
  updateFraudStatus,
  getRiskDistribution,
} from '@/lib/fraud-detection';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/fraud — list flagged redemptions with risk scores
 */
export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission('admin.moderation.read');

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);
    const minScore = parseInt(searchParams.get('minScore') ?? '30', 10);
    const status = searchParams.get('status') ?? undefined;

    const { items, total } = await getFlaggedRedemptions({
      page,
      limit,
      minScore,
      status,
    });

    const distribution = getRiskDistribution(items);

    const falsePositives = items.filter((i) => i.fraudStatus === 'false_positive').length;
    const confirmed = items.filter((i) => i.fraudStatus === 'confirmed').length;
    const reviewed = falsePositives + confirmed;
    const falsePositiveRate = reviewed > 0 ? Math.round((falsePositives / reviewed) * 100) : 0;

    return NextResponse.json({
      items,
      total,
      distribution,
      stats: {
        falsePositiveRate,
        totalFlagged: total,
        confirmed,
        falsePositives,
        pending: items.filter((i) => i.fraudStatus === 'pending').length,
      },
    });
  });
}

/**
 * POST /api/admin/fraud — update fraud status (confirmed/false-positive)
 */
export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission('admin.moderation.action');

    const body = await req.json();
    const { redemptionId, status } = body;

    if (!redemptionId || !['confirmed', 'false_positive'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid request. Provide redemptionId and status (confirmed/false_positive).' },
        { status: 400 }
      );
    }

    await updateFraudStatus(redemptionId, status, admin.userId);

    await recordAdminAudit({
      actorUserId: admin.userId,
      action: 'fraud.status_update',
      targetType: 'redemption',
      targetId: redemptionId,
      metadata: { status },
    });

    return NextResponse.json({ success: true, redemptionId, status });
  });
}
