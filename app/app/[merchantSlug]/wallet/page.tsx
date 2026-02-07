import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getCreditBalance } from '@/lib/credits';
import { getMerchantBySlug } from '@/lib/tenant';
import { formatCurrency } from '@/lib/utils';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';

export default async function WalletPage({ params }: { params: { merchantSlug: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const merchant = await getMerchantBySlug(params.merchantSlug);
  if (!merchant) notFound();

  const balance = await getCreditBalance(session.user.id, merchant.id);
  const available = balance.available;
  const locked = balance.locked;
  const hasAvailable = available > 0;

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold text-[#2D2721] mb-1">{merchant.name}</h1>
        <p className="text-sm text-[#6B5744] mb-6">Credit wallet</p>

        <WarmCard padding="lg" className="bg-white mb-8 border border-[#E7DCC7]">
          <p className="text-sm font-medium text-[#8B7355] mb-1">Available to use</p>
          <p className="text-4xl sm:text-5xl font-semibold tabular-nums tracking-tight text-[#2D2721]">
            {formatCurrency(available, balance.currency)}
          </p>
          <WarmButton
            asChild
            className="mt-4 h-12 px-6 text-base font-medium"
            disabled={!hasAvailable}
          >
            <Link href={`/app/${params.merchantSlug}/checkout-demo`}>
              {hasAvailable ? 'Use credit' : 'No credit to use'}
            </Link>
          </WarmButton>
        </WarmCard>

        {locked > 0 && (
          <WarmCard padding="lg" className="mb-8 bg-[#FFF9ED] border border-[#E7DCC7]">
            <p className="text-sm font-medium text-[#8B7355]">Locked</p>
            <p className="text-2xl font-semibold tabular-nums text-[#2D2721] mt-2">
              {formatCurrency(locked, balance.currency)}
            </p>
            <p className="text-sm text-[#6B5744] mt-1">
              Unlocks when the linked purchase is confirmed.
            </p>
          </WarmCard>
        )}

        <WarmCard padding="lg" className="bg-white border border-[#E7DCC7]">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[#2D2721]">Credit history</h2>
            <p className="text-sm text-[#6B5744]">Ledger for {merchant.name}</p>
          </div>
          {balance.credits.length === 0 ? (
            <div className="py-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#FFF9ED] flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-[#8B7355]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-[#6B5744]">No credit history yet.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {balance.credits.map((credit) => (
                <div
                  key={credit.id}
                  className="flex justify-between items-start py-3 border-b border-[#F2EDE3] last:border-0"
                >
                  <div>
                    <p className="font-medium tabular-nums text-[#2D2721]">
                      {formatCurrency(credit.amount, balance.currency)}
                    </p>
                    <p className="text-sm text-[#8B7355] capitalize">{credit.status}</p>
                  </div>
                  {credit.expiresAt && (
                    <p className="text-xs text-[#8B7355]">
                      Expires{' '}
                      {new Date(credit.expiresAt).toLocaleDateString(undefined, {
                        dateStyle: 'medium',
                      })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </WarmCard>
      </div>
    </div>
  );
}
