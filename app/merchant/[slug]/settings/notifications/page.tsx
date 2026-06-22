import { pageMetadata } from '@/lib/seo/page-metadata';
export const metadata = pageMetadata({ title: 'Notification preferences', noIndex: true });

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import {
  MERCHANT_NOTIFICATION_CATEGORIES,
  resolvePrefs,
} from '@/lib/merchant-notifications';
import NotificationPreferencesForm from './notifications-form';

export default async function MerchantNotificationsPage({
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
    select: { id: true, slug: true, name: true },
  });
  if (!merchant) {
    notFound();
  }

  // merchant_staff can manage *their own* prefs.
  await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

  const member = await prisma.merchantMember.findUnique({
    where: { merchantId_userId: { merchantId: merchant.id, userId: session.user.id } },
    select: { notificationPrefs: true },
  });
  const preferences = resolvePrefs(member?.notificationPrefs);

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: `/merchant/${merchant.slug}/dashboard` },
            { label: 'Settings', href: `/merchant/${merchant.slug}/settings` },
            { label: 'Notifications' },
          ]}
        />
        <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">
          Notification preferences
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Control which email categories arrive in your inbox as a member of{' '}
          <span className="font-medium text-[var(--text)]">{merchant.name}</span>.
          Preferences are personal — each team member manages their own.
        </p>

        <NotificationPreferencesForm
          merchantSlug={merchant.slug}
          categories={MERCHANT_NOTIFICATION_CATEGORIES}
          initialPreferences={preferences}
        />
      </div>
    </div>
  );
}
