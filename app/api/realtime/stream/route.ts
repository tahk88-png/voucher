import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getRealtimeStream, type RealtimeChannel } from '@/lib/realtime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VALID_CHANNELS = new Set<RealtimeChannel>([
  'metrics',
  'activity',
  'alerts',
  'system_health',
]);

/**
 * GET /api/realtime/stream?channels=metrics,activity,alerts
 *
 * Server-Sent Events endpoint that streams real-time platform events.
 * Requires authentication. Subscribe to specific channels via query param.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Parse requested channels (default: all)
  const channelsParam = req.nextUrl.searchParams.get('channels');
  let channels: RealtimeChannel[];

  if (channelsParam) {
    channels = channelsParam
      .split(',')
      .map((c) => c.trim() as RealtimeChannel)
      .filter((c) => VALID_CHANNELS.has(c));

    if (channels.length === 0) {
      return new Response('Invalid channels parameter', { status: 400 });
    }
  } else {
    channels = Array.from(VALID_CHANNELS);
  }

  const stream = getRealtimeStream(channels, req.signal);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
