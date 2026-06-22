import { pageMetadata } from '@/lib/seo/page-metadata';
export const metadata = pageMetadata({ title: 'Merchant Settings', noIndex: true });

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { safeParseJson } from '@/lib/utils';
import { requireMerchantRole } from '@/lib/rbac';
import { getMerchantBillingStatus } from '@/lib/billing';
import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import BrandProfileEditor from './brand-profile-editor';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { getTranslations } from 'next-intl/server';
import { ManageBillingButton } from '@/components/billing-actions';
import PlanSelector from '@/components/billing/plan-selector';
import DomainManager from './domain-manager';
import { Webhook, Banknote, Bell } from 'lucide-react';

export default async function SettingsPage({
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
  });

  if (!merchant) {
    notFound();
  }

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_admin');

  const t = await getTranslations('nav');

  const brandColors = safeParseJson(merchant.brandColorsJson) as {
    primary?: string;
    secondary?: string;
    background?: string;
  } | null;

  const billing = await getMerchantBillingStatus(merchant.id);
  const trialEndsAt = billing.trialEndsAt ? billing.trialEndsAt.toLocaleDateString() : null;
  const periodEndsAt = billing.currentPeriodEnd
    ? billing.currentPeriodEnd.toLocaleDateString()
    : null;
  const trialDaysLeft = billing.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(billing.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;
  const billingStatusLabel = billing.active
    ? 'Active'
    : billing.inTrial
      ? `Trial \u2014 ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} remaining`
      : 'Inactive';

  const domains = await prisma.domainMapping.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: 'desc' },
  });
  const domainPayload = domains.map((domain) => ({
    id: domain.id,
    domain: domain.domain,
    status: domain.status,
    verificationToken: domain.verificationToken,
    verifiedAt: domain.verifiedAt ? domain.verifiedAt.toISOString() : null,
  }));

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: t('dashboard'), href: `/merchant/${slug}/dashboard` },
            { label: t('settings') },
          ]}
        />
        <h1 className="text-2xl font-semibold text-[var(--text)] mb-6">{t('settings')}</h1>

        <WarmCard padding="lg" className="mb-4 bg-[var(--surface)] border border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">Merchant information</h2>
            <p className="text-sm text-[var(--text-muted)]">Basic merchant details</p>
          </div>
          <div className="space-y-4 mt-4">
            <div>
              <p className="text-sm font-medium text-[var(--text)]">Name</p>
              <p className="text-[var(--text-muted)]">{merchant.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">Slug</p>
              <p className="text-[var(--text-muted)]">{merchant.slug}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">Country</p>
              <p className="text-[var(--text-muted)]">{merchant.country}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">Default currency</p>
              <p className="text-[var(--text-muted)]">{merchant.defaultCurrency}</p>
            </div>
            {merchant.website && (
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Website</p>
                <p className="text-[var(--text-muted)]">
                  <a
                    href={merchant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text)] underline underline-offset-2"
                  >
                    {merchant.website}
                  </a>
                </p>
              </div>
            )}
            {merchant.supportEmail && (
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Support email</p>
                <p className="text-[var(--text-muted)]">
                  <a
                    href={`mailto:${merchant.supportEmail}`}
                    className="text-[var(--text)] underline underline-offset-2"
                  >
                    {merchant.supportEmail}
                  </a>
                </p>
              </div>
            )}
          </div>
          {!merchant.onboardedAt && (
            <div className="mt-4">
              <WarmButton asChild>
                <Link href={`/merchant/${slug}/onboarding`}>Complete onboarding</Link>
              </WarmButton>
            </div>
          )}
        </WarmCard>

        <WarmCard padding="lg" className="mb-4 bg-[var(--surface)] border border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">Billing</h2>
            <p className="text-sm text-[var(--text-muted)]">
              14-day free trial, then plans from &euro;19/month. 5% transaction fee on voucher sales.
            </p>
          </div>
          <div className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Status</p>
                <p className="text-[var(--text-muted)]">{billingStatusLabel}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Current plan</p>
                <p className="text-[var(--text-muted)]">{billing.plan.label}</p>
              </div>
              {trialEndsAt && billing.inTrial ? (
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Trial ends</p>
                  <p className="text-[var(--text-muted)]">{trialEndsAt}</p>
                </div>
              ) : null}
              {periodEndsAt && billing.active ? (
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Current period ends</p>
                  <p className="text-[var(--text-muted)]">{periodEndsAt}</p>
                </div>
              ) : null}
            </div>
            {billing.active && billing.stripeCustomerId ? (
              <ManageBillingButton slug={slug} />
            ) : null}
          </div>

          <PlanSelector
            slug={slug}
            currentTier={billing.planTier}
            billingState={billing.billingState}
            hasStripeCustomer={!!billing.stripeCustomerId}
          />
        </WarmCard>

        <DomainManager merchantSlug={merchant.slug} initialDomains={domainPayload} />

        <WarmCard padding="lg" className="mb-4 bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-[var(--bg)] flex items-center justify-center">
                <Banknote className="h-5 w-5 text-[var(--text-faint)]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--text)]">Payouts</h2>
                <p className="text-sm text-[var(--text-muted)]">
                  {merchant.payoutsEnabled
                    ? 'Stripe account connected and enabled'
                    : merchant.stripeAccountId
                      ? 'Onboarding in progress — finish to enable payouts'
                      : 'Connect Stripe to receive voucher sale payouts'}
                </p>
              </div>
            </div>
            <WarmButton asChild size="sm" variant="outline">
              <Link href={`/merchant/${slug}/settings/payouts`}>Manage</Link>
            </WarmButton>
          </div>
        </WarmCard>

        <WarmCard padding="lg" className="mb-4 bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-[var(--bg)] flex items-center justify-center">
                <Webhook className="h-5 w-5 text-[var(--text-faint)]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--text)]">Webhooks</h2>
                <p className="text-sm text-[var(--text-muted)]">Receive real-time event notifications via HTTP</p>
              </div>
            </div>
            <WarmButton asChild size="sm" variant="outline">
              <Link href={`/merchant/${slug}/settings/webhooks`}>Manage</Link>
            </WarmButton>
          </div>
        </WarmCard>

        <WarmCard padding="lg" className="mb-4 bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-[var(--bg)] flex items-center justify-center">
                <Bell className="h-5 w-5 text-[var(--text-faint)]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--text)]">Notifications</h2>
                <p className="text-sm text-[var(--text-muted)]">
                  Choose which email categories you receive as a team member.
                </p>
              </div>
            </div>
            <WarmButton asChild size="sm" variant="outline">
              <Link href={`/merchant/${slug}/settings/notifications`}>Manage</Link>
            </WarmButton>
          </div>
        </WarmCard>

        <BrandProfileEditor merchant={merchant} brandColors={brandColors} />
      </div>
    </div>
  );
}
