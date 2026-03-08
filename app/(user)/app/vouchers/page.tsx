import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WarmCard } from '@/components/warm-card';
import { Ticket } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { getCurrencyLocale } from '@/lib/i18n-utils';
import Link from 'next/link';
import { VoucherCard } from './voucher-card';

export default async function MyVouchersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const locale = await getLocale();
  const tVoucher = await getTranslations('voucher');

  const purchases = await prisma.voucherPurchase.findMany({
    where: {
      userId: session.user.id,
      status: 'paid',
    },
    include: {
      voucher: {
        include: {
          merchant: true,
          campaign: true,
          redemptions: {
            where: { confirmedAt: { not: null } },
            select: { id: true },
            take: 1,
          },
        },
      },
      merchant: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat(getCurrencyLocale(locale), {
      style: 'currency',
      currency,
    }).format(amount / 100);

  const formatDate = (date: Date) =>
    date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  // Categorize vouchers
  const now = new Date();
  const categorized = purchases.map((p) => {
    const voucher = p.voucher;
    const validTo = voucher?.validTo ? new Date(voucher.validTo) : null;
    const isExpired = validTo && validTo < now;
    const isUsed = (voucher?.redemptions?.length ?? 0) > 0;

    let status: 'active' | 'expired' | 'used' = 'active';
    if (isUsed) status = 'used';
    else if (isExpired) status = 'expired';

    return { ...p, displayStatus: status, validTo };
  });

  const activeVouchers = categorized.filter((v) => v.displayStatus === 'active');
  const pastVouchers = categorized.filter((v) => v.displayStatus !== 'active');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">{tVoucher('myVouchers')}</h1>
        <p className="text-sm text-[var(--text-muted)]">{tVoucher('myVouchersDescription')}</p>
      </div>

      {purchases.length === 0 ? (
        <WarmCard padding="lg" className="bg-white text-center text-[var(--text-muted)]">
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-14 h-14 rounded-full bg-[#FFF9ED] flex items-center justify-center">
              <Ticket className="h-6 w-6 text-[#8B7355]" />
            </div>
            <div>{tVoucher('noVouchers')}</div>
            <Link
              href="/app"
              className="text-sm text-[var(--primary)] hover:underline font-medium"
            >
              {tVoucher('browseVouchers')}
            </Link>
          </div>
        </WarmCard>
      ) : (
        <>
          {activeVouchers.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[var(--text)] mb-3">
                {tVoucher('activeVouchers')} ({activeVouchers.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeVouchers.map((purchase) => {
                  const voucher = purchase.voucher;
                  const merchantName = voucher?.merchant?.name || purchase.merchant?.name || 'Unknown';
                  const statusConfig = {
                    active: { variant: 'success' as const, label: tVoucher('published') },
                    expired: { variant: 'muted' as const, label: tVoucher('expired') },
                    used: { variant: 'secondary' as const, label: tVoucher('redeemed') },
                  };
                  const s = statusConfig[purchase.displayStatus];
                  return (
                    <VoucherCard
                      key={purchase.id}
                      id={purchase.id}
                      voucherId={voucher?.id ?? null}
                      amount={purchase.amount}
                      currency={purchase.currency}
                      validTo={purchase.validTo}
                      displayStatus={purchase.displayStatus}
                      merchantName={merchantName}
                      title={voucher?.campaign?.name || tVoucher('title')}
                      description={voucher?.campaign?.description ?? null}
                      statusLabel={s.label}
                      statusVariant={s.variant}
                      paidLabel={tVoucher('paid')}
                      freeLabel={tVoucher('free')}
                      formattedAmount={`${tVoucher('paid')}: ${formatCurrency(purchase.amount, purchase.currency)}`}
                      formattedDate={purchase.validTo ? formatDate(purchase.validTo) : null}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {pastVouchers.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[var(--text)] mb-3">
                {tVoucher('pastVouchers')} ({pastVouchers.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pastVouchers.map((purchase) => {
                  const voucher = purchase.voucher;
                  const merchantName = voucher?.merchant?.name || purchase.merchant?.name || 'Unknown';
                  const statusConfig = {
                    active: { variant: 'success' as const, label: tVoucher('published') },
                    expired: { variant: 'muted' as const, label: tVoucher('expired') },
                    used: { variant: 'secondary' as const, label: tVoucher('redeemed') },
                  };
                  const s = statusConfig[purchase.displayStatus];
                  return (
                    <VoucherCard
                      key={purchase.id}
                      id={purchase.id}
                      voucherId={voucher?.id ?? null}
                      amount={purchase.amount}
                      currency={purchase.currency}
                      validTo={purchase.validTo}
                      displayStatus={purchase.displayStatus}
                      merchantName={merchantName}
                      title={voucher?.campaign?.name || tVoucher('title')}
                      description={voucher?.campaign?.description ?? null}
                      statusLabel={s.label}
                      statusVariant={s.variant}
                      paidLabel={tVoucher('paid')}
                      freeLabel={tVoucher('free')}
                      formattedAmount={`${tVoucher('paid')}: ${formatCurrency(purchase.amount, purchase.currency)}`}
                      formattedDate={purchase.validTo ? formatDate(purchase.validTo) : null}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

