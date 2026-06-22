import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMerchantBySlug } from '@/lib/tenant';
import { safeParseJson } from '@/lib/utils';
import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';

export default async function VouchersPage({ params }: { params: Promise<{ merchantSlug: string }> }) {
  const { merchantSlug } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const merchant = await getMerchantBySlug(merchantSlug);
  if (!merchant) {
    notFound();
  }

  const vouchers = await prisma.voucher.findMany({
    where: {
      merchantId: merchant.id,
      status: 'published',
      validFrom: { lte: new Date() },
      validTo: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-[#2D2721] mb-6">
          {merchant.name} - Available vouchers
        </h1>

        {vouchers.length === 0 ? (
          <WarmCard padding="lg" className="bg-white">
            <div className="py-10 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#FFF9ED] flex items-center justify-center">
                  <svg
                    className="h-8 w-8 text-[#8B7355]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#2D2721] mb-2">No vouchers available</h3>
                  <p className="text-sm text-[#6B5744]">
                    Check back later for new voucher offers from {merchant.name}.
                  </p>
                </div>
              </div>
            </div>
          </WarmCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {vouchers.map((voucher) => {
              const design = safeParseJson<Record<string, any>>(voucher.designJson);

              return (
                <WarmCard key={voucher.id} padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold text-[#2D2721]">
                        {design?.headline || 'Special offer'}
                      </h2>
                      <p className="text-sm text-[#6B5744]">
                        {design?.finePrint ||
                          `Valid until ${new Date(voucher.validTo).toLocaleDateString()}`}
                      </p>
                    </div>
                    <WarmButton asChild className="w-full">
                      <Link href={`/v/${voucher.id}`}>View and share</Link>
                    </WarmButton>
                  </div>
                </WarmCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
