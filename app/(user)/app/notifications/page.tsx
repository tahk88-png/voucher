import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { getLocale, getTranslations } from 'next-intl/server';
import { MarkAllReadButton } from './mark-all-read-button';

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const locale = await getLocale();
  const tNav = await getTranslations('nav');
  const t = await getTranslations('notifications');

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#2D2721]">{tNav('notifications')}</h1>
            <p className="text-sm text-[#6B5744]">{t('description')}</p>
          </div>
          <MarkAllReadButton label={t('markAllRead')} />
        </div>

        {notifications.length === 0 ? (
          <WarmCard padding="lg" className="bg-white text-center text-[#6B5744]">
            {t('empty')}
          </WarmCard>
        ) : (
          notifications.map((note) => (
            <WarmCard
              key={note.id}
              padding="lg"
              className={`bg-white ${note.readAt ? 'border border-[rgba(139,115,85,0.15)]' : 'border border-[#FFC857]'}`}
            >
              <div className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold text-[#2D2721]">{note.title}</h2>
                </div>
                <p className="text-sm text-[#6B5744]">{note.body}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8B7355]">{note.createdAt.toLocaleString(locale)}</span>
                  {note.url ? (
                    <WarmButton asChild variant="outline" size="sm">
                      <Link href={note.url}>{t('view')}</Link>
                    </WarmButton>
                  ) : null}
                </div>
              </div>
            </WarmCard>
          ))
        )}
      </div>
    </div>
  );
}
