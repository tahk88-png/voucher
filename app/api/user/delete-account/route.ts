import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withErrorHandler } from '@/lib/error-handler';
import { hasActiveLegalHold } from '@/lib/admin/legal-hold';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check for active legal holds — prevent deletion if any exist
    const legalHold = await hasActiveLegalHold(userId);
    if (legalHold) {
      return NextResponse.json(
        {
          error: 'Account deletion is temporarily unavailable. Please contact support.',
          code: 'LEGAL_HOLD_ACTIVE',
        },
        { status: 403 },
      );
    }

    // Anonymize user data instead of hard-deleting to preserve merchant statistics
    await prisma.$transaction(async (tx) => {
      // Delete related data that is user-private
      await tx.pushSubscription.deleteMany({ where: { userId } });
      await tx.notificationSubscription.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.verificationToken.deleteMany({ where: { email: session.user!.email! } });

      // Anonymize the user record
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@removed.local`,
          name: 'Deleted User',
          image: null,
          passwordHash: null,
          emailVerified: null,
          status: 'disabled',
        },
      });

      // Log the deletion in audit
      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: 'account_deleted',
          payloadJson: { reason: 'user_requested', gdpr: true },
        },
      });
    });

    return NextResponse.json({ deleted: true });
  });
}
