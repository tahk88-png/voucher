import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ─── Event Tracking ───

export async function trackEvent(
  type: string,
  data: {
    userId?: string;
    merchantId?: string;
    sessionId?: string;
    page?: string;
    referrer?: string;
    metadata?: Record<string, unknown>;
    country?: string;
    device?: string;
    browser?: string;
    ipHash?: string;
    duration?: number;
  }
) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        type,
        userId: data.userId ?? null,
        merchantId: data.merchantId ?? null,
        sessionId: data.sessionId ?? null,
        page: data.page ?? null,
        referrer: data.referrer ?? null,
        metadata: data.metadata ?? undefined,
        country: data.country ?? null,
        device: data.device ?? null,
        browser: data.browser ?? null,
        ipHash: data.ipHash ?? null,
        duration: data.duration ?? null,
      },
    });
  } catch {
    // Silently fail — analytics should never break the main flow
    console.error('[analytics] Failed to track event:', type);
  }
}

export async function trackPageView(
  path: string,
  metadata?: {
    userId?: string;
    sessionId?: string;
    referrer?: string;
    country?: string;
    device?: string;
    duration?: number;
  }
) {
  try {
    await prisma.pageView.create({
      data: {
        path,
        userId: metadata?.userId ?? null,
        sessionId: metadata?.sessionId ?? null,
        referrer: metadata?.referrer ?? null,
        country: metadata?.country ?? null,
        device: metadata?.device ?? null,
        duration: metadata?.duration ?? null,
      },
    });
  } catch {
    console.error('[analytics] Failed to track page view:', path);
  }
}

// ─── Query Helpers ───

type Granularity = 'hour' | 'day' | 'week' | 'month';

function dateToTruncSql(granularity: Granularity): string {
  switch (granularity) {
    case 'hour':
      return `date_trunc('hour', "createdAt")`;
    case 'day':
      return `date_trunc('day', "createdAt")`;
    case 'week':
      return `date_trunc('week', "createdAt")`;
    case 'month':
      return `date_trunc('month', "createdAt")`;
    default:
      return `date_trunc('day', "createdAt")`;
  }
}

/**
 * Generic time series query.
 * Returns an array of { date: string, value: number } sorted by date.
 */
export async function getTimeSeries(
  table: 'AnalyticsEvent' | 'PageView' | 'User' | 'VoucherPurchase' | 'Redemption',
  metric: 'count' | 'sum',
  from: Date,
  to: Date,
  granularity: Granularity = 'day',
  options?: {
    where?: string; // extra SQL WHERE clause (already parameterized)
    sumField?: string; // field to SUM when metric is 'sum'
  }
): Promise<Array<{ date: string; value: number }>> {
  const truncExpr = dateToTruncSql(granularity);
  const tableName = `"${table}"`;
  const valueExpr = metric === 'sum' && options?.sumField
    ? `COALESCE(SUM("${options.sumField}"), 0)`
    : 'COUNT(*)';
  const extraWhere = options?.where ? `AND ${options.where}` : '';

  const rows = await prisma.$queryRawUnsafe<Array<{ date: Date; value: bigint | number }>>(
    `SELECT ${truncExpr} as date, ${valueExpr}::bigint as value
     FROM ${tableName}
     WHERE "createdAt" >= $1 AND "createdAt" <= $2 ${extraWhere}
     GROUP BY ${truncExpr}
     ORDER BY date ASC`,
    from,
    to
  );

  return rows.map((r) => ({
    date: new Date(r.date).toISOString(),
    value: Number(r.value),
  }));
}

/**
 * Generic aggregation query grouped by a field.
 * Returns an array of { group: string, value: number }.
 */
export async function getAggregation(
  table: string,
  metric: 'count' | 'sum',
  from: Date,
  to: Date,
  groupBy: string,
  options?: { sumField?: string; limit?: number }
): Promise<Array<{ group: string; value: number }>> {
  const tableName = `"${table}"`;
  const valueExpr = metric === 'sum' && options?.sumField
    ? `COALESCE(SUM("${options.sumField}"), 0)`
    : 'COUNT(*)';
  const limitClause = options?.limit ? `LIMIT ${options.limit}` : '';

  const rows = await prisma.$queryRawUnsafe<Array<{ group: string; value: bigint | number }>>(
    `SELECT "${groupBy}" as "group", ${valueExpr}::bigint as value
     FROM ${tableName}
     WHERE "createdAt" >= $1 AND "createdAt" <= $2
       AND "${groupBy}" IS NOT NULL
     GROUP BY "${groupBy}"
     ORDER BY value DESC
     ${limitClause}`,
    from,
    to
  );

  return rows.map((r) => ({
    group: r.group,
    value: Number(r.value),
  }));
}

// ─── Utility Helpers ───

/**
 * Calculate percentage growth rate between two values.
 * Returns null if previous is 0 (no meaningful comparison).
 */
export function calculateGrowthRate(current: number, previous: number): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

/**
 * Format cents to a currency string.
 */
export function formatCurrency(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Hash an IP address for privacy-preserving storage.
 */
export function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + (process.env.IP_SALT || 'analytics')).digest('hex').slice(0, 16);
}

/**
 * Detect device type from User-Agent string.
 */
export function detectDevice(ua: string | null): string {
  if (!ua) return 'unknown';
  const lower = ua.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(lower)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/.test(lower)) return 'mobile';
  return 'desktop';
}

/**
 * Detect browser from User-Agent string.
 */
export function detectBrowser(ua: string | null): string {
  if (!ua) return 'unknown';
  if (ua.includes('Firefox/')) return 'firefox';
  if (ua.includes('Edg/')) return 'edge';
  if (ua.includes('Chrome/')) return 'chrome';
  if (ua.includes('Safari/')) return 'safari';
  if (ua.includes('Opera') || ua.includes('OPR/')) return 'opera';
  return 'other';
}

/**
 * Extract country from request headers (e.g. Cloudflare, Vercel).
 */
export function getCountryFromHeaders(headers: Headers): string | null {
  return (
    headers.get('cf-ipcountry') ??
    headers.get('x-vercel-ip-country') ??
    null
  );
}
