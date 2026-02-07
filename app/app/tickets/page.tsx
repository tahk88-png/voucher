import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { getTranslations } from 'next-intl/server';

export default async function MyTicketsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const t = await getTranslations('analytics');

  const ticketPurchases = await prisma.ticketPurchase.findMany({
    where: {
      userId: session.user.id,
      status: 'paid',
    },
    include: {
      ticket: {
        include: {
          event: {
            include: { merchant: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#2D2721]">{t('myTickets')}</h1>
          <p className="text-sm text-[#6B5744]">{t('myTicketsDescription')}</p>
        </div>

        {ticketPurchases.length === 0 ? (
          <WarmCard padding="lg" className="bg-white">
            <div className="py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-[#FFF9ED] flex items-center justify-center mx-auto">
                <svg
                  className="h-8 w-8 text-[#8B7355]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-[#2D2721] mb-2">{t('noTickets')}</h3>
                <p className="text-sm text-[#6B5744]">{t('noTicketsDescription')}</p>
              </div>
            </div>
          </WarmCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ticketPurchases.map((purchase) => (
              <WarmCard key={purchase.id} padding="lg" className="bg-white border border-[#E7DCC7]">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[#2D2721]">
                      #{purchase.ticket.ticketNumber}
                    </h2>
                    <p className="text-sm text-[#6B5744]">{purchase.ticket.event.name}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#8B7355]">{t('event')}:</span>
                      <span className="font-medium text-[#2D2721]">
                        {purchase.ticket.event.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B7355]">{t('date')}:</span>
                      <span className="font-medium text-[#2D2721]">
                        {new Date(purchase.ticket.event.eventDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B7355]">{t('status')}:</span>
                      <span className="font-medium capitalize text-[#2D2721]">
                        {purchase.ticket.status}
                      </span>
                    </div>
                    {purchase.ticket.event.location && (
                      <div className="flex justify-between">
                        <span className="text-[#8B7355]">{t('location')}:</span>
                        <span className="font-medium text-[#2D2721] truncate ml-2">
                          {purchase.ticket.event.location}
                        </span>
                      </div>
                    )}
                  </div>
                  <WarmButton asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/tickets/${purchase.ticketId}`}>{t('viewTicket')}</Link>
                  </WarmButton>
                </div>
              </WarmCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
