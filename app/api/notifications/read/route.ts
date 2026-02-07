import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const readSchema = z.object({
  ids: z.array(z.string()).optional(),
  markAll: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const data = readSchema.parse(body);

  if (data.markAll) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  if (!data.ids || data.ids.length === 0) {
    return NextResponse.json({ error: 'No notification ids provided' }, { status: 400 });
  }

  await prisma.notification.updateMany({
    where: {
      id: { in: data.ids },
      userId: session.user.id,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
