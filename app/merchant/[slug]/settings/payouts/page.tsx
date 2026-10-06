import { pageMetadata } from '@/lib/seo/page-metadata';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('merchantSettings.payouts');
  return pageMetadata({ title: t('metaTitle'), noIndex: true });
}

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import PayoutActions from './payout-actions';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

/**
 * Merchant payouts settings.
 *
 * Shows Stripe Connect status and gives the merchant admin the means to
 * either (a) start/continue onboarding, (b) open the Stripe dashboard,
 * or (c) disconnect. Server-renders the cached status so the page is
 * fast even before any API calls; `PayoutActions` is the client-side
 * shim that kicks off the various onboarding / dashboard API calls.
 */

type StatusBadge = {
  /** Key under merchantSettings.payouts.badge for the label/description. */
  key: 'enabled' | 'restricted' | 'disabled' | 'notConnected';
  color: 'green' | 'amber' | 'red' | 'gray';
  icon: typeof CheckCircle2;
};

const ACCOUNT_STATUSES = ['pending', 'restricted', 'enabled', 'disabled'] as const;
type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

function isAccountStatus(status: string): status is AccountStatus {
  return (ACCOUNT_STATUSES as readonly string[]).includes(status);
}

function badgeFor(
  status: string | null | undefined,
  payoutsEnabled: boolean,
): StatusBadge {
  if (payoutsEnabled) {
    return { key: 'enabled', color: 'green', icon: CheckCircle2 };
  }
  if (status === 'restricted') {
    return { key: 'restricted', color: 'amber', icon: AlertCircle };
  }
  if (status === 'disabled') {
    return { key: 'disabled', color: 'red', icon: AlertCircle };
  }
  return { key: 'notConnected', color: 'gray', icon: Clock };
}

export default async function PayoutsSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      stripeAccountId: true,
      stripeAccountStatus: true,
      payoutsEnabled: true,
    },
  });
  if (!merchant) {
    notFound();
  }

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_admin');

  const t = await getTranslations('nav');
  const tp = await getTranslations('merchantSettings.payouts');
  const accountStatus = merchant.stripeAccountStatus ?? 'pending';

  const badge = badgeFor(merchant.stripeAccountStatus, merchant.payoutsEnabled);
  const Icon = badge.icon;

  const badgeClass = {
    green: 'bg-green-50 text-green-800 border-green-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  }[badge.color];

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: t('dashboard'), href: `/merchant/${slug}/dashboard` },
            { label: t('settings'), href: `/merchant/${slug}/settings` },
            { label: tp('title') },
          ]}
        />
        <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">{tp('title')}</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          {tp('intro')}
        </p>

        <WarmCard padding="lg" className="mb-4 bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border ${badgeClass}`}
              aria-hidden
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-[var(--text)]">{tp(`badge.${badge.key}.label`)}</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{tp(`badge.${badge.key}.description`)}</p>

              {merchant.stripeAccountId ? (
                <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-[var(--text)]">{tp('stripeAccount')}</dt>
                    <dd className="font-mono text-[var(--text-muted)]">{merchant.stripeAccountId}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-[var(--text)]">{tp('capabilityState')}</dt>
                    <dd className="text-[var(--text-muted)]">
                      {isAccountStatus(accountStatus) ? tp(`accountStatus.${accountStatus}`) : accountStatus}
                    </dd>
                  </div>
                </dl>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <PayoutActions
              slug={merchant.slug}
              hasAccount={!!merchant.stripeAccountId}
              payoutsEnabled={merchant.payoutsEnabled}
            />
            <WarmButton asChild size="sm" variant="outline">
              <Link href={`/merchant/${slug}/settings`}>{tp('backToSettings')}</Link>
            </WarmButton>
          </div>
        </WarmCard>

        <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--text)]">{tp('howTitle')}</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-muted)] list-disc pl-5">
            <li>{tp('how1')}</li>
            <li>{tp('how2')}</li>
            <li>{tp('how3')}</li>
            <li>{tp('how4')}</li>
          </ul>
        </WarmCard>
      </div>
    </div>
  );
}
