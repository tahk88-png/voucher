import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

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
