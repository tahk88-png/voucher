import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint, p256dh, auth: authKey } = await req.json();
    if (!endpoint || !p256dh || !authKey) {
      return NextResponse.json({ error: 'Missing subscription data' }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: { userId: session.user.id, endpoint },
      },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh,
        auth: authKey,
      },
      update: {
        p256dh,
        auth: authKey,
      },
    });

    return NextResponse.json({ success: true });
  });
}

export async function DELETE(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint } = await req.json();
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({
      where: { userId: session.user.id, endpoint },
    });

    return NextResponse.json({ success: true });
  });
}
