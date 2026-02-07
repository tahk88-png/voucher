import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { safeParseJson } from '@/lib/utils';
import { isPlatformAdmin } from '@/lib/admin';
import { WarmCard } from '@/components/warm-card';
import { AuditLogPayload } from '@/types';
import MerchantsTable from './merchants-table';
import AuditLogView from './audit-log-view';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!isPlatformAdmin(session.user.email)) {
    redirect('/app');
  }

  const [merchantCount, userCount, voucherCount, redemptionCount, recentAuditLogs] = await Promise.all([
    prisma.merchant.count(),
    prisma.user.count(),
    prisma.voucher.count(),
    prisma.redemption.count({
      where: { confirmedAt: { not: null } },
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

  // Serialize dates to strings and parse payloadJson for client component
  const serializedAuditLogs = recentAuditLogs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
    payloadJson: safeParseJson<AuditLogPayload>(log.payloadJson),
  }));

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
            <span className="text-[#2D2721] font-bold text-lg">A</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#2D2721]">Platform Admin</h1>
            <p className="text-[#6B5744]">Overview of merchants, users, and voucher activity.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[
            { label: 'Merchants', value: merchantCount, accent: 'border-b-[#FFC857]' },
            { label: 'Users', value: userCount, accent: 'border-b-[#9DB5A5]' },
            { label: 'Vouchers', value: voucherCount, accent: 'border-b-[#E17B5C]' },
            { label: 'Redemptions', value: redemptionCount, accent: 'border-b-[#F5C98E]' },
          ].map((stat) => (
            <WarmCard key={stat.label} padding="lg" className={`bg-white border-b-4 ${stat.accent}`}>
              <div className="text-sm font-semibold text-[#8B7355]">{stat.label}</div>
              <div className="text-3xl font-bold text-[#2D2721] mt-2">{stat.value}</div>
            </WarmCard>
          ))}
        </div>

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
