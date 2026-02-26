import { redirect } from 'next/navigation';
import { requireMerchantProfileAccessBySlug, AccessControlError } from '@/lib/access-control';
import { prisma } from '@/lib/prisma';
import { WarmCard } from '@/components/warm-card';
import { Users, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default async function CustomersPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>
}) {
  const { slug } = await Promise.resolve(params);

  let merchant: { id: string; name: string; defaultCurrency: string };
  try {
    const access = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');
    const merchantRecord = await prisma.merchant.findUnique({
      where: { id: access.merchant.id },
      select: { defaultCurrency: true },
    });
    merchant = { id: access.merchant.id, name: access.merchant.name, defaultCurrency: merchantRecord?.defaultCurrency || 'EUR' };
  } catch (error) {
    if (error instanceof AccessControlError && error.status === 401) {
      redirect('/login');
    }
    redirect('/app');
  }

  // Fetch customer data server-side
  const purchases = await prisma.voucherPurchase.groupBy({
    by: ['userId'],
    where: {
      merchantId: merchant.id,
      status: 'paid',
    },
    _count: { id: true },
    _sum: { amount: true },
    _max: { createdAt: true },
  });

  const redemptions = await prisma.redemption.groupBy({
    by: ['redeemedByUserId'],
    where: {
      merchantId: merchant.id,
      confirmedAt: { not: null },
      redeemedByUserId: { not: null },
    },
    _count: { _all: true },
  });

  const redemptionMap = new Map(
    redemptions.map((r) => [r.redeemedByUserId!, r._count._all])
  );

  const userIds = purchases.map((p) => p.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  const customers = purchases
    .map((p) => {
      const user = userMap.get(p.userId);
      return {
        userId: p.userId,
        name: user?.name || 'Unknown',
        email: user?.email || '',
        purchases: p._count.id,
        totalSpent: p._sum.amount || 0,
        lastPurchase: p._max.createdAt,
        redemptions: redemptionMap.get(p.userId) || 0,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent);

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#2D2721]">Customers</h1>
          <p className="text-sm text-[#6B5744]">
            {totalCustomers} customers &middot; {formatCurrency(totalRevenue, merchant.defaultCurrency)} total revenue
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <WarmCard padding="lg" className="bg-white">
          <div className="text-sm font-semibold text-[#8B7355]">Total Customers</div>
          <div className="text-3xl font-bold text-[#2D2721] mt-1">{totalCustomers}</div>
        </WarmCard>
        <WarmCard padding="lg" className="bg-white">
          <div className="text-sm font-semibold text-[#8B7355]">Total Revenue</div>
          <div className="text-3xl font-bold text-[#2D2721] mt-1">{formatCurrency(totalRevenue, merchant.defaultCurrency)}</div>
        </WarmCard>
        <WarmCard padding="lg" className="bg-white">
          <div className="text-sm font-semibold text-[#8B7355]">Total Redemptions</div>
          <div className="text-3xl font-bold text-[#2D2721] mt-1">{customers.reduce((s, c) => s + c.redemptions, 0)}</div>
        </WarmCard>
      </div>

      <WarmCard padding="none" className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(139,115,85,0.15)] bg-[#FFF9ED]/50">
                <th className="text-left px-4 py-3 font-semibold text-[#8B7355]">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-[#8B7355]">Email</th>
                <th className="text-right px-4 py-3 font-semibold text-[#8B7355]">Purchases</th>
                <th className="text-right px-4 py-3 font-semibold text-[#8B7355]">Total Spent</th>
                <th className="text-right px-4 py-3 font-semibold text-[#8B7355]">Redemptions</th>
                <th className="text-right px-4 py-3 font-semibold text-[#8B7355]">Last Purchase</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-[#8B7355]/50" />
                      <span className="text-[#6B5744]">No customers yet</span>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.userId} className="border-b border-[rgba(139,115,85,0.08)] hover:bg-[#FFF9ED]/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#2D2721]">{customer.name}</td>
                    <td className="px-4 py-3 text-[#6B5744]">{customer.email}</td>
                    <td className="px-4 py-3 text-right text-[#2D2721]">{customer.purchases}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#2D2721]">{formatCurrency(customer.totalSpent, merchant.defaultCurrency)}</td>
                    <td className="px-4 py-3 text-right text-[#2D2721]">{customer.redemptions}</td>
                    <td className="px-4 py-3 text-right text-[#6B5744]">
                      {customer.lastPurchase
                        ? new Date(customer.lastPurchase).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </WarmCard>
    </div>
  );
}
