import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

export async function PATCH(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const data = updateProfileSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: data.name },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ user });
  });
}
