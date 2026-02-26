import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';

/**
 * Health check endpoint
 * GET /api/health
 * 
 * Returns:
 * - status: "ok" if healthy, "error" if unhealthy
 * - database: "connected" | "disconnected"
 * - timestamp: ISO timestamp
 */
export async function GET() {
  const timestamp = new Date().toISOString();

  return withErrorHandler(async () => {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp,
    }, { status: 200 });
  });
}