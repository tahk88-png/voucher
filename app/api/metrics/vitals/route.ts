import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Web Vitals beacon receiver.
 * Accepts POST from client-side web-vitals reporting.
 * No auth required (client-side), but rate-limited by size.
 */
export async function POST(req: NextRequest) {
  try {
    const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
    if (contentLength > 2048) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const body = await req.json();
    const { name, value, rating, url } = body;

    if (!name || typeof value !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    logger.info('Web vital reported', {
      metric: name,
      value: Math.round(value * 100) / 100,
      rating,
      url,
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
