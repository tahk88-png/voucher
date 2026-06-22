import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';

export async function GET(req: NextRequest, { params }: { params: Promise<{slug: string}> }) {
  return withErrorHandler(async () => {
  const { slug } = await params
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { merchantId: merchant.id },
      include: {
        _count: { select: { deliveries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(endpoints);
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{slug: string}> }) {
  return withErrorHandler(async () => {
  const { slug } = await params
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');
    const webhookSchema = z.object({
      url: z.string().url().refine((u) => {
        try {
          const parsed = new URL(u);
          const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '169.254.'];
          if (blocked.some((b) => parsed.hostname.includes(b))) return false;
          if (parsed.hostname.startsWith('192.168.') || parsed.hostname.startsWith('10.') || parsed.hostname.startsWith('172.')) return false;
          if (parsed.protocol !== 'https:') return false;
          return true;
        } catch { return false; }
      }, 'Webhook URL must be a public HTTPS endpoint'),
      events: z.array(z.string().min(1)).min(1),
    });
    const body = await req.json();
    const parsed = webhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { url, events } = parsed.data;

    const secret = crypto.randomBytes(32).toString('hex');

    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        merchantId: merchant.id,
        url,
        secret,
        events,
      },
    });

    return NextResponse.json({ ...endpoint, secret });
  });
}
