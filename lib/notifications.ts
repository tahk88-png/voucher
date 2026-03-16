import { prisma } from './prisma';
import { sendMerchantAnnouncement } from './emails';
import { sendBulkNotifications } from '@/lib/notifications-smart';

export type MerchantAnnouncementType = 'voucher_published' | 'campaign_started';

type AnnouncementInput = {
  merchantId: string;
  type: MerchantAnnouncementType;
  title: string;
  body: string;
  url?: string;
};

export async function dispatchMerchantAnnouncement(input: AnnouncementInput): Promise<void> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: input.merchantId },
    select: { name: true },
  });

  if (!merchant) return;

  const subscriptions = await prisma.notificationSubscription.findMany({
    where: { merchantId: input.merchantId },
    include: { user: true },
  });

  if (subscriptions.length === 0) return;

  // Use smart scheduling: merchant announcements are non-urgent, so each
  // user receives the notification at their optimal engagement time.
  const inAppUserIds = subscriptions
    .filter((sub) => sub.inAppEnabled)
    .map((sub) => sub.userId);

  if (inAppUserIds.length > 0) {
    await sendBulkNotifications(inAppUserIds, {
      merchantId: input.merchantId,
      type: input.type,
      title: input.title,
      body: input.body,
      url: input.url || undefined,
      urgent: false,
    });
  }

  const emailTargets = subscriptions.filter((sub) => sub.emailEnabled && sub.user.email);
  for (const sub of emailTargets) {
    await sendMerchantAnnouncement({
      to: sub.user.email,
      merchantName: merchant.name,
      title: input.title,
      body: input.body,
      ctaUrl: input.url || '',
      type: input.type,
    });
  }
}
