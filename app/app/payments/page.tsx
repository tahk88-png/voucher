import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Receipt, Ticket, Gift } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const t = await getTranslations('payment');

  const [voucherPurchases, ticketPurchases] = await Promise.all([
    prisma.voucherPurchase.findMany({
      where: { userId: session.user.id },
      include: {
        voucher: {
          include: { merchant: true },
        },
        campaign: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.ticketPurchase.findMany({
      where: { userId: session.user.id },
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
      take: 50,
    }),
  ]);

  const allPayments = [
    ...voucherPurchases.map((p) => ({
      id: p.id,
      type: 'voucher' as const,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      createdAt: p.createdAt,
      item: p.voucher
        ? {
            name: p.campaign?.name || 'Voucher',
            id: p.voucher.id,
            merchant: p.voucher.merchant.name,
            url: `/v/${p.voucher.id}`,
          }
        : null,
    })),
    ...ticketPurchases.map((p) => ({
      id: p.id,
      type: 'ticket' as const,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      createdAt: p.createdAt,
      item: {
        name: p.ticket.event.name,
        id: p.ticket.id,
        merchant: p.ticket.event.merchant.name,
        url: `/app/tickets`,
      },
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const statusStyles: Record<string, string> = {
    paid: 'bg-[#9DB5A5]/20 text-[#2D2721]',
    pending: 'bg-[#FFE5B4] text-[#6B5744]',
    failed: 'bg-[#F7C6B0] text-[#2D2721]',
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#2D2721]">{t('paymentHistory')}</h1>
          <p className="text-sm text-[#6B5744]">{t('paymentHistoryDescription')}</p>
        </div>

        {allPayments.length === 0 ? (
          <WarmCard padding="lg" className="bg-white text-center">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-[#8B7355]" />
            <p className="text-[#2D2721] mb-2 font-medium">{t('noPayments')}</p>
            <p className="text-sm text-[#6B5744] mb-4">{t('noPaymentsDescription')}</p>
            <WarmButton asChild variant="outline">
              <Link href="/">{t('browseVouchers')}</Link>
            </WarmButton>
          </WarmCard>
        ) : (
          <div className="space-y-4">
            {allPayments.map((payment) => (
              <WarmCard key={payment.id} padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2 rounded-[12px] bg-[#FFF9ED]">
                      {payment.type === 'voucher' ? (
                        <Gift className="h-5 w-5 text-[#E17B5C]" />
                      ) : (
                        <Ticket className="h-5 w-5 text-[#E17B5C]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[#2D2721]">
                          {payment.item?.name || t('unknownItem')}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[payment.status] || 'bg-[#FFF9ED] text-[#8B7355]'}`}
                        >
                          {payment.status}
                        </span>
                      </div>
                      <p className="text-sm text-[#6B5744] mb-1">{payment.item?.merchant}</p>
                      <p className="text-xs text-[#8B7355]">
                        {new Date(payment.createdAt).toLocaleDateString(undefined, {
                          dateStyle: 'long',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-lg text-[#2D2721]">
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                    {payment.item?.url && (
                      <WarmButton variant="ghost" size="sm" asChild className="mt-2">
                        <Link href={payment.item.url}>{t('view')}</Link>
                      </WarmButton>
                    )}
                  </div>
                </div>
              </WarmCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
