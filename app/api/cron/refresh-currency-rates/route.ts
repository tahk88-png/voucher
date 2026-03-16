import { NextRequest, NextResponse } from 'next/server';
import { refreshRates } from '@/lib/currency';
import { withErrorHandler } from '@/lib/error-handler';

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    // Optionally verify cron secret
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
