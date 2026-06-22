/**
 * Fraud detection engine for voucher redemptions.
 *
 * Analyzes redemption patterns to calculate risk scores and flag suspicious activity.
 */

import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FraudFlag =
  | 'high_velocity'
  | 'geo_anomaly'
  | 'device_duplicate'
  | 'unusual_time'
  | 'rapid_succession'
  | 'multiple_users_same_device'
  | 'new_account_high_value';

export type FraudRecommendation = 'allow' | 'review' | 'block';

export interface RedemptionData {
  userId: string;
  merchantId: string;
  voucherId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  country?: string;
  timestamp?: Date;
  amount?: number;
}

export interface FraudResult {
  score: number; // 0-100
  flags: FraudFlag[];
  recommendation: FraudRecommendation;
  details: Record<string, unknown>;
}

export interface FraudConfig {
  velocityThreshold: number;        // max redemptions per hour
  velocityWindow: number;            // window in ms (default 1 hour)
  blockThreshold: number;            // score >= this → block
  reviewThreshold: number;           // score >= this → review
  unusualHourStart: number;          // e.g. 2 (2 AM)
  unusualHourEnd: number;            // e.g. 5 (5 AM)
}

const DEFAULT_CONFIG: FraudConfig = {
  velocityThreshold: 5,
  velocityWindow: 60 * 60 * 1000,    // 1 hour
  blockThreshold: 75,
  reviewThreshold: 40,
  unusualHourStart: 2,
  unusualHourEnd: 5,
};

// ---------------------------------------------------------------------------
// Risk score calculation
// ---------------------------------------------------------------------------

export async function calculateRiskScore(
  data: RedemptionData,
  config: Partial<FraudConfig> = {}
): Promise<FraudResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const flags: FraudFlag[] = [];
  const details: Record<string, unknown> = {};
  let score = 0;
  const now = data.timestamp ?? new Date();

  // ---- 1. Velocity check (>N redemptions/hour) ----------------------------
  const windowStart = new Date(now.getTime() - cfg.velocityWindow);
  const recentCount = await prisma.redemption.count({
    where: {
      redeemedByUserId: data.userId,
      createdAt: { gte: windowStart },
    },
  });

  if (recentCount >= cfg.velocityThreshold) {
    flags.push('high_velocity');
    score += 30;
    details.velocityCount = recentCount;
    details.velocityWindow = cfg.velocityWindow;
  }

  // Check rapid succession (multiple redemptions within 60 seconds)
  const rapidWindow = new Date(now.getTime() - 60_000);
  const rapidCount = await prisma.redemption.count({
    where: {
      redeemedByUserId: data.userId,
      createdAt: { gte: rapidWindow },
    },
  });

  if (rapidCount >= 3) {
    flags.push('rapid_succession');
    score += 20;
    details.rapidCount = rapidCount;
  }

  // ---- 2. Geolocation anomaly (different country than usual) ---------------
  if (data.country) {
    const previousRedemptions = await prisma.redemption.findMany({
      where: {
        redeemedByUserId: data.userId,
        location: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { location: true },
    });

    const previousCountries = previousRedemptions
      .map((r) => r.location)
      .filter(Boolean) as string[];

    if (previousCountries.length >= 3) {
      const countrySet = new Set(previousCountries);
      if (!countrySet.has(data.country)) {
        flags.push('geo_anomaly');
        score += 25;
        details.expectedCountries = [...countrySet];
        details.actualCountry = data.country;
      }
    }
  }

  // ---- 3. Device fingerprint duplicates (same device, different users) -----
  if (data.deviceFingerprint) {
    const otherUsersWithDevice = await prisma.redemption.findMany({
      where: {
        orderReference: data.deviceFingerprint,
        redeemedByUserId: { not: data.userId },
      },
      select: { redeemedByUserId: true },
      distinct: ['redeemedByUserId'],
      take: 10,
    });

    if (otherUsersWithDevice.length > 0) {
      flags.push('device_duplicate');
      flags.push('multiple_users_same_device');
      score += 20;
      details.duplicateDeviceUsers = otherUsersWithDevice.length;
    }
  }

  // ---- 4. Unusual time patterns (late night / early morning) ---------------
  const hour = now.getHours();
  if (hour >= cfg.unusualHourStart && hour < cfg.unusualHourEnd) {
    // Check if user normally transacts at this hour
    const normalHourRedemptions = await prisma.redemption.count({
      where: {
        redeemedByUserId: data.userId,
        createdAt: {
          gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days
        },
      },
    });

    // If there are previous redemptions but none at this hour range, flag it
    if (normalHourRedemptions > 5) {
      flags.push('unusual_time');
      score += 10;
      details.redemptionHour = hour;
    }
  }

  // ---- 5. New account + high value ----------------------------------------
  if (data.amount && data.amount > 5000) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { createdAt: true },
    });

    if (user) {
      const accountAgeMs = now.getTime() - user.createdAt.getTime();
      const accountAgeDays = accountAgeMs / (24 * 60 * 60 * 1000);
      if (accountAgeDays < 7) {
        flags.push('new_account_high_value');
        score += 15;
        details.accountAgeDays = Math.round(accountAgeDays);
        details.amount = data.amount;
      }
    }
  }

  // Clamp score
  score = Math.min(100, Math.max(0, score));

  // Determine recommendation
  let recommendation: FraudRecommendation = 'allow';
  if (score >= cfg.blockThreshold) {
    recommendation = 'block';
  } else if (score >= cfg.reviewThreshold) {
    recommendation = 'review';
  }

  return { score, flags, recommendation, details };
}

