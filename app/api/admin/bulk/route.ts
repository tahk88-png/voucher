import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { recordAdminAudit } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

type BulkAction = 'ban' | 'suspend' | 'approve' | 'delete';
type TargetType = 'user' | 'merchant' | 'review';

const VALID_ACTIONS: BulkAction[] = ['ban', 'suspend', 'approve', 'delete'];
const VALID_TARGETS: TargetType[] = ['user', 'merchant', 'review'];

/**
 * POST /api/admin/bulk — execute bulk admin actions with audit logging
 */
export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission('admin.moderation.write');

    const body = await req.json();
    const { action, targetType, ids, reason } = body as {
      action: BulkAction;
      targetType: TargetType;
      ids: string[];
      reason?: string;
    };

    // Validation
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!VALID_TARGETS.includes(targetType)) {
      return NextResponse.json(
        { error: `Invalid target type. Must be one of: ${VALID_TARGETS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (ids.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 items per bulk action' },
        { status: 400 }
      );
    }

    // Reason is required for destructive actions
    const destructiveActions: BulkAction[] = ['ban', 'suspend', 'delete'];
    if (destructiveActions.includes(action) && !reason) {
      return NextResponse.json(
        { error: 'Reason is required for destructive actions (ban, suspend, delete)' },
        { status: 400 }
      );
    }

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    // Execute based on target type and action
    for (const id of ids) {
      try {
        if (targetType === 'user') {
          await handleUserAction(id, action);
        } else if (targetType === 'merchant') {
          await handleMerchantAction(id, action);
        } else if (targetType === 'review') {
          await handleReviewAction(id, action);
        }

        // Audit log for each action
        await recordAdminAudit({
          actorUserId: admin.userId,
          action: `bulk.${targetType}.${action}`,
          targetType,
          targetId: id,
          reason: reason ?? undefined,
          metadata: { bulkAction: true, totalInBatch: ids.length },
        });

        results.push({ id, success: true });
      } catch (err) {
        results.push({
          id,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      summary: { total: ids.length, succeeded, failed },
      results,
    });
  });
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

async function handleUserAction(userId: string, action: BulkAction) {
  switch (action) {
    case 'ban':
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'disabled' },
      });
      break;
    case 'suspend':
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'suspended' },
      });
      break;
    case 'approve':
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'active' },
      });
      break;
    case 'delete':
      // Soft-delete: set status and anonymize
      await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'deleted',
          email: `deleted_${userId}@deleted.local`,
          name: 'Deleted User',
        },
      });
      break;
  }
}

async function handleMerchantAction(merchantId: string, action: BulkAction) {
  switch (action) {
    case 'ban':
    case 'suspend':
      await prisma.merchant.update({
        where: { id: merchantId },
        data: { status: 'inactive' },
      });
      break;
    case 'approve':
      await prisma.merchant.update({
        where: { id: merchantId },
        data: { status: 'active' },
      });
      break;
    case 'delete':
      await prisma.merchant.update({
        where: { id: merchantId },
        data: { status: 'inactive' },
      });
      break;
  }
}

async function handleReviewAction(reportId: string, action: BulkAction) {
  switch (action) {
    case 'approve':
      await prisma.moderationAction.update({
        where: { id: reportId },
        data: { status: 'resolved' },
      });
      break;
    case 'delete':
    case 'ban':
      await prisma.moderationAction.update({
        where: { id: reportId },
        data: { status: 'dismissed' },
      });
      break;
    case 'suspend':
      await prisma.moderationAction.update({
        where: { id: reportId },
        data: { status: 'under_review' },
      });
      break;
  }
}
