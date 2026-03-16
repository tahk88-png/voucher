/**
 * Geolocation utilities — haversine distance, nearby merchant search, IP-based fallback
 */

const EARTH_RADIUS_KM = 6371;

/** Convert degrees to radians */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate the Haversine distance between two lat/lon points in kilometers.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export interface NearbyMerchant {
  id: string;
  name: string;
  slug: string;
  brandLogoUrl: string | null;
  city: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  distance: number; // km
  activeVoucherCount: number;
}

/**
 * Find merchants within `radiusKm` of (lat, lon) that have active vouchers.
 * Returns results sorted by distance ascending.
 */
export async function findNearbyMerchants(
  lat: number,
  lon: number,
  radiusKm: number,
  prisma: import('@prisma/client').PrismaClient
): Promise<NearbyMerchant[]> {
  // Fetch all merchants that have coordinates set and are active
  const merchants = await prisma.merchant.findMany({
    where: {
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      brandLogoUrl: true,
      city: true,
      address: true,
      latitude: true,
      longitude: true,
      vouchers: {
        where: {
          status: 'published',
          validFrom: { lte: new Date() },
          validTo: { gte: new Date() },
        },
        select: { id: true },
      },
    },
  });

  const results: NearbyMerchant[] = [];

  for (const m of merchants) {
    if (m.latitude === null || m.longitude === null) continue;
    const distance = haversineDistance(lat, lon, m.latitude, m.longitude);
    if (distance <= radiusKm) {
      results.push({
        id: m.id,
        name: m.name,
        slug: m.slug,
        brandLogoUrl: m.brandLogoUrl,
        city: m.city,
        address: m.address,
        latitude: m.latitude,
        longitude: m.longitude,
        distance: Math.round(distance * 100) / 100,
        activeVoucherCount: m.vouchers.length,
      });
    }
  }

  // Sort by distance ascending
  results.sort((a, b) => a.distance - b.distance);

  return results;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

/**
 * Attempt to get location from IP address using a free geolocation API.
 * Falls back to a default location (Tallinn, Estonia) if unavailable.
 */
export async function getUserLocationFromIP(
  ipAddress?: string
): Promise<GeoLocation> {
  const DEFAULT_LOCATION: GeoLocation = {
    latitude: 59.437,
    longitude: 24.7536,
    city: 'Tallinn',
    country: 'EE',
  };

  try {
    const url = ipAddress
      ? `http://ip-api.com/json/${ipAddress}?fields=lat,lon,city,countryCode`
      : `http://ip-api.com/json/?fields=lat,lon,city,countryCode`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return DEFAULT_LOCATION;

    const data = await res.json();
    if (data.lat && data.lon) {
      return {
        latitude: data.lat,
        longitude: data.lon,
        city: data.city,
        country: data.countryCode,
      };
    }
    return DEFAULT_LOCATION;
  } catch {
    return DEFAULT_LOCATION;
  }
}
