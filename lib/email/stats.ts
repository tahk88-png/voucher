/**
 * Email daily stats aggregation.
 *
 * Counts EmailMessage records for a given date, grouped by category and
 * provider, then upserts into EmailDailyStats for fast dashboard queries.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AggregateRow = {
  category: string;
  providerType: string;
  status: string;
  _count: { id: number };
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Aggregate email stats for the given date and upsert into EmailDailyStats.
 *
 * Groups messages by (category, providerType) and computes totals for each
 * status bucket (sent, delivered, bounced, failed, opened, clicked, etc.).
 *
 * Also creates an "all / all" roll-up row for the day.
 */
export async function aggregateDailyStats(date: Date): Promise<void> {
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);

  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  logger.info('[email-stats] Aggregating', {
    date: dayStart.toISOString().slice(0, 10),
  });

  // Group by category + provider + status
  const rawRows = await prisma.emailMessage.groupBy({
    by: ['category', 'providerType', 'status'],
    where: {
      createdAt: { gte: dayStart, lt: dayEnd },
    },
    _count: { id: true },
  });
  const rows = rawRows as unknown as AggregateRow[];

  // Build per-(category, provider) buckets
  type Bucket = {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
    failed: number;
  };

  const buckets = new Map<string, Bucket>();

  function getKey(category: string, provider: string) {
    return `${category}::${provider}`;
  }

  function ensureBucket(category: string, provider: string): Bucket {
    const key = getKey(category, provider);
    let b = buckets.get(key);
    if (!b) {
      b = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0, failed: 0 };
      buckets.set(key, b);
    }
    return b;
  }

  for (const row of rows) {
    const bucket = ensureBucket(row.category, row.providerType);
    const count = row._count.id;
    const status = row.status.toLowerCase();

    switch (status) {
      case 'sent':
        bucket.sent += count;
        break;
      case 'delivered':
        bucket.delivered += count;
        break;
      case 'opened':
        bucket.opened += count;
        break;
      case 'clicked':
        bucket.clicked += count;
        break;
      case 'bounced':
        bucket.bounced += count;
        break;
      case 'complained':
        bucket.complained += count;
        break;
      case 'failed':
      case 'suppressed':
        bucket.failed += count;
        break;
      default:
        // Count unknown statuses as sent
        bucket.sent += count;
    }
  }

  // Upsert each bucket
  const upsertOps = [];

  for (const [key, bucket] of buckets) {
    const [category, provider] = key.split('::');
    upsertOps.push(
      prisma.emailDailyStats.upsert({
        where: {
          date_category_provider: {
            date: dayStart,
            category,
            provider,
          },
        },
        create: {
          date: dayStart,
          category,
          provider,
          ...bucket,
        },
        update: bucket,
      })
    );
  }

  // Roll-up: "all / all" totals for the entire day
  const allTotals: Bucket = {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    complained: 0,
    failed: 0,
  };

  for (const bucket of buckets.values()) {
    allTotals.sent += bucket.sent;
    allTotals.delivered += bucket.delivered;
    allTotals.opened += bucket.opened;
    allTotals.clicked += bucket.clicked;
    allTotals.bounced += bucket.bounced;
    allTotals.complained += bucket.complained;
    allTotals.failed += bucket.failed;
  }

  upsertOps.push(
    prisma.emailDailyStats.upsert({
      where: {
        date_category_provider: {
          date: dayStart,
          category: 'all',
          provider: 'all',
        },
      },
      create: {
        date: dayStart,
        category: 'all',
        provider: 'all',
        ...allTotals,
      },
      update: allTotals,
    })
  );

  await prisma.$transaction(upsertOps);

  logger.info('[email-stats] Aggregation complete', {
    date: dayStart.toISOString().slice(0, 10),
    buckets: buckets.size,
    totalSent: allTotals.sent,
    totalDelivered: allTotals.delivered,
  });
}
