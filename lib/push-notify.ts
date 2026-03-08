import { prisma } from '@/lib/prisma';
import { sendPushNotification, isWebPushConfigured } from './web-push';

export async function pushNotifyUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  if (!isWebPushConfigured()) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  for (const sub of subscriptions) {
    try {
      await sendPushNotification(sub, payload);
    } catch (error: any) {
      // Subscription expired or invalid - clean up
      if (error?.statusCode === 410 || error?.statusCode === 404) {
        await prisma.pushSubscription
          .delete({ where: { id: sub.id } })
          .catch(() => {});
      }
    }
  }
}
