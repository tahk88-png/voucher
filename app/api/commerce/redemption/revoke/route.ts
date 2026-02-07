import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifySignature } from '@/lib/commerce-webhook';
import { checkIPRateLimit } from '@/lib/fraud';
import { getClientIp } from '@/lib/request';

const revokeSchema = z.object({
  orderReference: z.string(),
  reason: z.string(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = await checkIPRateLimit(ip, 60, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const rawBody = await req.text();
  const secret = process.env.COMMERCE_WEBHOOK_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'COMMERCE_WEBHOOK_SECRET not configured' }, { status: 503 });
  }
  if (secret) {
    const signature = req.headers.get('x-vouchr-signature');
    if (!signature || !verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let data: z.infer<typeof revokeSchema>;
  try {
    data = revokeSchema.parse(JSON.parse(rawBody));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const redemption = await prisma.redemption.findFirst({
    where: { orderReference: data.orderReference },
  });

  if (!redemption) {
    return NextResponse.json({ ok: true });
  }

  await prisma.$transaction(async (tx) => {
    await tx.creditLedger.updateMany({
      where: {
        source: 'referral_redemption',
        sourceId: redemption.id,
        status: { in: ['locked', 'available'] },
      },
      data: { status: 'reversed' },
    });

    await tx.redemption.update({
      where: { id: redemption.id },
      data: { confirmedAt: null },
    });
  });

  return NextResponse.json({ ok: true });
}
