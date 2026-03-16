import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';
import { sendWebhook } from '@/lib/webhooks';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  return withErrorHandler(async () => {
    const { slug, id } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id, merchantId: merchant.id },
    });
    if (!endpoint) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const testPayload = {
      test: true,
      merchantId: merchant.id,
      merchantSlug: merchant.slug,
      message: 'This is a test webhook delivery',
      timestamp: new Date().toISOString(),
    };

    try {
      const { status, text } = await sendWebhook(
        endpoint.url,
        'test.ping',
        testPayload,
        endpoint.secret
      );

      await prisma.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          event: 'test.ping',
          payload: testPayload,
          statusCode: status,
          response: text,
          attempts: 1,
        },
      });

      return NextResponse.json({
        success: status >= 200 && status < 300,
        statusCode: status,
        response: text,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await prisma.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          event: 'test.ping',
          payload: testPayload,
          response: errorMessage,
          attempts: 1,
        },
      });

      return NextResponse.json({
        success: false,
        error: errorMessage,
      });
    }
  });
}
