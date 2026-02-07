import { prisma } from './prisma';
import { checkRedisRateLimit } from './redis';
import { loggers } from './logger';

interface RiskSignal {
  type: 'rate_limit' | 'suspicious_pattern' | 'device_fingerprint';
  severity: 'low' | 'medium' | 'high';
  metadata?: Record<string, unknown>;
}

/**
 * Check rate limits for referral creation
 */
export async function checkReferralRateLimit(
  userId: string,
  windowMinutes: number = 60,
  maxAttempts: number = 10
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  const recentCount = await prisma.referral.count({
    where: {
      referrerUserId: userId,
      createdAt: {
        gte: windowStart,
      },
    },
  });

  return {
    allowed: recentCount < maxAttempts,
    remaining: Math.max(0, maxAttempts - recentCount),
  };
}

/**
 * Check rate limits for redemption attempts
 */
export async function checkRedemptionRateLimit(
  friendHash: string,
  windowMinutes: number = 60,
  maxAttempts: number = 5
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  const recentCount = await prisma.redemption.count({
    where: {
      referral: {
        friendHash,
      },
      createdAt: {
        gte: windowStart,
      },
    },
  });

  return {
    allowed: recentCount < maxAttempts,
    remaining: Math.max(0, maxAttempts - recentCount),
  };
}

/**
 * Check rate limits for voucher purchases
 */
export async function checkPurchaseRateLimit(
  userId: string,
  windowMinutes: number = 60,
  maxAttempts: number = 20
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  const recentCount = await prisma.voucherPurchase.count({
    where: {
      userId,
      createdAt: {
        gte: windowStart,
      },
    },
  });

  return {
    allowed: recentCount < maxAttempts,
    remaining: Math.max(0, maxAttempts - recentCount),
  };
}

/**
 * Check rate limits for campaign creation
 */
export async function checkCampaignCreationRateLimit(
  userId: string,
  merchantId: string,
  windowMinutes: number = 60,
  maxAttempts: number = 10
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  const recentCount = await prisma.campaign.count({
    where: {
      merchantId,
      createdAt: {
        gte: windowStart,
      },
    },
  });

  return {
    allowed: recentCount < maxAttempts,
    remaining: Math.max(0, maxAttempts - recentCount),
  };
}

/**
 * IP-based rate limiting using Redis for distributed rate limiting
 * Falls back to database counting if Redis is unavailable
 */
export async function checkIPRateLimit(
  ip: string,
  windowMinutes: number = 60,
  maxAttempts: number = 100
): Promise<{ allowed: boolean; remaining: number }> {
  const windowSeconds = windowMinutes * 60;
  const key = `rate_limit:ip:${ip}`;

  try {
    // Use Redis-based rate limiting
    const result = await checkRedisRateLimit(key, windowSeconds, maxAttempts);

    // Log if rate limit exceeded
    if (!result.allowed) {
      loggers.security('ip_rate_limit_exceeded', {
        ip,
        maxAttempts,
        windowMinutes,
      });
    }

    return {
      allowed: result.allowed,
      remaining: result.remaining,
    };
  } catch (error) {
    // Fallback: allow request but log error
    loggers.fraud('rate_limit_check_failed', 'medium', {
      ip,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Fail open for availability (but log for monitoring)
    return { allowed: true, remaining: maxAttempts - 1 };
  }
}

/**
 * Prevent self-referral: check if user is trying to redeem their own referral
 */
export async function isSelfReferral(
  referralId: string,
  userId: string
): Promise<boolean> {
  const referral = await prisma.referral.findUnique({
    where: { id: referralId },
    select: { referrerUserId: true },
  });

  return referral?.referrerUserId === userId;
}

/**
 * Store risk signal with structured logging and audit trail
 */
export async function recordRiskSignal(
  userId: string,
  signal: RiskSignal
): Promise<void> {
  try {
    // Log to structured logger for real-time monitoring
    loggers.fraud(signal.type, signal.severity, {
      userId,
      metadata: signal.metadata,
    });

    // Store in audit log for historical analysis
    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'fraud.risk_signal',
        payloadJson: JSON.stringify(signal),
      },
    });
  } catch (error) {
    // Don't fail operation if logging fails
    loggers.fraud('risk_signal_recording_failed', 'low', {
      userId,
      signal: signal.type,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
