import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { requireMerchantProfileAccessBySlug, AccessControlError } from '@/lib/access-control';
import { Download, DollarSign, TrendingUp, Percent, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { from?: string; to?: string };
}) {
  let merchant: any;
  try {
    const access = await requireMerchantProfileAccessBySlug(params.slug, 'merchant_admin');
    merchant = access.merchant;
  } catch (error) {
    if (error instanceof AccessControlError && error.status === 401) redirect('/login');
    redirect('/app');
  }

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear() - 1, now.getMonth(), 1);

  const fromDate = searchParams.from ? new Date(searchParams.from) : defaultFrom;
  const toDate = searchParams.to ? new Date(searchParams.to + 'T23:59:59') : now;
  const dateFilter = { gte: fromDate, lte: toDate };

  const [voucherPurchases, ticketPurchases, redemptionCount] = await Promise.all([
    prisma.voucherPurchase.findMany({
      where: { merchantId: merchant.id, status: 'paid', createdAt: dateFilter },
      select: { amount: true, platformFeeAmount: true, currency: true, createdAt: true },
    }),
    prisma.ticketPurchase.findMany({
      where: { merchantId: merchant.id, status: 'paid', createdAt: dateFilter },
      select: { amount: true, currency: true, createdAt: true },
    }),
    prisma.redemption.count({
      where: { merchantId: merchant.id, confirmedAt: { not: null, ...dateFilter } },
    }),
  ]);

  // Group totals by currency
  const currencyTotals = new Map<string, { revenue: number; fees: number; net: number }>();
  for (const p of voucherPurchases) {
    const c = p.currency;
    const e = currencyTotals.get(c) ?? { revenue: 0, fees: 0, net: 0 };
    const fee = p.platformFeeAmount ?? 0;
    e.revenue += p.amount; e.fees += fee; e.net += p.amount - fee;
    currencyTotals.set(c, e);
  }
  for (const p of ticketPurchases) {
    const c = p.currency;
    const e = currencyTotals.get(c) ?? { revenue: 0, fees: 0, net: 0 };
    e.revenue += p.amount; e.net += p.amount;
    currencyTotals.set(c, e);
  }

  const currencies = [...currencyTotals.keys()];
  const primaryCurrency = currencies[0] ?? 'EUR';
  const primary = currencyTotals.get(primaryCurrency) ?? { revenue: 0, fees: 0, net: 0 };

  // Monthly breakdown
  const monthCount = Math.min(
    Math.ceil((toDate.getTime() - fromDate.getTime()) / (30 * 24 * 60 * 60 * 1000)) + 1,
    24
  );
  const months: Array<{ month: string; vouchers: number; tickets: number; total: number }> = [];
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(toDate.getFullYear(), toDate.getMonth() - i, 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const label = d.toLocaleDateString('en', { year: 'numeric', month: 'short' });
    const vRev = voucherPurchases
      .filter((p) => p.createdAt >= d && p.createdAt <= monthEnd)
      .reduce((sum, p) => sum + p.amount, 0);
    const tRev = ticketPurchases
      .filter((p) => p.createdAt >= d && p.createdAt <= monthEnd)
      .reduce((sum, p) => sum + p.amount, 0);
    months.push({ month: label, vouchers: vRev, tickets: tRev, total: vRev + tRev });
  }

  const fmt = (v: number) => (v / 100).toFixed(2);

  const exportParams = new URLSearchParams();
  if (searchParams.from) exportParams.set('from', searchParams.from);
  if (searchParams.to) exportParams.set('to', searchParams.to);
  const exportHref = `/api/merchant/${params.slug}/reports/export${exportParams.size ? `?${exportParams}` : ''}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Financial Reports</h1>
          <p className="text-sm text-[var(--text-muted)]">Revenue overview and export</p>
        </div>
        <WarmButton asChild variant="outline" size="sm">
          <Link href={exportHref}>
            <Download className="h-4 w-4 mr-2" /> Download CSV
          </Link>
        </WarmButton>
      </div>

      {/* Date range filter */}
      <WarmCard padding="md" className="bg-white">
        <form className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">From</label>
            <input
              type="date"
              name="from"
              defaultValue={searchParams.from ?? fromDate.toISOString().split('T')[0]}
              className="border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-1.5 text-sm text-[var(--text)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">To</label>
            <input
              type="date"
              name="to"
              defaultValue={searchParams.to ?? now.toISOString().split('T')[0]}
              className="border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-1.5 text-sm text-[var(--text)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            />
          </div>
          <WarmButton type="submit" size="sm">Apply</WarmButton>
        </form>
      </WarmCard>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Revenue', value: `${fmt(primary.revenue)} ${primaryCurrency}`, icon: DollarSign, color: 'border-b-[var(--primary)]' },
          { label: 'Platform Fees', value: `${fmt(primary.fees)} ${primaryCurrency}`, icon: Percent, color: 'border-b-[var(--danger)]' },
          { label: 'Net Revenue', value: `${fmt(primary.net)} ${primaryCurrency}`, icon: TrendingUp, color: 'border-b-[var(--success)]' },
          { label: 'Redemptions', value: String(redemptionCount), icon: CheckCircle, color: 'border-b-[#9DB5A5]' },
        ].map((stat) => (
          <WarmCard key={stat.label} padding="lg" className={`bg-white border-b-4 ${stat.color}`}>
            <div className="flex items-center gap-2">
              <stat.icon className="h-4 w-4 text-[var(--text-muted)]" />
              <span className="text-sm font-medium text-[var(--text-muted)]">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-[var(--text)] mt-2">{stat.value}</div>
          </WarmCard>
        ))}
      </div>

      {/* Multi-currency breakdown */}
      {currencies.length > 1 && (
        <WarmCard padding="lg" className="bg-white">
          <h2 className="text-base font-semibold text-[var(--text)] mb-3">Revenue by Currency</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {currencies.map((cur) => {
              const t = currencyTotals.get(cur)!;
              return (
                <div key={cur} className="p-3 bg-[var(--surface-dim)] rounded-xl">
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">{cur}</div>
                  <div className="text-lg font-bold text-[var(--text)]">{fmt(t.revenue)}</div>
                  <div className="text-xs text-[var(--text-faint)]">Net: {fmt(t.net)} &bull; Fees: {fmt(t.fees)}</div>
                </div>
              );
            })}
          </div>
        </WarmCard>
      )}

      {/* Monthly table */}
      <WarmCard padding="lg" className="bg-white overflow-x-auto">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Monthly Revenue</h2>
        {months.every((m) => m.total === 0) ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">No revenue data for this period.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 text-[var(--text-muted)] font-medium">Month</th>
                <th className="text-right py-2 text-[var(--text-muted)] font-medium">Vouchers</th>
                <th className="text-right py-2 text-[var(--text-muted)] font-medium">Tickets</th>
                <th className="text-right py-2 text-[var(--text-muted)] font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.month} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 text-[var(--text)]">{m.month}</td>
                  <td className="py-2 text-right text-[var(--text)]">{fmt(m.vouchers)}</td>
                  <td className="py-2 text-right text-[var(--text)]">{fmt(m.tickets)}</td>
                  <td className="py-2 text-right font-medium text-[var(--text)]">{fmt(m.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </WarmCard>
    </div>
  );
}
