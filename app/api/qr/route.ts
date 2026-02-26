import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { withErrorHandler } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const dataUrl = await QRCode.toDataURL(text, { margin: 1, width: 240 });
    return NextResponse.json({ dataUrl });
  });
}
