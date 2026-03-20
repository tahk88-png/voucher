import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Merchant SSE — streams live redemption stats to the merchant dashboard.
// Sends { type: 'stats', today: N, pending: N } on connect + every 30s.
// Sends { type: 'ping' } heartbeat every 15s.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verify merchant access
  const merchant = await prisma.merchant.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!merchant) {
    return new Response('Not Found', { status: 404 });
  }

  const memberCheck = await prisma.merchantMember.findUnique({
    where: {
      merchantId_userId: { merchantId: merchant.id, userId: session.user.id },
    },
    select: { role: true },
  });
  if (!memberCheck) {
    return new Response('Forbidden', { status: 403 });
  }

  const merchantId = merchant.id;

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      function send(data: object) {
        if (closed) return;
        try {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        } catch {
          closed = true;
        }
      }

      async function sendStats() {
        if (closed) return;
        try {
          const dayStart = startOfDay(new Date());
          const [today, pending] = await Promise.all([
            prisma.redemption.count({
              where: { merchantId, createdAt: { gte: dayStart } },
            }),
            prisma.redemption.count({
              where: { merchantId, confirmedAt: null },
            }),
          ]);
          send({ type: 'stats', today, pending });
        } catch {
          // DB error — skip silently
        }
      }

      // Immediate snapshot on connect
      sendStats();

      const heartbeat = setInterval(() => send({ type: 'ping' }), 15_000);
      const poll = setInterval(sendStats, 30_000);

      req.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(heartbeat);
        clearInterval(poll);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