// ---------------------------------------------------------------------------
// Flagged redemption queries for admin dashboard
// ---------------------------------------------------------------------------

export interface FlaggedRedemption {
  id: string;
  userId: string;
  userEmail: string;
  merchantId: string;
  merchantName: string;
  voucherId: string | null;
  riskScore: number;
  flags: string[];
  recommendation: string;
  fraudStatus: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export async function getFlaggedRedemptions(options: {
  page?: number;
  limit?: number;
  minScore?: number;
  status?: string;
}): Promise<{ items: FlaggedRedemption[]; total: number }> {
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 50, 200);
  const skip = (page - 1) * limit;
  const minScore = options.minScore ?? 30;

  // Query redemptions with relations for fraud analysis
  const [redemptions, total] = await Promise.all([
    prisma.redemption.findMany({
      include: {
        redeemedBy: { select: { id: true, email: true } },
        merchant: { select: { id: true, name: true } },
        voucher: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.redemption.count(),
  ]);

  const items: FlaggedRedemption[] = redemptions
    .map((r) => {
      // Use discountApplied as a proxy risk score for flagged redemptions
      const riskScore = r.discountApplied > 0 ? Math.min(r.discountApplied / 100, 100) : 0;

      return {
        id: r.id,
        userId: r.redeemedBy?.id ?? '',
        userEmail: r.redeemedBy?.email ?? '',
        merchantId: r.merchant?.id ?? '',
        merchantName: r.merchant?.name ?? '',
        voucherId: r.voucher?.id ?? null,
        riskScore,
        flags: [] as string[],
        recommendation: 'allow',
        fraudStatus: 'pending',
        createdAt: r.createdAt.toISOString(),
        metadata: null,
      };
    })
    .filter((item) => item.riskScore >= minScore)
    .sort((a, b) => b.riskScore - a.riskScore);

  return { items, total };
}

export async function updateFraudStatus(
  redemptionId: string,
  status: 'confirmed' | 'false_positive',
  _adminUserId: string
): Promise<void> {
  const redemption = await prisma.redemption.findUnique({
    where: { id: redemptionId },
    select: { id: true },
  });

  if (!redemption) throw new Error('Redemption not found');

  // Update orderReference to track fraud review status
  await prisma.redemption.update({
    where: { id: redemptionId },
    data: { orderReference: `fraud:${status}` },
  });
}

export function getRiskDistribution(items: FlaggedRedemption[]): Record<string, number> {
  const buckets: Record<string, number> = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0,
  };

  for (const item of items) {
    if (item.riskScore <= 20) buckets['0-20']++;
    else if (item.riskScore <= 40) buckets['21-40']++;
    else if (item.riskScore <= 60) buckets['41-60']++;
    else if (item.riskScore <= 80) buckets['61-80']++;
    else buckets['81-100']++;
  }

  return buckets;
}
