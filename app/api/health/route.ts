import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      timestamp,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 });
  }
}