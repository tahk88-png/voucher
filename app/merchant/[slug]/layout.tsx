import type { Metadata } from 'next';
import { logger } from '@/lib/logger';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import MerchantShell from '@/components/navigation/merchant-shell';
import { AccessControlError, requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { setMerchantAccess } from '@/lib/merchant-context';
import { normalizeCurrency } from '@/lib/money-input';
import { MerchantSettingsProvider } from './_components/merchant-settings-context';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function MerchantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const p = await Promise.resolve(params);
  let access;
  try {
    access = await requireMerchantProfileAccessBySlug(p.slug, 'merchant_staff');
  } catch (error) {
    if (error instanceof AccessControlError) {
      if (error.status === 401) {
        redirect(`/login?callbackUrl=${encodeURIComponent('/app')}`);
      }
      if (error.status === 404) {
        notFound();
      }
    }
    redirect('/app');
  }

  const { merchant, profile, effectiveRole } = access;

  // Store in request-scoped cache for sub-page access
  setMerchantAccess({
    merchantId: merchant.id,
    merchantSlug: p.slug,
    merchantName: merchant.name,
    effectiveRole,
    userId: profile.userId,
  });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  // Real merchant metrics. The bar used to show team members as "Active Users"
  // and redemptions per team member as "Engagement", which meant nothing.
  const [merchantSettings, campaigns, vouchers, redemptions30d] = await Promise.all([
    prisma.merchant.findUnique({ where: { id: merchant.id }, select: { defaultCurrency: true } }),
    prisma.campaign.count({ where: { merchantId: merchant.id, status: 'active', endDate: { gte: now } } }),
    prisma.voucher.count({
      where: { merchantId: merchant.id, status: 'published', validFrom: { lte: now }, validTo: { gte: now } },
    }),
    prisma.redemption.count({
      where: { merchantId: merchant.id, confirmedAt: { not: null, gte: thirtyDaysAgo } },
    }),
  ]);
  const defaultCurrency = normalizeCurrency(merchantSettings?.defaultCurrency);

  // Get messages for client components
  let messages;
  try {
    messages = await getMessages();
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('[MerchantLayout] getMessages failed', { error: err instanceof Error ? err.message : String(err) });
    }
    messages = {};
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <MerchantShell
        slug={p.slug}
        merchantName={merchant.name}
        userLabel={profile.email ?? profile.userId}
        tenantRole={effectiveRole}
        stats={[
          { label: 'Active campaigns', value: campaigns.toString(), icon: 'campaigns' },
          { label: 'Live vouchers', value: vouchers.toString(), icon: 'vouchers' },
          { label: 'Redemptions (30 days)', value: redemptions30d.toString(), icon: 'redemptions' },
        ]}
      >
        <MerchantSettingsProvider value={{ slug: p.slug, defaultCurrency }}>{children}</MerchantSettingsProvider>
      </MerchantShell>
    </NextIntlClientProvider>
  );
}
