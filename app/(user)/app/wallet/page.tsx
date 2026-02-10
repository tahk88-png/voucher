import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WarmCard } from '@/components/warm-card';
import { Wallet } from 'lucide-react';
import { getCreditBalance } from '@/lib/credits';
import { getLocale, getTranslations } from 'next-intl/server';
import { getCurrencyLocale } from '@/lib/i18n-utils';

export default async function WalletPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const sessionUser = session.user;
  const userId = sessionUser.id;

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      merchantMembers: {
        include: {
          merchant: true,
        },
      },
    },
  });
  if (!user) {
    redirect('/login');
  }
  const locale = await getLocale();
  const tNav = await getTranslations('nav');
  const tWallet = await getTranslations('wallet');

  const merchantBalances = await Promise.all(
    (user.merchantMembers ?? []).map(async (member) => {
      try {
        const merchantId = member.merchant?.id ?? '';
        if (!merchantId) return { member, balance: null };
        const balance = await getCreditBalance(userId, merchantId);
        return { member, balance };
      } catch {
        return { member, balance: null };
      }
    })
  );

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat(getCurrencyLocale(locale), {
      style: 'currency',
      currency,
    }).format(amount / 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#2D2721]">{tNav('wallet')}</h1>
        <p className="text-sm text-[#6B5744]">{tWallet('pageDescription')}</p>
      </div>

      {merchantBalances.length === 0 ? (
        <WarmCard padding="lg" className="bg-white text-center text-[#6B5744]">
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-14 h-14 rounded-full bg-[#FFF9ED] flex items-center justify-center">
              <Wallet className="h-6 w-6 text-[#8B7355]" />
            </div>
            <div>{tWallet('noMerchantWallets')}</div>
          </div>
        </WarmCard>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {merchantBalances.map(({ member, balance }) => {
            const currency = balance?.currency || member.merchant.defaultCurrency || 'USD';
            return (
              <WarmCard key={member.merchantId} padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[#2D2721]">{member.merchant.name}</h2>
                    <p className="text-xs text-[#8B7355]">Role: {member.role}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-[#8B7355] font-semibold">{tWallet('available')}</div>
                      <div className="text-lg font-semibold text-[#2D2721]">
                        {formatCurrency(balance?.available ?? 0, currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-[#8B7355] font-semibold">{tWallet('locked')}</div>
                      <div className="text-lg font-semibold text-[#2D2721]">
                        {formatCurrency(balance?.locked ?? 0, currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-[#8B7355] font-semibold">{tWallet('total')}</div>
                      <div className="text-lg font-semibold text-[#2D2721]">
                        {formatCurrency(balance?.total ?? 0, currency)}
                      </div>
                    </div>
                  </div>

                  {balance?.credits?.length ? (
                    <div className="border-t border-[#F0E2C9] pt-4 space-y-2">
                      {balance.credits.slice(0, 3).map((credit) => (
                        <div key={credit.id} className="flex items-center justify-between text-sm text-[#6B5744]">
                          <span>{credit.status}</span>
                          <span>{formatCurrency(credit.amount, currency)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-[#8B7355]">{tWallet('noCredits')}</div>
                  )}
                </div>
              </WarmCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
