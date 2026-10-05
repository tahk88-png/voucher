import { pageMetadata } from '@/lib/seo/page-metadata';
import { getLocale, getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('merchantSettings.page');
  return pageMetadata({ title: t('metaTitle'), noIndex: true });
}

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { safeParseJson } from '@/lib/utils';
import { requireMerchantRole } from '@/lib/rbac';
import { getMerchantBillingStatus } from '@/lib/billing';
import { isStripeConfigured } from '@/lib/stripe';
import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import BrandProfileEditor from './brand-profile-editor';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
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
  const tp = await getTranslations('merchantSettings.page');
  const locale = await getLocale();
  const displayLocale = locale === 'et' ? 'et-EE' : 'en-GB';

  const brandColors = safeParseJson(merchant.brandColorsJson) as {
    primary?: string;
    secondary?: string;
    background?: string;
  } | null;

  const billing = await getMerchantBillingStatus(merchant.id);
  const dateFmt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const trialEndsAt = billing.trialEndsAt ? billing.trialEndsAt.toLocaleDateString(displayLocale, dateFmt) : null;
  const periodEndsAt = billing.currentPeriodEnd
    ? billing.currentPeriodEnd.toLocaleDateString(displayLocale, dateFmt)
    : null;
  let countryName = merchant.country;
  try {
    countryName = new Intl.DisplayNames([displayLocale], { type: 'region' }).of(merchant.country.toUpperCase()) ?? merchant.country;
  } catch {
    // Not an ISO region code: show it as stored.
  }
  const trialDaysLeft = billing.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(billing.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;
  // billing.active is also true during a trial, so check the trial first.
  const billingStatusLabel = billing.inTrial
    ? tp('trialStatus', { days: trialDaysLeft })
    : billing.active
      ? tp('statusActive')
      : tp('statusInactive');

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
            <h2 className="text-base font-semibold text-[var(--text)]">{tp('infoTitle')}</h2>
            <p className="text-sm text-[var(--text-muted)]">{tp('infoSubtitle')}</p>
          </div>
          <div className="space-y-4 mt-4">
            <div>
              <p className="text-sm font-medium text-[var(--text)]">{tp('name')}</p>
              <p className="text-[var(--text-muted)]">{merchant.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">{tp('slug')}</p>
              <p className="text-[var(--text-muted)]">{merchant.slug}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">{tp('country')}</p>
              <p className="text-[var(--text-muted)]">{countryName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">{tp('defaultCurrency')}</p>
              <p className="text-[var(--text-muted)]">{merchant.defaultCurrency}</p>
            </div>
            {merchant.website && (
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{tp('website')}</p>
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
                <p className="text-sm font-medium text-[var(--text)]">{tp('supportEmail')}</p>
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
                <Link href={`/merchant/${slug}/onboarding`}>{tp('completeOnboarding')}</Link>
              </WarmButton>
            </div>
          )}
        </WarmCard>

        <WarmCard padding="lg" className="mb-4 bg-[var(--surface)] border border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">{tp('billingTitle')}</h2>
            <p className="text-sm text-[var(--text-muted)]">
              {tp('billingSubtitle')}
            </p>
          </div>
          <div className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{tp('status')}</p>
                <p className="text-[var(--text-muted)]">{billingStatusLabel}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{tp('currentPlan')}</p>
                <p className="text-[var(--text-muted)]">{billing.plan.label}</p>
              </div>
              {trialEndsAt && billing.inTrial ? (
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{tp('trialEnds')}</p>
                  <p className="text-[var(--text-muted)]">{trialEndsAt}</p>
                </div>
              ) : null}
              {periodEndsAt && billing.active ? (
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{tp('periodEnds')}</p>
                  <p className="text-[var(--text-muted)]">{periodEndsAt}</p>
                </div>
              ) : null}
            </div>
            {billing.active && billing.stripeCustomerId && isStripeConfigured() ? (
              <ManageBillingButton slug={slug} />
            ) : null}
          </div>

          <PlanSelector
            slug={slug}
            currentTier={billing.planTier}
            billingState={billing.billingState}
            hasStripeCustomer={!!billing.stripeCustomerId}
            billingAvailable={isStripeConfigured()}
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
                <h2 className="text-base font-semibold text-[var(--text)]">{tp('payoutsTitle')}</h2>
                <p className="text-sm text-[var(--text-muted)]">
                  {merchant.payoutsEnabled
                    ? tp('payoutsEnabled')
                    : merchant.stripeAccountId
                      ? tp('payoutsInProgress')
                      : tp('payoutsNotConnected')}
                </p>
              </div>
            </div>
            <WarmButton asChild size="sm" variant="outline">
              <Link href={`/merchant/${slug}/settings/payouts`}>{tp('manage')}</Link>
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
                <h2 className="text-base font-semibold text-[var(--text)]">{tp('webhooksTitle')}</h2>
                <p className="text-sm text-[var(--text-muted)]">{tp('webhooksSubtitle')}</p>
              </div>
            </div>
            <WarmButton asChild size="sm" variant="outline">
              <Link href={`/merchant/${slug}/settings/webhooks`}>{tp('manage')}</Link>
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
                <h2 className="text-base font-semibold text-[var(--text)]">{tp('notificationsTitle')}</h2>
                <p className="text-sm text-[var(--text-muted)]">
                  {tp('notificationsSubtitle')}
                </p>
              </div>
            </div>
            <WarmButton asChild size="sm" variant="outline">
              <Link href={`/merchant/${slug}/settings/notifications`}>{tp('manage')}</Link>
            </WarmButton>
          </div>
        </WarmCard>

        <BrandProfileEditor merchant={merchant} brandColors={brandColors} />
      </div>
    </div>
  );
}
