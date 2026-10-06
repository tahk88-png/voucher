import { pageMetadata } from '@/lib/seo/page-metadata';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('merchantSettings.notifications');
  return pageMetadata({ title: t('metaTitle'), noIndex: true });
}

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
  const t = await getTranslations('merchantSettings.notifications');
  const tNav = await getTranslations('nav');

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <Breadcrumbs
          items={[
            { label: tNav('dashboard'), href: `/merchant/${merchant.slug}/dashboard` },
            { label: tNav('settings'), href: `/merchant/${merchant.slug}/settings` },
            { label: tNav('notifications') },
          ]}
        />
        <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">
          {t('title')}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          {t.rich('intro', {
            merchantName: merchant.name,
            name: (chunks) => <span className="font-medium text-[var(--text)]">{chunks}</span>,
          })}
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
