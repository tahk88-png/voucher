import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { getAllCircuitStatuses } from '@/lib/circuit-breaker';

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

    const circuits = getAllCircuitStatuses();
    const openCircuits = circuits.filter(c => c.state === 'open');

    return NextResponse.json({
      status: openCircuits.length > 0 ? 'degraded' : 'ok',
      database: 'connected',
      circuits: circuits.map(c => ({ name: c.name, state: c.state, failures: c.failures })),
      timestamp,
    }, { status: 200 });
  });
}