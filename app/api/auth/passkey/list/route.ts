import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * GET — List user's passkeys (authed)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const passkeys = await prisma.passkey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        credentialId: true,
        deviceType: true,
        backedUp: true,
        transports: true,
        friendlyName: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ passkeys });
  } catch (error) {
    logger.error('Passkey list error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to list passkeys' }, { status: 500 });
  }
}

/**
 * DELETE — Remove a passkey by id (authed)
 */
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const passkeyId = searchParams.get('id');

    if (!passkeyId) {
      return NextResponse.json({ error: 'Missing passkey id' }, { status: 400 });
    }

    // Ensure the passkey belongs to the current user
    const passkey = await prisma.passkey.findFirst({
      where: { id: passkeyId, userId: session.user.id },
    });

    if (!passkey) {
      return NextResponse.json({ error: 'Passkey not found' }, { status: 404 });
    }

    await prisma.passkey.delete({ where: { id: passkeyId } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    logger.error('Passkey delete error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to delete passkey' }, { status: 500 });
  }
}
