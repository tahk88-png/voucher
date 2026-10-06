import { pageMetadata } from '@/lib/seo/page-metadata';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WarmCard } from '@/components/warm-card';
import { Badge } from '@/components/ui/badge';
import { Coins, Clock, Lock, TrendingUp, AlertTriangle } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { getCurrencyLocale } from '@/lib/i18n-utils';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account');
  return pageMetadata({ title: t('cashback.metaTitle'), noIndex: true });
}

/**
 * /app/cashback
 *
 * Cross-merchant cashback overview. Shows everything the user has
 * earned across every merchant, grouped by merchant with status
 * buckets (available / locked / used) and an "expiring soon" callout
 * for credits that lapse within 30 days.
 *
 * Credits are currently minted by the referral flow; any future
 * cashback source (purchase rebates, loyalty rewards) will slot into
 * the same CreditLedger and surface here automatically.
 */
export default async function CashbackPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const locale = await getLocale();
  const intlLocale = getCurrencyLocale(locale);
  const tWallet = await getTranslations('wallet');
  const t = await getTranslations('account');

  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const credits = await prisma.creditLedger.findMany({
    where: { userId: session.user.id },
    include: {
      merchant: {
        select: { id: true, slug: true, name: true, defaultCurrency: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Aggregate per merchant.
  type MerchantBucket = {
    merchantId: string;
    slug: string;
    name: string;
    currency: string;
    available: number;
    locked: number;
    used: number;
    latestActivity: Date;
  };
  const byMerchant = new Map<string, MerchantBucket>();
  for (const c of credits) {
    const existing = byMerchant.get(c.merchantId) ?? {
      merchantId: c.merchantId,
      slug: c.merchant.slug,
      name: c.merchant.name,
      currency: c.currency || c.merchant.defaultCurrency || 'EUR',
      available: 0,
      locked: 0,
      used: 0,
      latestActivity: c.createdAt,
    };
    if (c.status === 'available') existing.available += c.amount;
    else if (c.status === 'locked') existing.locked += c.amount;
    else if (c.status === 'used') existing.used += c.amount;
    if (c.createdAt > existing.latestActivity) existing.latestActivity = c.createdAt;
    byMerchant.set(c.merchantId, existing);
  }
  const merchantList = Array.from(byMerchant.values()).sort(
    (a, b) => b.available + b.locked - (a.available + a.locked),
  );

  const totalAvailable = credits
    .filter((c) => c.status === 'available')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalLocked = credits
    .filter((c) => c.status === 'locked')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalUsed = credits
    .filter((c) => c.status === 'used')
    .reduce((sum, c) => sum + c.amount, 0);

  const expiringSoon = credits.filter(
    (c) =>
      c.status === 'available' && c.expiresAt && c.expiresAt > now && c.expiresAt <= soon,
  );

  // Pick the dominant currency for display of the global totals. If
  // the user has mixed currencies we show them separately in the
  // per-merchant cards and render "—" in the headline tiles to avoid
  // a misleading summed number.
  const uniqueCurrencies = new Set(credits.map((c) => c.currency));
  const headlineCurrency =
    uniqueCurrencies.size === 1 ? [...uniqueCurrencies][0] : null;

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency,
    }).format(amount / 100);

  const renderHeadline = (amount: number) =>
    headlineCurrency ? formatCurrency(amount, headlineCurrency) : '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#2D2721]">{t('cashback.title')}</h1>
        <p className="text-sm text-[#6B5744]">{t('cashback.description')}</p>
      </div>

      {credits.length === 0 ? (
        <WarmCard padding="lg" className="bg-white text-center">
          <div className="flex flex-col items-center gap-3 py-8 text-[#6B5744]">
            <div className="w-14 h-14 rounded-full bg-[#FFF9ED] flex items-center justify-center">
              <Coins className="h-6 w-6 text-[#8B7355]" />
            </div>
            <div>{tWallet('noCreditYetBody')}</div>
            <Link
              href="/campaigns"
              className="text-sm font-medium text-[#8B7355] hover:underline"
            >
              {tWallet('findVoucherToShare')}
            </Link>
          </div>
        </WarmCard>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FFF9ED] flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-[#8B7355]" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-[#8B7355] font-semibold">
                    {tWallet('available')}
                  </div>
                  <div className="text-xl font-semibold text-[#2D2721]">
                    {renderHeadline(totalAvailable)}
                  </div>
                </div>
              </div>
            </WarmCard>

            <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FFF9ED] flex items-center justify-center">
                  <Lock className="h-5 w-5 text-[#8B7355]" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-[#8B7355] font-semibold">
                    {t('cashback.lockedPending')}
                  </div>
                  <div className="text-xl font-semibold text-[#2D2721]">
                    {renderHeadline(totalLocked)}
                  </div>
                </div>
              </div>
            </WarmCard>

            <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FFF9ED] flex items-center justify-center">
                  <Clock className="h-5 w-5 text-[#8B7355]" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-[#8B7355] font-semibold">
                    {t('cashback.used')}
                  </div>
                  <div className="text-xl font-semibold text-[#2D2721]">
                    {renderHeadline(totalUsed)}
                  </div>
                </div>
              </div>
            </WarmCard>
          </div>

          {expiringSoon.length > 0 && (
            <WarmCard padding="lg" className="bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-amber-900">
                    {t('cashback.expiringTitle')}
                  </h2>
                  <ul className="mt-2 space-y-1 text-sm text-amber-900">
                    {expiringSoon.map((c) => (
                      <li key={c.id} className="flex justify-between gap-4">
                        <span>
                          {c.expiresAt
                            ? t('cashback.expiresOn', {
                                merchant: c.merchant.name,
                                date: new Intl.DateTimeFormat(intlLocale).format(c.expiresAt),
                              })
                            : t('cashback.expiresSoon', { merchant: c.merchant.name })}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(c.amount, c.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </WarmCard>
          )}

          <div>
            <h2 className="text-lg font-semibold text-[#2D2721] mb-3">{t('cashback.byMerchant')}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {merchantList.map((m) => (
                <WarmCard
                  key={m.merchantId}
                  padding="lg"
                  className="bg-white border border-[rgba(139,115,85,0.15)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#2D2721]">{m.name}</h3>
                      <p className="text-xs text-[#8B7355]">
                        {t('cashback.lastActivity', {
                          date: new Intl.DateTimeFormat(intlLocale).format(m.latestActivity),
                        })}
                      </p>
                    </div>
                    {m.available > 0 ? (
                      <Badge variant="secondary" className="bg-[#FFF9ED] text-[#8B7355]">
                        {t('cashback.readyToSpend')}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-[#8B7355]">{tWallet('available')}</div>
                      <div className="font-semibold text-[#2D2721]">
                        {formatCurrency(m.available, m.currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#8B7355]">{tWallet('locked')}</div>
                      <div className="font-semibold text-[#2D2721]">
                        {formatCurrency(m.locked, m.currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#8B7355]">{t('cashback.used')}</div>
                      <div className="font-semibold text-[#2D2721]">
                        {formatCurrency(m.used, m.currency)}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/app/${m.slug}/wallet`}
                    className="mt-4 inline-block text-sm font-medium text-[#8B7355] hover:underline"
                  >
                    {t('cashback.viewMerchantWallet')}
                  </Link>
                </WarmCard>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
