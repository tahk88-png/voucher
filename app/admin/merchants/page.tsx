import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/admin/guards';
import { AccessControlError } from '@/lib/access-control';
import { WarmCard } from '@/components/warm-card';
import MerchantsTable from '../merchants-table';
import PendingMerchants from '../pending-merchants';

export const metadata: Metadata = {
  title: 'Merchants',
  robots: { index: false, follow: false },
};

export default async function AdminMerchantsPage() {
  try {
    await requireAdminPermission('admin.merchants.read');
  } catch (error) {
    if (error instanceof AccessControlError && error.status === 401) redirect('/login');
    redirect('/admin');
  }

  const pendingMerchants = await prisma.merchant.findMany({
    where: { isActive: false },
    select: { id: true, name: true, slug: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const serializedPending = pendingMerchants.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }));

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">Merchants</h1>
          <p className="text-[#6B5744]">Activate or deactivate merchants and manage their feature flags.</p>
        </div>

        {serializedPending.length > 0 && (
          <WarmCard padding="lg" className="bg-white">
            <h2 className="text-lg font-semibold text-[#2D2721] mb-4">
              Waiting for activation ({serializedPending.length})
            </h2>
            <PendingMerchants merchants={serializedPending} />
          </WarmCard>
        )}

        <MerchantsTable />
      </div>
    </div>
  );
}
