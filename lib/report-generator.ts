/**
 * Scheduled report generation for merchants.
 *
 * Generates HTML-formatted reports with revenue, redemption, and growth data.
 */

import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface MerchantReportData {
  merchantName: string;
  period: { from: Date; to: Date; label: string };
  revenue: { current: number; previous: number; change: number; currency: string };
  redemptions: { current: number; previous: number; change: number };
  topVouchers: Array<{ name: string; redemptions: number; revenue: number }>;
  growthPercent: number;
}

// ---------------------------------------------------------------------------
// Report generation
// ---------------------------------------------------------------------------

function getPeriodDates(period: ReportPeriod): { current: { from: Date; to: Date }; previous: { from: Date; to: Date }; label: string } {
  const now = new Date();
  let currentFrom: Date;
  let currentTo: Date;
  let previousFrom: Date;
  let previousTo: Date;
  let label: string;

  switch (period) {
    case 'daily': {
      currentTo = new Date(now);
      currentFrom = new Date(now);
      currentFrom.setDate(currentFrom.getDate() - 1);
      currentFrom.setHours(0, 0, 0, 0);
      currentTo.setHours(0, 0, 0, 0);
      previousTo = new Date(currentFrom);
      previousFrom = new Date(previousTo);
      previousFrom.setDate(previousFrom.getDate() - 1);
      label = currentFrom.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      break;
    }
    case 'weekly': {
      currentTo = new Date(now);
      currentFrom = new Date(now);
      currentFrom.setDate(currentFrom.getDate() - 7);
      previousTo = new Date(currentFrom);
      previousFrom = new Date(previousTo);
      previousFrom.setDate(previousFrom.getDate() - 7);
      label = `${currentFrom.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${currentTo.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      break;
    }
    case 'monthly':
    default: {
      currentTo = new Date(now);
      currentFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      currentTo = lastDayPrevMonth;
      previousFrom = new Date(currentFrom);
      previousFrom.setMonth(previousFrom.getMonth() - 1);
      previousTo = new Date(currentFrom);
      previousTo.setDate(previousTo.getDate() - 1);
      label = currentFrom.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      break;
    }
  }

  return {
    current: { from: currentFrom, to: currentTo },
    previous: { from: previousFrom, to: previousTo },
    label,
  };
}

export async function generateMerchantReport(
  merchantId: string,
  period: ReportPeriod
): Promise<MerchantReportData> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { name: true, defaultCurrency: true },
  });

  if (!merchant) throw new Error('Merchant not found');

  const dates = getPeriodDates(period);

  const [
    currentRevenue,
    previousRevenue,
    currentRedemptions,
    previousRedemptions,
    topVouchers,
  ] = await Promise.all([
    // Current period revenue
    prisma.voucherPurchase.aggregate({
      where: {
        merchantId,
        status: 'paid',
        createdAt: { gte: dates.current.from, lte: dates.current.to },
      },
      _sum: { amount: true },
    }),
    // Previous period revenue
    prisma.voucherPurchase.aggregate({
      where: {
        merchantId,
        status: 'paid',
        createdAt: { gte: dates.previous.from, lte: dates.previous.to },
      },
      _sum: { amount: true },
    }),
    // Current period redemptions
    prisma.redemption.count({
      where: {
        merchantId,
        confirmedAt: { not: null, gte: dates.current.from, lte: dates.current.to },
      },
    }),
    // Previous period redemptions
    prisma.redemption.count({
      where: {
        merchantId,
        confirmedAt: { not: null, gte: dates.previous.from, lte: dates.previous.to },
      },
    }),
    // Top vouchers in current period
    prisma.voucher.findMany({
      where: { merchantId },
      include: {
        _count: {
          select: {
            redemptions: {
              where: {
                confirmedAt: { not: null, gte: dates.current.from, lte: dates.current.to },
              },
            },
          },
        },
        voucherPurchases: {
          where: {
            status: 'paid',
            createdAt: { gte: dates.current.from, lte: dates.current.to },
          },
          select: { amount: true },
        },
      },
      orderBy: { redemptions: { _count: 'desc' } },
      take: 5,
    }),
  ]);

  const curRev = currentRevenue._sum.amount ?? 0;
  const prevRev = previousRevenue._sum.amount ?? 0;
  const revenueChange = prevRev > 0 ? ((curRev - prevRev) / prevRev) * 100 : curRev > 0 ? 100 : 0;
  const redemptionChange = previousRedemptions > 0
    ? ((currentRedemptions - previousRedemptions) / previousRedemptions) * 100
    : currentRedemptions > 0 ? 100 : 0;

  const growthPercent = revenueChange;

  return {
    merchantName: merchant.name,
    period: { from: dates.current.from, to: dates.current.to, label: dates.label },
    revenue: {
      current: curRev,
      previous: prevRev,
      change: Math.round(revenueChange * 10) / 10,
      currency: merchant.defaultCurrency,
    },
    redemptions: {
      current: currentRedemptions,
      previous: previousRedemptions,
      change: Math.round(redemptionChange * 10) / 10,
    },
    topVouchers: topVouchers.map((v) => ({
      name: v.type ?? v.id,
      redemptions: v._count.redemptions,
      revenue: v.voucherPurchases.reduce((sum, p) => sum + p.amount, 0),
    })),
    growthPercent: Math.round(growthPercent * 10) / 10,
  };
}

// ---------------------------------------------------------------------------
// HTML formatting
// ---------------------------------------------------------------------------

export function formatReportAsHtml(data: MerchantReportData): string {
  const fmt = (cents: number) => (cents / 100).toFixed(2);
  const changeArrow = (change: number) =>
    change > 0 ? `<span style="color:#16a34a">+${change}%</span>` : change < 0 ? `<span style="color:#dc2626">${change}%</span>` : '<span style="color:#6b7280">0%</span>';

  const voucherRows = data.topVouchers
    .map(
      (v) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${v.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${v.redemptions}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${fmt(v.revenue)} ${data.revenue.currency}</td>
    </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1f2937">
  <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:24px;border-radius:12px;color:#fff;margin-bottom:24px">
    <h1 style="margin:0 0 4px 0;font-size:24px">${data.merchantName}</h1>
    <p style="margin:0;opacity:0.9;font-size:14px">${data.period.label} Report</p>
  </div>

  <div style="display:flex;gap:16px;margin-bottom:24px">
    <div style="flex:1;background:#f9fafb;padding:16px;border-radius:8px;border:1px solid #e5e7eb">
      <div style="font-size:12px;color:#6b7280;margin-bottom:4px">Revenue</div>
      <div style="font-size:24px;font-weight:700">${fmt(data.revenue.current)} ${data.revenue.currency}</div>
      <div style="font-size:13px;margin-top:4px">${changeArrow(data.revenue.change)} vs previous</div>
    </div>
    <div style="flex:1;background:#f9fafb;padding:16px;border-radius:8px;border:1px solid #e5e7eb">
      <div style="font-size:12px;color:#6b7280;margin-bottom:4px">Redemptions</div>
      <div style="font-size:24px;font-weight:700">${data.redemptions.current}</div>
      <div style="font-size:13px;margin-top:4px">${changeArrow(data.redemptions.change)} vs previous</div>
    </div>
  </div>

  <div style="margin-bottom:24px">
    <h2 style="font-size:16px;margin-bottom:12px">Top Vouchers</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="background:#f3f4f6">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb">Voucher</th>
          <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb">Redemptions</th>
          <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb">Revenue</th>
        </tr>
      </thead>
      <tbody>
        ${voucherRows || '<tr><td colspan="3" style="padding:16px;text-align:center;color:#9ca3af">No voucher data</td></tr>'}
      </tbody>
    </table>
  </div>

  <div style="background:#f0fdf4;padding:16px;border-radius:8px;border:1px solid #bbf7d0;text-align:center">
    <div style="font-size:13px;color:#15803d;margin-bottom:4px">Growth</div>
    <div style="font-size:28px;font-weight:700;color:#16a34a">${data.growthPercent > 0 ? '+' : ''}${data.growthPercent}%</div>
  </div>

  <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center">
    Generated automatically. Do not reply to this email.
  </div>
</body>
</html>`;
}
