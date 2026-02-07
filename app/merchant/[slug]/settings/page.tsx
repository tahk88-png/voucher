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
import { StartSubscriptionButton, ManageBillingButton } from '@/components/billing-actions';
import DomainManager from './domain-manager';

export default async function SettingsPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug: params.slug },
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
  const billingStatusLabel = billing.active ? 'Active' : billing.inTrial ? 'Trial' : 'Inactive';

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
            { label: t('dashboard'), href: `/merchant/${params.slug}/dashboard` },
            { label: t('settings') },
          ]}
        />
        <h1 className="text-2xl font-semibold text-[#2D2721] mb-6">{t('settings')}</h1>

        <WarmCard padding="lg" className="mb-4 bg-white border border-[#E7DCC7]">
          <div>
            <h2 className="text-base font-semibold text-[#2D2721]">Merchant information</h2>
            <p className="text-sm text-[#6B5744]">Basic merchant details</p>
          </div>
          <div className="space-y-4 mt-4">
            <div>
              <p className="text-sm font-medium text-[#2D2721]">Name</p>
              <p className="text-[#6B5744]">{merchant.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[#2D2721]">Slug</p>
              <p className="text-[#6B5744]">{merchant.slug}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[#2D2721]">Country</p>
              <p className="text-[#6B5744]">{merchant.country}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[#2D2721]">Default currency</p>
              <p className="text-[#6B5744]">{merchant.defaultCurrency}</p>
            </div>
            {merchant.website && (
              <div>
                <p className="text-sm font-medium text-[#2D2721]">Website</p>
                <p className="text-[#6B5744]">
                  <a
                    href={merchant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2D2721] underline underline-offset-2"
                  >
                    {merchant.website}
                  </a>
                </p>
              </div>
            )}
            {merchant.supportEmail && (
              <div>
                <p className="text-sm font-medium text-[#2D2721]">Support email</p>
                <p className="text-[#6B5744]">
                  <a
                    href={`mailto:${merchant.supportEmail}`}
                    className="text-[#2D2721] underline underline-offset-2"
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
                <Link href={`/merchant/${params.slug}/onboarding`}>Complete onboarding</Link>
              </WarmButton>
            </div>
          )}
        </WarmCard>

        <WarmCard padding="lg" className="mb-4 bg-white border border-[#E7DCC7]">
          <div>
            <h2 className="text-base font-semibold text-[#2D2721]">Billing</h2>
            <p className="text-sm text-[#6B5744]">
              Campaign creation is free for 60 days, then 9.90/month.
            </p>
          </div>
          <div className="space-y-4 mt-4">
            <div>
              <p className="text-sm font-medium text-[#2D2721]">Status</p>
              <p className="text-[#6B5744]">{billingStatusLabel}</p>
            </div>
            {trialEndsAt && billing.inTrial ? (
              <div>
                <p className="text-sm font-medium text-[#2D2721]">Trial ends</p>
                <p className="text-[#6B5744]">{trialEndsAt}</p>
              </div>
            ) : null}
            {periodEndsAt && billing.active ? (
              <div>
                <p className="text-sm font-medium text-[#2D2721]">Current period ends</p>
                <p className="text-[#6B5744]">{periodEndsAt}</p>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {!billing.active ? <StartSubscriptionButton slug={params.slug} /> : null}
              {billing.active || billing.stripeCustomerId ? (
                <ManageBillingButton slug={params.slug} />
              ) : null}
            </div>
          </div>
        </WarmCard>

        <DomainManager merchantSlug={merchant.slug} initialDomains={domainPayload} />

        <BrandProfileEditor merchant={merchant} brandColors={brandColors} />
      </div>
    </div>
  );
}
