import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import MerchantShell from '@/components/navigation/merchant-shell';
import { AccessControlError, requireMerchantProfileAccessBySlug } from '@/lib/access-control';

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
  params: { slug: string } | Promise<{ slug: string }>;
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

  const now = new Date();
  const [activeUsers, campaigns, vouchers, redemptions] = await Promise.all([
    prisma.merchantMember.count({ where: { merchantId: merchant.id } }),
    prisma.campaign.count({ where: { merchantId: merchant.id, status: 'active', endDate: { gte: now } } }),
    prisma.voucher.count({
      where: { merchantId: merchant.id, status: 'published', validFrom: { lte: now }, validTo: { gte: now } },
    }),
    prisma.redemption.count({ where: { merchantId: merchant.id, confirmedAt: { not: null } } }),
  ]);

  const engagement = activeUsers ? Math.min(99, Math.max(10, Math.round((redemptions / activeUsers) * 100))) : 75;
  const tNav = await getTranslations('nav');
  const tAnalytics = await getTranslations('analytics');

  // Get messages for client components
  let messages;
  try {
    messages = await getMessages();
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('[MerchantLayout] getMessages failed:', err);
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
          { label: tAnalytics('engagement'), value: `${engagement}%` },
        ]}
      >
        {children}
      </MerchantShell>
    </NextIntlClientProvider>
  );
}
