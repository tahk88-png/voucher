import { prisma } from "@/lib/prisma";
import { getCached } from "@/lib/cache";
import { logger } from "@/lib/logger";

export type KPIMetrics = {
  dau: number;
  mau: number;
  totalRevenue: number;
  mrr: number;
  totalMerchants: number;
  activeMerchants: number;
  totalUsers: number;
  newUsersThisMonth: number;
  churnRate: number;
  averageRevenuePerMerchant: number;
};

function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calculate platform-wide KPIs with 5-minute caching.
 */
export async function getKPIs(): Promise<KPIMetrics> {
  return getCached("admin:kpis", async () => {
    const todayStart = startOfDay();
    const monthStart = startOfMonth();

    // DAU: distinct users active today across purchases and redemptions
    const [dauVoucher, dauTicket, dauRedemption] = await Promise.all([
      prisma.voucherPurchase.findMany({
        where: { createdAt: { gte: todayStart } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.ticketPurchase.findMany({
        where: { createdAt: { gte: todayStart } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.redemption.findMany({
        where: { createdAt: { gte: todayStart } },
        select: { redeemedByUserId: true },
        distinct: ["redeemedByUserId"],
      }),
    ]);

    const dauUserIds = new Set([
      ...dauVoucher.map((r) => r.userId),
      ...dauTicket.map((r) => r.userId),
      ...dauRedemption.map((r) => r.redeemedByUserId),
    ]);
    const dau = dauUserIds.size;

    // MAU: distinct users active this month
    const [mauVoucher, mauTicket, mauRedemption] = await Promise.all([
      prisma.voucherPurchase.findMany({
        where: { createdAt: { gte: monthStart } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.ticketPurchase.findMany({
        where: { createdAt: { gte: monthStart } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.redemption.findMany({
        where: { createdAt: { gte: monthStart } },
        select: { redeemedByUserId: true },
        distinct: ["redeemedByUserId"],
      }),
    ]);

    const mauUserIds = new Set([
      ...mauVoucher.map((r) => r.userId),
      ...mauTicket.map((r) => r.userId),
      ...mauRedemption.map((r) => r.redeemedByUserId),
    ]);
    const mau = mauUserIds.size;

    // Revenue totals (minor units)
    const [voucherRevenue, ticketRevenue] = await Promise.all([
      prisma.voucherPurchase.aggregate({
        _sum: { amount: true },
        where: { status: "paid" },
      }),
      prisma.ticketPurchase.aggregate({
        _sum: { amount: true },
        where: { status: "paid" },
      }),
    ]);

    const totalRevenue =
      (voucherRevenue._sum.amount ?? 0) + (ticketRevenue._sum.amount ?? 0);

    // MRR: count active subscriptions (approximate)
    const activeSubscriptions = await prisma.merchantSubscription.count({
      where: { status: "active" },
    });
    const mrr = activeSubscriptions; // count of active subscriptions; multiply by plan price if available

    // Merchant counts
    const [totalMerchants, activeMerchants] = await Promise.all([
      prisma.merchant.count(),
      prisma.merchant.count({ where: { isActive: true } }),
    ]);

    // User counts
    const [totalUsers, newUsersThisMonth] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    ]);

    // Churn rate
    const [canceledThisMonth, totalSubs] = await Promise.all([
      prisma.merchantSubscription.count({
        where: {
          status: "canceled",
          updatedAt: { gte: monthStart },
        },
      }),
      prisma.merchantSubscription.count(),
    ]);

    const churnRate = totalSubs > 0
      ? Math.round((canceledThisMonth / totalSubs) * 10000) / 100
      : 0;

    // Average revenue per merchant
    const averageRevenuePerMerchant =
      activeMerchants > 0
        ? Math.round(totalRevenue / activeMerchants)
        : 0;

    const metrics: KPIMetrics = {
      dau,
      mau,
      totalRevenue,
      mrr,
      totalMerchants,
      activeMerchants,
      totalUsers,
      newUsersThisMonth,
      churnRate,
      averageRevenuePerMerchant,
    };

    logger.info("KPIs calculated", metrics);
    return metrics;
  }, 300);
}

/**
 * Revenue timeseries grouped by day, week, or month.
 */
export async function getRevenueTimeseries(
  from: Date,
  to: Date,
  granularity: "day" | "week" | "month" = "day"
): Promise<{ date: string; revenue: number; transactions: number }[]> {
  const truncFn =
    granularity === "day"
      ? "day"
      : granularity === "week"
        ? "week"
        : "month";

  const results = await prisma.$queryRaw<
    { period: Date; revenue: bigint; transactions: bigint }[]
  >`
    SELECT
      date_trunc(${truncFn}, "createdAt") AS period,
      COALESCE(SUM(amount), 0) AS revenue,
      COUNT(*)::bigint AS transactions
    FROM "VoucherPurchase"
    WHERE status = 'paid'
      AND "createdAt" >= ${from}
      AND "createdAt" <= ${to}
    GROUP BY period
    ORDER BY period ASC
  `;

  return results.map((row) => ({
    date: new Date(row.period).toISOString(),
    revenue: Number(row.revenue),
    transactions: Number(row.transactions),
  }));
}

/**
 * Cohort retention analysis.
 * Groups users by signup period and tracks activity in subsequent periods.
 */
export async function getCohortRetention(
  granularity: "month" | "week" = "month",
  cohortCount: number = 6
): Promise<
  { cohort: string; totalUsers: number; retained: Record<string, number> }[]
> {
  const truncFn = granularity === "month" ? "month" : "week";
  const intervalUnit = granularity === "month" ? "months" : "weeks";

  // Get cohorts of users grouped by signup period
  const cohorts = await prisma.$queryRaw<
    { cohort: Date; total_users: bigint }[]
  >`
    SELECT
      date_trunc(${truncFn}, "createdAt") AS cohort,
      COUNT(*)::bigint AS total_users
    FROM "User"
    WHERE "createdAt" >= (CURRENT_DATE - (${cohortCount} || ' ${intervalUnit}')::interval)
    GROUP BY cohort
    ORDER BY cohort ASC
  `;

  const results: {
    cohort: string;
    totalUsers: number;
    retained: Record<string, number>;
  }[] = [];

  for (const cohortRow of cohorts) {
    const cohortDate = new Date(cohortRow.cohort);
    const cohortLabel = cohortDate.toISOString().slice(0, 10);
    const totalUsers = Number(cohortRow.total_users);

    // For each subsequent period, count how many users from this cohort were active
    const retained: Record<string, number> = {};

    for (let i = 0; i < cohortCount; i++) {
      const periodStart = new Date(cohortDate);
      const periodEnd = new Date(cohortDate);

      if (granularity === "month") {
        periodStart.setMonth(periodStart.getMonth() + i);
        periodEnd.setMonth(periodEnd.getMonth() + i + 1);
      } else {
        periodStart.setDate(periodStart.getDate() + i * 7);
        periodEnd.setDate(periodEnd.getDate() + (i + 1) * 7);
      }

      // Don't query future periods
      if (periodStart > new Date()) break;

      const activeUsers = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT u.id)::bigint AS count
        FROM "User" u
        WHERE date_trunc(${truncFn}, u."createdAt") = ${cohortDate}
          AND (
            EXISTS (
              SELECT 1 FROM "VoucherPurchase" vp
              WHERE vp."userId" = u.id
                AND vp."createdAt" >= ${periodStart}
                AND vp."createdAt" < ${periodEnd}
            )
            OR EXISTS (
              SELECT 1 FROM "Redemption" r
              WHERE r."redeemedByUserId" = u.id
                AND r."createdAt" >= ${periodStart}
                AND r."createdAt" < ${periodEnd}
            )
          )
      `;

      const periodLabel = `period_${i}`;
      retained[periodLabel] = Number(activeUsers[0]?.count ?? 0);
    }

    results.push({ cohort: cohortLabel, totalUsers, retained });
  }

  return results;
}

/**
 * Export analytics data as CSV with UTF-8 BOM.
 */
export async function exportAnalyticsCSV(
  metric: "revenue" | "users" | "merchants",
  from: Date,
  to: Date
): Promise<string> {
  const BOM = "\uFEFF";
  let csv = BOM;

  if (metric === "revenue") {
    const purchases = await prisma.voucherPurchase.findMany({
      where: {
        status: "paid",
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    });

    const ticketPurchases = await prisma.ticketPurchase.findMany({
      where: {
        status: "paid",
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    });

    csv += "type,id,userId,amount,status,createdAt\n";
    for (const p of purchases) {
      csv += `voucher,${p.id},${p.userId},${p.amount},${p.status},${p.createdAt.toISOString()}\n`;
    }
    for (const p of ticketPurchases) {
      csv += `ticket,${p.id},${p.userId},${p.amount},${p.status},${p.createdAt.toISOString()}\n`;
    }
  } else if (metric === "users") {
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    csv += "id,email,name,createdAt\n";
    for (const u of users) {
      const name = (u.name ?? "").replace(/,/g, " ");
      csv += `${u.id},${u.email},${name},${u.createdAt.toISOString()}\n`;
    }
  } else if (metric === "merchants") {
    const merchants = await prisma.merchant.findMany({
      where: {
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
      },
    });

    csv += "id,name,slug,isActive,createdAt\n";
    for (const m of merchants) {
      const name = (m.name ?? "").replace(/,/g, " ");
      csv += `${m.id},${name},${m.slug},${m.isActive},${m.createdAt.toISOString()}\n`;
    }
  }

  return csv;
}
