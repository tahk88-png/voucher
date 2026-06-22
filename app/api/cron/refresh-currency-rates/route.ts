import { NextRequest, NextResponse } from 'next/server';
import { refreshRates } from '@/lib/currency';
import { withErrorHandler } from '@/lib/error-handler';

// GET is required for Vercel cron invocation. POST is kept for
// manual/external triggers (e.g. admin panel "Refresh now" button).
export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}

async function handler(req: NextRequest) {
  return withErrorHandler(async () => {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await refreshRates();

    return NextResponse.json({
      success: true,
      ratesUpdated: count,
      timestamp: new Date().toISOString(),
    });
  });
}
