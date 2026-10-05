import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import GiftCardQr from '@/components/gift-card-qr';
import { formatCurrency } from '@/lib/utils';
import { normalizeGiftCardCode } from '@/lib/gift-cards';
import { getLocale, getTranslations } from 'next-intl/server';

const KNOWN_STATUSES = ['active', 'redeemed', 'expired', 'cancelled'];

export default async function GiftCardDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const merchant = await prisma.merchant.findUnique({ where: { slug } });
  if (!merchant) notFound();

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

  const giftCard = await prisma.giftCard.findFirst({
    where: { id, merchantId: merchant.id },
  });

  if (!giftCard) notFound();

  const code = normalizeGiftCardCode(giftCard.code);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redeemUrl = `${baseUrl}/redeem/gift-card/${code}`;

  const t = await getTranslations('merchantGiftCards');
  const tNav = await getTranslations('nav');
  const locale = await getLocale();
  const dateLocale = locale === 'en' ? 'en-GB' : locale;
  const statusText = KNOWN_STATUSES.includes(giftCard.status)
    ? t(`status.${giftCard.status}`)
    : giftCard.status;

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Breadcrumbs
          items={[
            { label: tNav('dashboard'), href: `/merchant/${slug}/dashboard` },
            { label: tNav('giftCards'), href: `/merchant/${slug}/gift-cards` },
            { label: code },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">{t('detail.title')}</h1>
            <p className="text-sm text-[var(--text-muted)]">{t('detail.code', { code })}</p>
          </div>
          <div className="flex gap-2">
            <WarmButton asChild variant="outline">
              <Link href={`/g/${code}`}>{t('detail.publicView')}</Link>
            </WarmButton>
            <WarmButton asChild variant="outline">
              <Link href={`/merchant/${slug}/gift-cards/new`}>{t('detail.newGiftCard')}</Link>
            </WarmButton>
          </div>
        </div>

        <WarmCard padding="lg" className="bg-[var(--surface)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text)]">{t('detail.detailsTitle')}</h2>
            <span
              className={`px-2 py-1 text-xs font-bold rounded-full ${
                giftCard.status === 'active'
                  ? 'bg-[#9DB5A5] text-white'
                  : giftCard.status === 'expired'
                  ? 'bg-[var(--danger)] text-white'
                  : 'bg-[#F2EDE3] text-[var(--text-faint)]'
              }`}
            >
              {statusText}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-[var(--text-faint)]">{t('detail.value')}</p>
              <p className="text-lg font-semibold text-[var(--text)]">
                {formatCurrency(giftCard.amount, giftCard.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-faint)]">{t('detail.validFrom')}</p>
              <p className="text-lg font-semibold text-[var(--text)]">
                {giftCard.validFrom.toLocaleDateString(dateLocale)}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-faint)]">{t('detail.validTo')}</p>
              <p className="text-lg font-semibold text-[var(--text)]">
                {giftCard.validTo ? giftCard.validTo.toLocaleDateString(dateLocale) : t('detail.noExpiry')}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-faint)]">{t('detail.redeemedAt')}</p>
              <p className="text-lg font-semibold text-[var(--text)]">
                {giftCard.redeemedAt ? giftCard.redeemedAt.toLocaleDateString(dateLocale) : t('detail.notRedeemed')}
              </p>
            </div>
          </div>
        </WarmCard>

        <WarmCard padding="lg" className="bg-[var(--surface)]">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{t('detail.qrTitle')}</h2>
          <div className="flex flex-col items-center gap-4 text-center">
            <GiftCardQr qrText={redeemUrl} />
            <p className="text-sm text-[var(--text-muted)]">
              {t('detail.qrHelp')}
            </p>
            <p className="text-xs text-[var(--text-faint)] break-all">{redeemUrl}</p>
          </div>
        </WarmCard>
      </div>
    </div>
  );
}
