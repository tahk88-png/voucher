import { pageMetadata } from '@/lib/seo/page-metadata';
export const metadata = pageMetadata({ title: 'Notification Settings', noIndex: true });

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import NotificationSettingsForm from './notification-settings-form';

export default async function NotificationSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const t = await getTranslations('notifications');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      merchantMembers: {
        include: { merchant: true },
      },
      notificationSubscriptions: true,
    },
  });

  const subscriptions =
    user?.merchantMembers.map((member) => {
      const existing = user.notificationSubscriptions.find(
        (sub) => sub.merchantId === member.merchantId
      );
      return {
        merchantId: member.merchantId,
        merchantSlug: member.merchant.slug,
        merchantName: member.merchant.name,
        emailEnabled: existing?.emailEnabled ?? true,
        inAppEnabled: existing?.inAppEnabled ?? true,
        pushEnabled: existing?.pushEnabled ?? false,
      };
    }) ?? [];

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#2D2721]">{t('settingsTitle')}</h1>
          <p className="text-sm text-[#6B5744]">{t('settingsDescription')}</p>
        </div>
        <NotificationSettingsForm initialSubscriptions={subscriptions} />
      </div>
    </div>
  );
}
