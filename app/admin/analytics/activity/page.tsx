import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { AccessControlError, requirePlatformAdminProfile } from '@/lib/access-control';
import { ChartSkeleton } from '@/components/dashboard';
import ActivityDashboardClient from './activity-dashboard-client';

export const metadata: Metadata = {
  title: 'Activity Dashboard — Admin',
  robots: { index: false, follow: false },
};

async function fetchActivityData() {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    recentActivity,
    eventsByHour,
    popularVouchers,
    recentPurchases,
    peakHoursData,
  ] = await Promise.all([
    // Recent activity for feed
    prisma.auditLog.findMany({
      take: 50,
      include: {
        actor: { select: { email: true, name: true } },
        merchant: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Events per hour (last 24h)
    prisma.$queryRaw<{ hour: number; count: bigint }[]>`
      SELECT EXTRACT(HOUR FROM "createdAt")::int as hour, COUNT(*)::bigint as count
      FROM "AuditLog"
      WHERE "createdAt" >= ${twentyFourHoursAgo}
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY hour
    `,
    // Most popular vouchers
    prisma.voucherPurchase.groupBy({
      by: ['voucherId'],
      where: { status: 'paid', createdAt: { gte: sevenDaysAgo } },
      _count: true,
      _sum: { amount: true },
      orderBy: { _count: { voucherId: 'desc' } },
      take: 15,
    }),
    // Recent purchases timeline
    prisma.voucherPurchase.findMany({
      where: { status: 'paid', createdAt: { gte: twentyFourHoursAgo } },
      include: {
        user: { select: { name: true, email: true } },
        voucher: { select: { id: true, codePrefix: true, type: true } },
        merchant: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    // Peak hours heatmap (day x hour, last 7 days)
    prisma.$queryRaw<{ day: number; hour: number; count: bigint }[]>`
      SELECT
        EXTRACT(DOW FROM "createdAt")::int as day,
        EXTRACT(HOUR FROM "createdAt")::int as hour,
        COUNT(*)::bigint as count
      FROM "AuditLog"
      WHERE "createdAt" >= ${sevenDaysAgo}
      GROUP BY EXTRACT(DOW FROM "createdAt"), EXTRACT(HOUR FROM "createdAt")
      ORDER BY day, hour
    `,
  ]);

  // Activity feed
  const activityFeed = recentActivity.map((log) => ({
    id: log.id,
    action: log.action,
    actorName: log.actor?.name ?? log.actor?.email ?? 'System',
    merchantName: log.merchant?.name ?? null,
    createdAt: log.createdAt.toISOString(),
  }));

  // Events per hour chart
  const eventsPerHour: { hour: string; value: number }[] = [];
  for (let h = 0; h < 24; h++) {
    const found = eventsByHour.find((e) => e.hour === h);
    eventsPerHour.push({
      hour: `${h.toString().padStart(2, '0')}:00`,
      value: found ? Number(found.count) : 0,
    });
  }

  // Resolve voucher names for popular vouchers
  const voucherIds = popularVouchers.map((v) => v.voucherId).filter((id): id is string => id != null);
  const vouchers = await prisma.voucher.findMany({
    where: { id: { in: voucherIds } },
    select: { id: true, codePrefix: true, type: true },
  });
  const voucherMap = new Map(vouchers.map((v) => [v.id, v.codePrefix ?? v.type ?? v.id]));

  const topVouchers = popularVouchers.map((v) => ({
    id: v.voucherId ?? 'unknown',
    title: (v.voucherId ? voucherMap.get(v.voucherId) : null) ?? 'Unknown',
    purchases: v._count,
    revenue: (v._sum.amount ?? 0) / 100,
  }));

  // Recent purchases timeline
  const purchaseTimeline = recentPurchases.map((p) => ({
    id: p.id,
    buyerName: p.user?.name ?? p.user?.email ?? 'Unknown',
    voucherTitle: p.voucher?.codePrefix ?? p.voucher?.type ?? 'Unknown',
    merchantName: p.merchant?.name ?? 'Unknown',
    amount: (p.amount ?? 0) / 100,
    createdAt: p.createdAt.toISOString(),
  }));

  // Peak hours heatmap
  const peakHours = peakHoursData.map((d) => ({
    day: d.day,
    hour: d.hour,
    value: Number(d.count),
  }));

  // Fill missing entries
  const peakHoursMap = new Map(peakHours.map((p) => [`${p.day}-${p.hour}`, p.value]));
  const peakHoursFull: { day: number; hour: number; value: number }[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      peakHoursFull.push({
        day,
        hour,
        value: peakHoursMap.get(`${day}-${hour}`) ?? 0,
      });
    }
  }

  return {
    activityFeed,
    eventsPerHour,
    topVouchers,
    purchaseTimeline,
    peakHours: peakHoursFull,
  };
}

export default async function ActivityDashboardPage() {
  try {
    await requirePlatformAdminProfile();
  } catch (error) {
    if (error instanceof AccessControlError && error.status === 401) {
      redirect('/login');
    }
    redirect('/app');
  }

  const data = await fetchActivityData();

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ActivityDashboardClient data={data} />
    </Suspense>
  );
}
