import { pageMetadata } from '@/lib/seo/page-metadata';
export const metadata = pageMetadata({ title: 'Merchant Payouts', noIndex: true });

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { getTranslations } from 'next-intl/server';
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
  label: string;
  color: 'green' | 'amber' | 'red' | 'gray';
  icon: typeof CheckCircle2;
  description: string;
};

function badgeFor(
  status: string | null | undefined,
  payoutsEnabled: boolean,
): StatusBadge {
  if (payoutsEnabled) {
    return {
      label: 'Payouts enabled',
      color: 'green',
      icon: CheckCircle2,
      description:
        'Funds from voucher sales are transferred to your bank account by Stripe on the scheduled payout cadence.',
    };
  }
  if (status === 'restricted') {
    return {
      label: 'Additional info required',
      color: 'amber',
      icon: AlertCircle,
      description:
        'Stripe needs more information before payouts can be enabled. Open the onboarding link below to continue.',
    };
  }
  if (status === 'disabled') {
    return {
      label: 'Payouts disabled',
      color: 'red',
      icon: AlertCircle,
      description:
        'Stripe has disabled payouts on this account. Open the Stripe dashboard to resolve the outstanding requirements.',
    };
  }
  return {
    label: 'Not connected',
    color: 'gray',
    icon: Clock,
    description:
      "You haven't connected a Stripe account yet. Payouts are held until onboarding is complete — in the meantime voucher sales still process but funds stay on the platform balance.",
  };
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
            { label: 'Payouts' },
          ]}
        />
        <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">Payouts</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Connect a Stripe account so voucher sales are paid directly to your bank.
          We take a 5% platform fee; the rest is transferred to your connected
          account automatically at checkout time.
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
              <h2 className="text-base font-semibold text-[var(--text)]">{badge.label}</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{badge.description}</p>

              {merchant.stripeAccountId ? (
                <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-[var(--text)]">Stripe account</dt>
                    <dd className="font-mono text-[var(--text-muted)]">{merchant.stripeAccountId}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-[var(--text)]">Capability state</dt>
                    <dd className="text-[var(--text-muted)]">
                      {merchant.stripeAccountStatus ?? 'pending'}
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
              <Link href={`/merchant/${slug}/settings`}>Back to settings</Link>
            </WarmButton>
          </div>
        </WarmCard>

        <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--text)]">How payouts work</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-muted)] list-disc pl-5">
            <li>
              Customers pay on the platform checkout. We collect the full amount
              and hold it on Stripe&apos;s side.
            </li>
            <li>
              On successful capture, Stripe transfers the net (sale price minus
              our 5% fee) directly to your connected account via
              <span className="font-mono"> transfer_data</span>.
            </li>
            <li>
              Stripe pays out to your bank on the cadence configured in your
              Express dashboard (typically daily, with a 2-day rolling reserve).
            </li>
            <li>
              Chargebacks and refunds net out of your next payout; the admin
              team can place a manual hold on your balance if we detect fraud.
            </li>
          </ul>
        </WarmCard>
      </div>
    </div>
  );
}
