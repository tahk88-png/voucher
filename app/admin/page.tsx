import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { safeParseJson } from '@/lib/utils';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { AuditLogPayload } from '@/types';
import MerchantsTable from './merchants-table';
import AuditLogView from './audit-log-view';
import PendingMerchants from './pending-merchants';
import { AccessControlError, requirePlatformAdminProfile } from '@/lib/access-control';
import Link from 'next/link';
import { Users, Shield } from 'lucide-react';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  try {
    await requirePlatformAdminProfile();
  } catch (error) {
    if (error instanceof AccessControlError && error.status === 401) {
      redirect('/login');
    }
    redirect('/app');
  }

  const [
    merchantCount,
    userCount,
    voucherCount,
    redemptionCount,
    revenueAgg,
    feesAgg,
    pendingMerchants,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.merchant.count(),
    prisma.user.count(),
    prisma.voucher.count(),
    prisma.redemption.count({
      where: { confirmedAt: { not: null } },
    }),
    prisma.voucherPurchase.aggregate({
      where: { status: 'paid' },
      _sum: { amount: true },
    }),
    prisma.voucherPurchase.aggregate({
      where: { status: 'paid' },
      _sum: { platformFeeAmount: true },
    }),
    prisma.merchant.findMany({
      where: { isActive: false },
      select: { id: true, name: true, slug: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.auditLog.findMany({
      take: 10,
      include: {
        actor: {
          select: {
            email: true,
            name: true,
          },
        },
        merchant: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  const totalRevenue = revenueAgg._sum.amount || 0;
  const totalFees = feesAgg._sum.platformFeeAmount || 0;

  // Serialize dates to strings and parse payloadJson for client component
  const serializedAuditLogs = recentAuditLogs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
    payloadJson: safeParseJson<AuditLogPayload>(log.payloadJson),
  }));

  const serializedPending = pendingMerchants.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
            <span className="text-[#2D2721] font-bold text-lg">A</span>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-[#2D2721]">Platform Admin</h1>
            <p className="text-[#6B5744]">Overview of merchants, users, and voucher activity.</p>
          </div>
          <div className="flex gap-2">
            <WarmButton asChild variant="outline" size="sm">
              <Link href="/admin/control-panel" className="inline-flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Control Panel
              </Link>
            </WarmButton>
            <WarmButton asChild variant="outline" size="sm">
              <Link href="/admin/users" className="inline-flex items-center gap-2">
                <Users className="h-4 w-4" />
                Manage Users
              </Link>
            </WarmButton>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6 mb-6">
          {[
            { label: 'Merchants', value: String(merchantCount), accent: 'border-b-[#FFC857]' },
            { label: 'Users', value: String(userCount), accent: 'border-b-[#9DB5A5]' },
            { label: 'Vouchers', value: String(voucherCount), accent: 'border-b-[#E17B5C]' },
            { label: 'Redemptions', value: String(redemptionCount), accent: 'border-b-[#F5C98E]' },
            { label: 'Revenue', value: `€${(totalRevenue / 100).toFixed(0)}`, accent: 'border-b-[#22C55E]' },
            { label: 'Platform Fees', value: `€${(totalFees / 100).toFixed(0)}`, accent: 'border-b-[#3B82F6]' },
          ].map((stat) => (
            <WarmCard key={stat.label} padding="lg" className={`bg-white border-b-4 ${stat.accent}`}>
              <div className="text-sm font-semibold text-[#8B7355]">{stat.label}</div>
              <div className="text-3xl font-bold text-[#2D2721] mt-2">{stat.value}</div>
            </WarmCard>
          ))}
        </div>

        {serializedPending.length > 0 && (
          <WarmCard padding="lg" className="bg-white mb-6">
            <h2 className="text-lg font-semibold text-[#2D2721] mb-4">Pending Merchants ({serializedPending.length})</h2>
            <PendingMerchants merchants={serializedPending} />
          </WarmCard>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <WarmCard padding="lg" className="bg-white">
            <MerchantsTable />
          </WarmCard>
          <WarmCard padding="lg" className="bg-white">
            <AuditLogView initialLogs={serializedAuditLogs} />
          </WarmCard>
        </div>
      </div>
    </div>
  );
}
