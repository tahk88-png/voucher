import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// SSE endpoint – sends real-time notification updates to the client.
// Streams: { type: 'count', unread: number } every 30s + immediate on connect.
// Also sends { type: 'ping' } heartbeat every 15s to keep the connection alive.

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;

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

      // Send initial unread count immediately
      async function sendCount() {
        if (closed) return;
        try {
          const unread = await prisma.notification.count({
            where: { userId, readAt: null },
          });
          send({ type: 'count', unread });
        } catch {
          // DB error — just skip
        }
      }

      sendCount();

      // Heartbeat every 15s
      const heartbeat = setInterval(() => {
        send({ type: 'ping' });
      }, 15_000);

      // Refresh count every 30s
      const poll = setInterval(() => {
        sendCount();
      }, 30_000);

      // Cleanup when client disconnects
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
