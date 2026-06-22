import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getChatHistory, processMessage, createSession } from '@/lib/chat-service';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    const body = await req.json();
    const { message, sessionId: providedSessionId } = body as {
      message?: string;
      sessionId?: string;
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 });
    }

    const sessionId = providedSessionId || createSession();

    const response = await processMessage(sessionId, userId, message.trim());

    return NextResponse.json({
      sessionId,
      message: response,
    });
  } catch (error) {
    logger.error('[Chat API] Error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId query parameter is required' }, { status: 400 });
    }

    const messages = await getChatHistory(sessionId);

    return NextResponse.json({ sessionId, messages });
  } catch (error) {
    logger.error('[Chat API] Error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
