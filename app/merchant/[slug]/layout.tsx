import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import MerchantShell from '@/components/navigation/merchant-shell';

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
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/app')}`);
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug: p.slug },
  });

  if (!merchant) {
    notFound();
  }

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

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
        userLabel={session.user.email ?? session.user.name ?? 'User'}
        stats={[
          { label: 'Active Users', value: activeUsers.toString() },
          { label: 'Campaigns', value: campaigns.toString() },
          { label: 'Vouchers', value: vouchers.toString() },
          { label: 'Engagement', value: `${engagement}%` },
        ]}
      >
        {children}
      </MerchantShell>
    </NextIntlClientProvider>
  );
}
