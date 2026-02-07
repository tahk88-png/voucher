import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const upsertSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug: params.slug },
  });
  if (!merchant) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
  }

  const subscription = await prisma.notificationSubscription.findUnique({
    where: { userId_merchantId: { userId: session.user.id, merchantId: merchant.id } },
  });

  return NextResponse.json({
    subscription: subscription || {
      emailEnabled: false,
      inAppEnabled: false,
      pushEnabled: false,
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug: params.slug },
  });
  if (!merchant) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
  }

  const body = await req.json();
  const data = upsertSchema.parse(body);

  const subscription = await prisma.notificationSubscription.upsert({
    where: { userId_merchantId: { userId: session.user.id, merchantId: merchant.id } },
    create: {
      userId: session.user.id,
      merchantId: merchant.id,
      emailEnabled: data.emailEnabled ?? true,
      inAppEnabled: data.inAppEnabled ?? true,
      pushEnabled: data.pushEnabled ?? false,
    },
    update: {
      ...(data.emailEnabled !== undefined ? { emailEnabled: data.emailEnabled } : {}),
      ...(data.inAppEnabled !== undefined ? { inAppEnabled: data.inAppEnabled } : {}),
      ...(data.pushEnabled !== undefined ? { pushEnabled: data.pushEnabled } : {}),
    },
  });

  return NextResponse.json({ subscription });
}
