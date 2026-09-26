import type { Metadata } from 'next';
import { logger } from '@/lib/logger';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import MerchantShell from '@/components/navigation/merchant-shell';
import { AccessControlError, requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { setMerchantAccess } from '@/lib/merchant-context';

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
  const [activeUsers, campaigns, vouchers, redemptions] = await Promise.all([
    prisma.merchantMember.count({ where: { merchantId: merchant.id } }),
    prisma.campaign.count({ where: { merchantId: merchant.id, status: 'active', endDate: { gte: now } } }),
    prisma.voucher.count({
      where: { merchantId: merchant.id, status: 'published', validFrom: { lte: now }, validTo: { gte: now } },
    }),
    prisma.redemption.count({ where: { merchantId: merchant.id, confirmedAt: { not: null } } }),
  ]);

  // The real ratio. It used to be clamped to 10-99% and showed 75% with no users,
  // which put an invented number on every empty dashboard.
  const engagement = activeUsers ? `${Math.round((redemptions / activeUsers) * 100)}%` : '—';
  const tNav = await getTranslations('nav');
  const tAnalytics = await getTranslations('analytics');

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
          { label: tAnalytics('activeUsers'), value: activeUsers.toString() },
          { label: tNav('campaigns'), value: campaigns.toString() },
          { label: tNav('vouchers'), value: vouchers.toString() },
          { label: tAnalytics('engagement'), value: engagement },
        ]}
      >
        {children}
      </MerchantShell>
    </NextIntlClientProvider>
  );
}
