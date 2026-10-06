import { pageMetadata } from '@/lib/seo/page-metadata';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { WarmCard } from '@/components/warm-card';
import { isWebPushConfigured } from '../../_components/push-config';
import NotificationSettingsForm from './notification-settings-form';

export async function generateMetadata(): Promise<Metadata> {
  const tAccount = await getTranslations('account');
  return pageMetadata({ title: tAccount('notificationSettings.metaTitle'), noIndex: true });
}

export default async function NotificationSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const t = await getTranslations('notifications');

  const userId = session.user.id;

  // Per-merchant preferences: merchants the user already has settings for, plus
  // merchants they belong to. There is no account-wide preference model.
  const [existing, memberships] = await Promise.all([
    prisma.notificationSubscription.findMany({
      where: { userId },
      include: { merchant: { select: { id: true, slug: true, name: true } } },
    }),
    prisma.merchantMember.findMany({
      where: { userId },
      include: { merchant: { select: { id: true, slug: true, name: true } } },
    }),
  ]);

  const byMerchant = new Map<
    string,
    { merchantId: string; merchantSlug: string; merchantName: string; emailEnabled: boolean; inAppEnabled: boolean; pushEnabled: boolean }
  >();
  for (const sub of existing) {
    byMerchant.set(sub.merchantId, {
      merchantId: sub.merchantId,
      merchantSlug: sub.merchant.slug,
      merchantName: sub.merchant.name,
      emailEnabled: sub.emailEnabled,
      inAppEnabled: sub.inAppEnabled,
      pushEnabled: sub.pushEnabled,
    });
  }
  for (const member of memberships) {
    if (byMerchant.has(member.merchantId)) continue;
    // Defaults match the subscription API's create defaults.
    byMerchant.set(member.merchantId, {
      merchantId: member.merchantId,
      merchantSlug: member.merchant.slug,
      merchantName: member.merchant.name,
      emailEnabled: true,
      inAppEnabled: true,
      pushEnabled: false,
    });
  }
  const subscriptions = Array.from(byMerchant.values()).sort((a, b) => a.merchantName.localeCompare(b.merchantName));

  return (
    <div>
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#2D2721]">{t('settingsTitle')}</h1>
          <p className="text-sm text-[#6B5744]">{t('settingsDescription')}</p>
        </div>
        {subscriptions.length === 0 ? (
          <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)] space-y-2">
            <p className="font-medium text-[#2D2721]">{t('noPreferencesTitle')}</p>
            <p className="text-sm text-[#6B5744]">{t('noPreferencesBody')}</p>
          </WarmCard>
        ) : (
          <NotificationSettingsForm initialSubscriptions={subscriptions} pushAvailable={isWebPushConfigured()} />
        )}
      </div>
    </div>
  );
}
