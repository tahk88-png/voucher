import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { findNearbyMerchants, getUserLocationFromIP } from '@/lib/geolocation';
import { getClientIp } from '@/lib/get-client-ip';

/**
 * GET /api/nearby?lat=X&lon=Y&radius=10
 *
 * Returns merchants within radius (km) that have active vouchers,
 * sorted by distance. If lat/lon are omitted, uses IP-based geolocation fallback.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    let lat = parseFloat(searchParams.get('lat') || '');
    let lon = parseFloat(searchParams.get('lon') || '');
    const radius = Math.min(
      Math.max(parseFloat(searchParams.get('radius') || '10'), 1),
      50
    );

    // If no coordinates provided, try IP-based geolocation
    if (isNaN(lat) || isNaN(lon)) {
      const ipRaw = getClientIp(req);
      const ip = ipRaw === 'unknown' ? undefined : ipRaw;
      const location = await getUserLocationFromIP(ip);
      lat = location.latitude;
      lon = location.longitude;
    }

    // Validate coordinate range
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates. lat must be -90..90, lon must be -180..180.' },
        { status: 400 }
      );
    }

    const merchants = await findNearbyMerchants(lat, lon, radius, prisma);

    return NextResponse.json({
      merchants,
      meta: {
        lat,
        lon,
        radiusKm: radius,
        total: merchants.length,
      },
    });
  } catch (error) {
    logger.error('[nearby] Error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to fetch nearby merchants' },
      { status: 500 }
    );
  }
}
